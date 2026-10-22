import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Building2, Pencil, Trash2, Loader2, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { levelText } from './multimediaHelpers';

const LEVELS = ['campus', 'building', 'floor', 'ward', 'location', 'room'];

export default function MultimediaLocations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = ['it_supervisor', 'admin', 'sys_admin'].includes(user?.role_name);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', level: 'location', parent_id: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/multimedia/locations').then((res) => { setLocations(res.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = (parent) => {
    setEditing(null);
    setForm({ name: '', level: 'location', parent_id: parent ? String(parent.id) : '', description: '' });
    setModal(true);
  };

  const openEdit = (l) => {
    setEditing(l);
    setForm({ name: l.name, level: l.level, parent_id: l.parent_id ? String(l.parent_id) : '', description: l.description || '' });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error(t('multimedia.locations.toast.nameRequired'));
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/multimedia/locations/${editing.id}`, form);
        toast.success(t('multimedia.locations.toast.updated'));
      } else {
        await api.post('/multimedia/locations', form);
        toast.success(t('multimedia.locations.toast.created'));
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.locations.toast.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const destroy = async (l) => {
    if (!window.confirm(t('multimedia.locations.deleteConfirm', { name: l.name }))) return;
    try {
      await api.delete(`/multimedia/locations/${l.id}`);
      toast.success(t('multimedia.locations.toast.deleted'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.locations.toast.deleteFailed'));
    }
  };

  const renderTree = (loc, depth = 0) => {
    const children = locations.filter((x) => x.parent_id === loc.id);
    const deletable = children.length === 0 && !(Number(loc.device_count) > 0);
    return (
      <div key={loc.id}>
        <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg" style={{ marginLeft: depth * 20 }}>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <Building2 className="w-4 h-4 text-brand-text shrink-0" />
          <span className="text-sm font-medium text-gray-800">{loc.name}</span>
          <Badge color="gray">{levelText(loc.level, t)}</Badge>
          <span className="text-xs text-gray-400">{t('multimedia.locations.devicesCount', { count: loc.device_count || 0 })}</span>
          {children.length > 0 && <span className="text-xs text-gray-400">{t('multimedia.locations.childCount', { count: children.length })}</span>}
          {canManage && (
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => openCreate(loc)} className="p-1.5 text-gray-500 hover:text-brand-text hover:bg-primary-soft rounded-lg" title={t('multimedia.locations.action.addChild')}>
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => openEdit(loc)} className="p-1.5 text-gray-500 hover:text-indigo-soft-text hover:bg-indigo-soft rounded-lg" title={t('multimedia.locations.action.edit')}>
                <Pencil className="w-4 h-4" />
              </button>
              {deletable && (
                <button onClick={() => destroy(loc)} className="p-1.5 text-gray-500 hover:text-red-soft-text hover:bg-red-soft rounded-lg" title={t('multimedia.locations.action.delete')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
        {children.map((c) => renderTree(c, depth + 1))}
      </div>
    );
  };

  const roots = locations.filter((l) => !l.parent_id);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('multimedia.locations.title')}</h2>
          <p className="text-gray-500 text-sm">{t('multimedia.locations.subtitle')}</p>
        </div>
        {canManage && (
          <button onClick={() => openCreate(null)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> {t('multimedia.locations.add')}
          </button>
        )}
      </div>

      {roots.length === 0 ? (
        <EmptyState title={t('multimedia.locations.empty')} />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 p-3">
          {roots.map((r) => renderTree(r))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('multimedia.locations.modal.edit') : t('multimedia.locations.modal.add')}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.locations.form.name')} *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('multimedia.locations.form.namePlaceholder')} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.locations.form.level')}</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                {LEVELS.map((lv) => <option key={lv} value={lv}>{levelText(lv, t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.locations.form.parent')}</label>
              <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="">{t('multimedia.locations.form.parent.none')}</option>
                {editing && editing.parent_id ? null : locations.filter((l) => l.id !== editing?.id).map((l) => (
                  <option key={l.id} value={l.id}>{levelText(l.level, t)} · {l.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.locations.form.notes')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
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