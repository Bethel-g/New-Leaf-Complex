import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Settings, Save, Lock, Loader2, Timer, SlidersHorizontal, Building2, Palette } from 'lucide-react';
import api from '../../services/api';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useSettings } from '../../context/SettingsContext';
import { ACCENT_OPTIONS, DENSITY_OPTIONS } from '../../config/appearance';
import { useTranslation } from '../../i18n';

// Configurable settings that drive real behaviour. Each section is saved as a
// unit: a key that does not exist yet is created on first save.
// The English `title` / `label` stay in place because they are written to the
// backend as the stored description; `titleKey` / `labelKey` drive the UI.
const SECTIONS = [
  {
    title: 'Hospital Information',
    titleKey: 'admin.settings.section.hospital.title',
    description: 'Shown in the application header and on printed reports.',
    descriptionKey: 'admin.settings.section.hospital.description',
    icon: Building2,
    category: 'hospital',
    fields: [
      { key: 'hospital_name', label: 'Hospital name', labelKey: 'admin.settings.field.hospitalName', type: 'text', placeholder: 'e.g. New Leaf Complex', placeholderKey: 'admin.settings.field.hospitalNamePlaceholder' },
      { key: 'hospital_address', label: 'Address', labelKey: 'admin.settings.field.hospitalAddress', type: 'text', placeholder: 'Street, city', placeholderKey: 'admin.settings.field.hospitalAddressPlaceholder' },
      { key: 'hospital_phone', label: 'Contact phone', labelKey: 'admin.settings.field.hospitalPhone', type: 'text', placeholder: '+20 ...', placeholderKey: 'admin.settings.field.hospitalPhonePlaceholder' },
      { key: 'hospital_email', label: 'Contact email', labelKey: 'admin.settings.field.hospitalEmail', type: 'email', placeholder: 'info@...', placeholderKey: 'admin.settings.field.hospitalEmailPlaceholder' },
    ],
  },
  {
    title: 'SLA Targets',
    titleKey: 'admin.settings.section.sla.title',
    description: 'Deadlines used to flag overdue work on dashboards and reports.',
    descriptionKey: 'admin.settings.section.sla.description',
    icon: Timer,
    category: 'sla',
    fields: [
      { key: 'sla_critical_hours', label: 'Critical priority target (hours)', labelKey: 'admin.settings.field.slaCritical', type: 'number', min: 1 },
      { key: 'sla_high_days', label: 'High priority target (days)', labelKey: 'admin.settings.field.slaHigh', type: 'number', min: 1 },
      { key: 'sla_medium_days', label: 'Medium priority target (days)', labelKey: 'admin.settings.field.slaMedium', type: 'number', min: 1 },
      { key: 'sla_low_days', label: 'Low priority target (days)', labelKey: 'admin.settings.field.slaLow', type: 'number', min: 1 },
    ],
  },
  {
    title: 'Ticket Behaviour',
    titleKey: 'admin.settings.section.tickets.title',
    description: 'Workflow rules applied by the ticket API.',
    descriptionKey: 'admin.settings.section.tickets.description',
    icon: SlidersHorizontal,
    category: 'tickets',
    fields: [
      { key: 'require_resolution_notes', label: 'Require a resolution note when a technician resolves a ticket', labelKey: 'admin.settings.field.requireResolutionNotes', type: 'toggle' },
      { key: 'allow_requester_closure', label: 'Allow requesters to close their own resolved tickets', labelKey: 'admin.settings.field.allowRequesterClosure', type: 'toggle' },
      { key: 'notify_new_critical', label: 'Alert administrators when a Critical request is raised', labelKey: 'admin.settings.field.notifyNewCritical', type: 'toggle' },
    ],
  },
  {
    title: 'Appearance',
    titleKey: 'admin.settings.section.appearance.title',
    description: 'Brand accent and layout density applied across the application.',
    descriptionKey: 'admin.settings.section.appearance.description',
    icon: Palette,
    category: 'appearance',
    fields: [
      { key: 'appearance_accent', label: 'Brand accent', labelKey: 'admin.settings.field.brandAccent', type: 'select', options: ACCENT_OPTIONS, optionKeyPrefix: 'admin.settings.accent' },
      { key: 'appearance_density', label: 'Layout density', labelKey: 'admin.settings.field.layoutDensity', type: 'select', options: DENSITY_OPTIONS, optionKeyPrefix: 'admin.settings.density' },
      { key: 'appearance_show_requester', label: 'Show the requester column in request tables', labelKey: 'admin.settings.field.showRequesterColumn', type: 'toggle' },
    ],
  },
];

const DEFAULTS = {
  sla_critical_hours: '24',
  sla_high_days: '3',
  sla_medium_days: '7',
  sla_low_days: '7',
  require_resolution_notes: 'true',
  allow_requester_closure: 'true',
  notify_new_critical: 'false',
  appearance_accent: 'blue',
  appearance_density: 'comfortable',
  appearance_show_requester: 'true',
};

const KNOWN_KEYS = new Set(SECTIONS.flatMap((s) => s.fields.map((f) => f.key)));

