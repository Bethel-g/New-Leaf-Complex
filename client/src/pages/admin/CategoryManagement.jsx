import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FolderOpen, Plus, Edit3, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/EmptyState';
import { useTranslation } from '../../i18n';

function CategoryGrid({ items, typeLabel, onEdit, onDelete, t }) {
  return (
    <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-brand-text" />
        <h3 className="font-semibold text-gray-800">{t('admin.categories.title', { type: typeLabel })}</h3>
        <Badge color="blue">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('admin.categories.empty')}</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((c) => (
            <div key={c.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">{c.name}</div>
                {c.description && <div className="text-xs text-gray-500">{c.description}</div>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(c)} aria-label={t('admin.categories.aria.edit')} title={t('admin.categories.aria.edit')} className="p-1.5 text-gray-500 hover:text-brand-text hover:bg-primary-soft rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(c)} aria-label={t('admin.categories.aria.delete')} title={t('admin.categories.aria.delete')} className="p-1.5 text-gray-500 hover:text-red-soft-text hover:bg-red-soft rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryManagement() {
  const { t, typeLabel } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'it', description: '' });

  const loadData = () => {
    api.get('/admin/categories').then((res) => {
      setCategories(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error(t('admin.categories.error.nameRequired'));
    try {
      if (modal === 'create') {
        await api.post('/admin/categories', form);
        toast.success(t('admin.categories.toast.created'));
      } else {
        await api.put(`/admin/categories/${editingId}`, form);
        toast.success(t('admin.categories.toast.updated'));
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.toast.operationFailed'));
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(t('admin.categories.confirmDelete', { name: c.name }))) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      toast.success(t('admin.categories.toast.deleted'));
      loadData();
    } catch {
      toast.error(t('admin.categories.toast.deleteFailed'));
    }
  };

  const openEdit = (c) => {
    setModal('edit');
    setEditingId(c.id);
    setForm({ name: c.name, type: c.type, description: c.description || '' });
  };

  const itCategories = categories.filter((c) => c.type === 'it');
  const mCategories = categories.filter((c) => c.type === 'maintenance');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('admin.categories.pageTitle')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.categories.pageSubtitle')}</p>
        </div>
        <button onClick={() => { setModal('create'); setEditingId(null); setForm({ name: '', type: 'it', description: '' }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> {t('admin.categories.action.new')}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <CategoryGrid items={itCategories} typeLabel={typeLabel('it')} onEdit={openEdit} onDelete={handleDelete} t={t} />
          <CategoryGrid items={mCategories} typeLabel={typeLabel('maintenance')} onEdit={openEdit} onDelete={handleDelete} t={t} />
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? t('admin.categories.modal.addTitle') : t('admin.categories.modal.editTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.categories.form.name')}</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.categories.form.type')}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="it">{typeLabel('it')}</option>
              <option value="maintenance">{typeLabel('maintenance')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.actions.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('common.actions.save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
