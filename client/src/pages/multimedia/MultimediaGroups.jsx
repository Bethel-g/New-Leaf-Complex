import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Users, Pencil, Trash2, Loader2, MonitorCog } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { statusText } from './multimediaHelpers';

export default function MultimediaGroups() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = ['it_supervisor', 'admin', 'sys_admin'].includes(user?.role_name);

  const [groups, setGroups] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', device_ids: [] });
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.get('/multimedia/groups'), api.get('/multimedia/devices')])
      .then(([g, d]) => { setGroups(g.data); setDevices(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', device_ids: [] }); setModal(true); };
  const openEdit = async (g) => {
    setEditing(g);
    setForm({ name: g.name, description: g.description || '', device_ids: (g.devices || []).map((d) => d.id) });
    setModal(true);
    try {
      const res = await api.get(`/multimedia/groups/${g.id}`);
      const detail = res.data;
      setEditing(detail);
      setForm({ name: detail.name, description: detail.description || '', device_ids: (detail.devices || []).map((d) => d.id) });
    } catch (e) { /* keep optimistic values */ }
  };

  const toggleDevice = (id) => {
    setForm((f) => ({
      ...f,
      device_ids: f.device_ids.includes(id) ? f.device_ids.filter((x) => x !== id) : [...f.device_ids, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error(t('multimedia.groups.toast.nameRequired'));
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/multimedia/groups/${editing.id}`, { name: form.name, description: form.description });
        const current = (editing.devices || []).map((d) => d.id);
        const added = form.device_ids.filter((id) => !current.includes(id));
        const removed = current.filter((id) => !form.device_ids.includes(id));
        if (added.length) await api.post(`/multimedia/groups/${editing.id}/devices`, { device_ids: added });
        for (const id of removed) {
          await api.delete(`/multimedia/groups/${editing.id}/devices/${id}`);
        }
        toast.success(t('multimedia.groups.toast.updated'));
      } else {
        await api.post('/multimedia/groups', form);
        toast.success(t('multimedia.groups.toast.created'));
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.groups.toast.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const destroy = async (g) => {
    if (!window.confirm(t('multimedia.groups.deleteConfirm', { name: g.name }))) return;
    try {
      await api.delete(`/multimedia/groups/${g.id}`);
      toast.success(t('multimedia.groups.toast.deleted'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.groups.toast.deleteFailed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('multimedia.groups.title')}</h2>
          <p className="text-gray-500 text-sm">{t('multimedia.groups.subtitle')}</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> {t('multimedia.groups.create')}
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState title={t('multimedia.groups.empty')} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-surface rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-text" />
                  <h3 className="font-semibold text-gray-800">{g.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {canManage && (
                    <>
                      <button onClick={() => openEdit(g)} className="p-1.5 text-gray-500 hover:text-brand-text hover:bg-primary-soft rounded-lg" title={t('multimedia.groups.action.edit')}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => destroy(g)} className="p-1.5 text-gray-500 hover:text-red-soft-text hover:bg-red-soft rounded-lg" title={t('multimedia.groups.action.delete')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {g.description && <p className="text-sm text-gray-500 mt-1">{g.description}</p>}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <MonitorCog className="w-4 h-4 text-gray-400" />
                <span>{t('multimedia.groups.devicesCount', { count: g.device_count })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('multimedia.groups.modal.edit') : t('multimedia.groups.modal.create')}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.groups.form.name')} *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.groups.form.description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('multimedia.groups.form.devices', { count: form.device_ids.length })}:</label>
            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {devices.filter((d) => d.is_active).length === 0 && <div className="p-4 text-sm text-gray-400">{t('multimedia.groups.form.noActive')}</div>}
              {devices.filter((d) => d.is_active).map((d) => (
                <label key={d.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={form.device_ids.includes(d.id)} onChange={() => toggleDevice(d.id)} className="rounded border-gray-300 text-brand-text" />
                  <span className="text-sm text-gray-800">{d.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{d.location_name || statusText(d.status, t)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.actions.cancel')}</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {t('common.actions.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}