// Categories used by settings that are not part of the known sections.
const CATEGORY_KEYS = {
  general: 'admin.settings.category.general',
};

function groupByCategory(settings) {
  const map = {};
  settings.forEach((s) => {
    const cat = s.category || 'general';
    if (!map[cat]) map[cat] = [];
    map[cat].push(s);
  });
  return map;
}

export default function SystemSettings() {
  const { refresh } = useSettings();
  const { t } = useTranslation();
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  const loadData = () => {
    api.get('/admin/settings').then((res) => {
      setSettings(res.data);
      const v = { ...DEFAULTS };
      res.data.forEach((s) => { v[s.key] = s.value; });
      setValues(v);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const existingFor = (key) => settings.find((s) => s.key === key);

  const persist = async (key, value, category, description) => {
    if (existingFor(key)) {
      await api.put(`/admin/settings/${encodeURIComponent(key)}`, { value });
    } else {
      await api.post('/admin/settings', { key, value, category, description });
    }
  };

  const saveSection = async (section) => {
    setSavingSection(section.title);
    try {
      for (const field of section.fields) {
        const value = values[field.key] ?? DEFAULTS[field.key] ?? '';
        await persist(field.key, String(value), section.category, field.label);
      }
      toast.success(t('admin.settings.toast.sectionSaved', { section: t(section.titleKey) }));
      loadData();
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.settings.toast.saveFailed'));
    } finally {
      setSavingSection(null);
    }
  };

  const saveSingle = async (s) => {
    setSavingKey(s.key);
    try {
      await api.put(`/admin/settings/${encodeURIComponent(s.key)}`, { value: values[s.key] });
      toast.success(t('admin.settings.toast.keyUpdated', { key: s.key }));
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.settings.toast.updateFailed'));
    } finally {
      setSavingKey(null);
    }
  };

  const setValue = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const optionLabel = (field, opt) => (field.optionKeyPrefix ? t(`${field.optionKeyPrefix}.${opt.value}`) : opt.label);

  const categoryLabel = (cat) => (CATEGORY_KEYS[cat] ? t(CATEGORY_KEYS[cat]) : cat.replace(/_/g, ' '));

  const otherGroups = groupByCategory(settings.filter((s) => !KNOWN_KEYS.has(s.key)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-text" /> {t('admin.settings.pageTitle')}
        </h2>
        <p className="text-gray-500 text-sm">{t('admin.settings.pageSubtitle')}</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-surface rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-brand-text" /> {t(section.titleKey)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t(section.descriptionKey)}</p>
                  </div>
                  <button
                    onClick={() => saveSection(section)}
                    disabled={savingSection === section.title}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 shrink-0"
                  >
                    {savingSection === section.title ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('common.actions.save')}
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.fields.map((field) => (
                    <div key={field.key} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <label htmlFor={`setting-${field.key}`} className="text-sm font-medium text-gray-800">{t(field.labelKey)}</label>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono">{field.key}</div>
                      </div>
                      {field.type === 'toggle' ? (
                        <label htmlFor={`setting-${field.key}`} className="inline-flex items-center cursor-pointer">
                          <input
                            id={`setting-${field.key}`}
                            type="checkbox"
                            checked={String(values[field.key]) === 'true'}
                            onChange={(e) => setValue(field.key, e.target.checked ? 'true' : 'false')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary-600 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                      ) : field.type === 'select' ? (
                        <select
                          id={`setting-${field.key}`}
                          value={values[field.key] ?? DEFAULTS[field.key] ?? ''}
                          onChange={(e) => setValue(field.key, e.target.value)}
                          className="w-full sm:w-72 px-3 py-2 rounded-lg border border-gray-300 text-sm bg-surface focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{optionLabel(field, opt)}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`setting-${field.key}`}
                          type={field.type}
                          min={field.min}
                          placeholder={field.placeholderKey ? t(field.placeholderKey) : field.placeholder}
                          value={values[field.key] ?? ''}
                          onChange={(e) => setValue(field.key, e.target.value)}
                          className={`w-full ${field.type === 'number' ? 'sm:w-40' : 'sm:w-72'} px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.keys(otherGroups).length === 0 ? (
            <EmptyState icon={Settings} title={t('admin.settings.empty')} />
          ) : (
            Object.keys(otherGroups).map((cat) => (
              <div key={cat} className="bg-surface rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 capitalize">{categoryLabel(cat)}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {otherGroups[cat].map((s) => (
                    <div key={s.key} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{s.key}</span>
                          {s.is_protected && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Lock className="w-3 h-3" /> {t('admin.settings.protected')}</span>
                          )}
                        </div>
                        {s.description && <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={values[s.key] ?? ''}
                          onChange={(e) => setValue(s.key, e.target.value)}
                          className="flex-1 sm:w-56 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          aria-label={t('admin.settings.aria.valueFor', { key: s.key })}
                        />
                        <button
                          onClick={() => saveSingle(s)}
                          disabled={savingKey === s.key}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                        >
                          {savingKey === s.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {t('common.actions.save')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
