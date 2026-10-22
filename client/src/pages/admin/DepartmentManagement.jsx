import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit3, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useTranslation } from '../../i18n';

export default function DepartmentManagement() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const loadData = () => {
    api.get('/admin/departments').then((res) => {
      setDepartments(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error(t('admin.departments.error.nameRequired'));
    try {
      if (modal === 'create') {
        await api.post('/admin/departments', form);
        toast.success(t('admin.departments.toast.created'));
      } else {
        await api.put(`/admin/departments/${editingId}`, form);
        toast.success(t('admin.departments.toast.updated'));
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.toast.operationFailed'));
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(t('admin.departments.confirmDelete', { name: d.name }))) return;
    try {
      await api.delete(`/admin/departments/${d.id}`);
      toast.success(t('admin.departments.toast.deleted'));
      loadData();
    } catch {
      toast.error(t('admin.departments.toast.deleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('admin.departments.pageTitle')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.departments.pageSubtitle')}</p>
        </div>
        <button onClick={() => { setModal('create'); setEditingId(null); setForm({ name: '', description: '' }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> {t('admin.departments.action.new')}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : departments.length === 0 ? (
        <EmptyState icon={Building2} title={t('admin.departments.empty')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="bg-surface rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-soft text-brand-text flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{d.name}</div>
                    {d.description && <div className="text-xs text-gray-500">{d.description}</div>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setModal('edit'); setEditingId(d.id); setForm({ name: d.name, description: d.description || '' }); }}
                    aria-label={t('admin.departments.aria.edit')}
                    title={t('admin.departments.aria.edit')}
                    className="p-1.5 text-gray-500 hover:text-brand-text hover:bg-primary-soft rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(d)} aria-label={t('admin.departments.aria.delete')} title={t('admin.departments.aria.delete')} className="p-1.5 text-gray-500 hover:text-red-soft-text hover:bg-red-soft rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? t('admin.departments.modal.addTitle') : t('admin.departments.modal.editTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.departments.form.name')}</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
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
