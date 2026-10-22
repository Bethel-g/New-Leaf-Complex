import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, statusText } from './multimediaHelpers';

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const REPEATS = [
  { value: 'none', key: 'multimedia.schedules.form.repeat.none' },
  { value: 'daily', key: 'multimedia.schedules.form.repeat.daily' },
  { value: 'weekly', key: 'multimedia.schedules.form.repeat.weekly' },
  { value: 'specific_days', key: 'multimedia.schedules.form.repeat.specific' },
];

const TARGET_KEYS = {
  device: 'multimedia.schedules.form.target.device',
  group: 'multimedia.schedules.form.target.group',
  all: 'multimedia.schedules.form.target.all',
};

const EMPTY_FORM = {
  title: '', media_id: '', target_type: 'device', target_id: '',
  start_at: '', repeat_type: 'none', repeat_days: [], time: '09:00', priority: '0',
};

export default function MultimediaSchedules() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = ['it_supervisor', 'admin', 'sys_admin'].includes(user?.role_name);

  const [schedules, setSchedules] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      api.get('/multimedia/schedules'),
      api.get('/multimedia/media', { params: { status: 'active', limit: 500 } }),
      api.get('/multimedia/devices'),
      api.get('/multimedia/groups'),
    ]).then(([s, m, d, g]) => {
      setSchedules(s.data);
      setMediaList(m.data.items || []);
      setDevices(d.data);
      setGroups(g.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleDay = (i) => {
    setForm((f) => ({
      ...f,
      repeat_days: f.repeat_days.includes(i) ? f.repeat_days.filter((x) => x !== i) : [...f.repeat_days, i],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error(t('multimedia.schedules.toast.titleRequired'));
    if (!form.media_id) return toast.error(t('multimedia.schedules.toast.mediaRequired'));
    if (form.target_type !== 'all' && !form.target_id) return toast.error(t('multimedia.schedules.toast.targetRequired'));
    if (!form.start_at && form.repeat_type === 'none') return toast.error(t('multimedia.schedules.toast.dateRequired'));
    if (form.repeat_type === 'specific_days' && form.repeat_days.length === 0) return toast.error(t('multimedia.schedules.toast.daysRequired'));
    setSaving(true);
    const startIso = form.repeat_type === 'none'
      ? new Date(form.start_at).toISOString()
      : new Date(`${form.start_at}T${form.time}`).toISOString();
    const repeatDays = form.repeat_type === 'specific_days'
      ? form.repeat_days
      : (form.repeat_type === 'weekly'
        ? [new Date(startIso).getDay()]
        : undefined);
    const payload = {
      title: form.title,
      media_id: Number(form.media_id),
      target_type: form.target_type,
      target_id: form.target_type === 'all' ? undefined : Number(form.target_id),
      priority: Number(form.priority),
      start_at: startIso,
      repeat_type: form.repeat_type,
      repeat_days: repeatDays,
      retry_count: 2,
    };
    try {
      await api.post('/multimedia/schedules', payload);
      toast.success(t('multimedia.schedules.toast.created'));
      setModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.schedules.toast.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const destroy = async (s) => {
    if (!window.confirm(t('multimedia.schedules.deleteConfirm', { title: s.title }))) return;
    try {
      await api.delete(`/multimedia/schedules/${s.id}`);
      toast.success(t('multimedia.schedules.toast.deleted'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.schedules.toast.deleteFailed'));
    }
  };

  const targetLabel = (s) => {
    if (s.target_type === 'all') return t('multimedia.schedules.form.target.all');
    if (s.target_summary && !['device', 'group'].includes(s.target_summary)) return s.target_summary;
    return TARGET_KEYS[s.target_type] ? t(TARGET_KEYS[s.target_type]) : (s.target_summary || s.target_type);
  };

  const repeatLabel = (s) => {
    if (s.repeat_type === 'daily') return t('multimedia.schedules.repeat.daily');
    if (s.repeat_type === 'weekly') return t('multimedia.schedules.repeat.weekly');
    if (s.repeat_type === 'specific_days') {
      return (s.repeat_days || '').split(',')
        .map((d) => (DAYS.includes(Number(d)) ? t(`multimedia.schedules.day.${Number(d)}`) : null))
        .filter(Boolean)
        .join(', ');
    }
    return t('multimedia.schedules.repeat.none');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('multimedia.schedules.title')}</h2>
          <p className="text-gray-500 text-sm">{t('multimedia.schedules.subtitle')}</p>
        </div>
        {canManage && (
          <button onClick={() => { setForm(EMPTY_FORM); setModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> {t('multimedia.schedules.create')}
          </button>
        )}
      </div>

      {schedules.length === 0 ? (
        <EmptyState title={t('multimedia.schedules.empty')} />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3">{t('multimedia.schedules.table.title')}</th>
                  <th className="px-4 py-3">{t('multimedia.schedules.table.media')}</th>
                  <th className="px-4 py-3">{t('multimedia.schedules.table.target')}</th>
                  <th className="px-4 py-3">{t('multimedia.schedules.table.runs')}</th>
                  <th className="px-4 py-3">{t('multimedia.schedules.table.repeat')}</th>
                  <th className="px-4 py-3">{t('multimedia.schedules.table.lastRun')}</th>
                  <th className="px-4 py-3">{t('multimedia.schedules.table.status')}</th>
                  <th className="px-4 py-3">{t('multimedia.schedules.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.title}</td>
                    <td className="px-4 py-3 text-gray-600">{s.media_title || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{targetLabel(s)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(s.start_at)}</td>
                    <td className="px-4 py-3"><Badge color="indigo">{repeatLabel(s)}</Badge></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(s.last_run_at)}</td>
                    <td className="px-4 py-3">
                      <Badge color={s.status === 'active' ? 'green' : 'gray'}>{statusText(s.status, t)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <button onClick={() => destroy(s)} className="p-1.5 text-gray-500 hover:text-red-soft-text hover:bg-red-soft rounded-lg" title={t('multimedia.schedules.action.delete')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t('multimedia.schedules.modal.create')} wide>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.title')} *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('multimedia.schedules.form.titlePlaceholder')} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.media')} *</label>
              <select value={form.media_id} onChange={(e) => setForm({ ...form, media_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="">{t('multimedia.schedules.form.media.select')}</option>
                {mediaList.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.priority')}</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="0">{t('multimedia.schedules.form.priority.normal')}</option>
                <option value="1">{t('multimedia.schedules.form.priority.high')}</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.target')}</label>
              <select value={form.target_type} onChange={(e) => { setForm({ ...form, target_type: e.target.value, target_id: '' }); }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="device">{t('multimedia.schedules.form.target.device')}</option>
                <option value="group">{t('multimedia.schedules.form.target.group')}</option>
                <option value="all">{t('multimedia.schedules.form.target.all')}</option>
              </select>
            </div>
            {form.target_type !== 'all' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.target')} *</label>
                <select value={form.target_id} onChange={(e) => setForm({ ...form, target_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                  <option value="">{t('multimedia.schedules.form.target.select')}</option>
                  {form.target_type === 'group'
                    ? groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)
                    : devices.filter((d) => d.is_active).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.repeat')}</label>
            <select value={form.repeat_type} onChange={(e) => setForm({ ...form, repeat_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              {REPEATS.map((r) => <option key={r.value} value={r.value}>{t(r.key)}</option>)}
            </select>
          </div>

          {form.repeat_type === 'none' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.datetime')} *</label>
              <input type="datetime-local" required value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.startDate')} *</label>
                <input type="date" required value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.schedules.form.time')} *</label>
                <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
            </div>
          )}

          {form.repeat_type === 'specific_days' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('multimedia.schedules.form.daysOfWeek')}</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${form.repeat_days.includes(i) ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t(`multimedia.schedules.day.${d}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.actions.cancel')}</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('multimedia.schedules.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}