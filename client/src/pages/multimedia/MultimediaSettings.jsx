import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Settings, Save, Loader2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import { LoadingSpinner } from '../../components/EmptyState';

const FIELD_LABELS = {
  multimedia_heartbeat_timeout_minutes: 'multimedia.settings.field.heartbeatTimeout',
  multimedia_device_limit: 'multimedia.settings.field.deviceLimit',
  multimedia_allow_it_staff_commands: 'multimedia.settings.field.allowItStaff',
};

const FIELD_HELP = {
  multimedia_heartbeat_timeout_minutes: 'multimedia.settings.help.heartbeatTimeout',
  multimedia_device_limit: 'multimedia.settings.help.deviceLimit',
  multimedia_allow_it_staff_commands: 'multimedia.settings.help.allowItStaff',
};

export default function MultimediaSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/multimedia/settings').then((res) => {
      const s = res.data;
      setSettings(s);
      setValues(Object.fromEntries(s.map((x) => [x.key, x.value])));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const key of Object.keys(values)) {
        await api.put(`/multimedia/settings/${key}`, { value: values[key] });
      }
      toast.success(t('multimedia.settings.toast.saved'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.settings.toast.failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-brand-text" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('multimedia.settings.title')}</h2>
          <p className="text-gray-500 text-sm">{t('multimedia.settings.subtitle')}</p>
        </div>
      </div>

      <div className="bg-amber-soft border border-amber-soft-border rounded-lg p-4 flex items-start gap-2 text-sm text-amber-soft-text">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <span>{t('multimedia.settings.noticeBefore')} <code className="font-mono text-xs">multimedia_audit</code> {t('multimedia.settings.noticeAfter')}</span>
      </div>

      <form onSubmit={save} className="bg-surface rounded-xl border border-gray-200 divide-y divide-gray-100 max-w-2xl">
        {settings.map((s) => (
          <div key={s.key} className="p-5">
            <label className="text-sm font-medium text-gray-800">{FIELD_LABELS[s.key] ? t(FIELD_LABELS[s.key]) : s.key}</label>
            <p className="text-xs text-gray-500 mb-2">{FIELD_HELP[s.key] ? t(FIELD_HELP[s.key]) : '—'}</p>
            {s.key === 'multimedia_allow_it_staff_commands' ? (
              <select
                value={values[s.key] === 'true' ? 'true' : 'false'}
                onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
              >
                <option value="false">{t('multimedia.settings.off')}</option>
                <option value="true">{t('multimedia.settings.on')}</option>
              </select>
            ) : (
              <input
                type="number"
                min="0"
                value={values[s.key]}
                onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                className="w-40 px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            )}
          </div>
        ))}
        <div className="p-5 flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('multimedia.settings.save')}
          </button>
        </div>
      </form>
    </div>
  );
}