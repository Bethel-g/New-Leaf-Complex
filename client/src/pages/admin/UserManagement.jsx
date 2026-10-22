import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Edit3, Trash2, LockKeyhole } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useTranslation } from '../../i18n';

export default function UserManagement() {
  const { t, roleLabel } = useTranslation();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', employee_id: '', phone: '', department_id: '', role_id: '', is_active: true,
  });

  const loadData = () => {
    Promise.all([
      api.get('/users'),
      api.get('/admin/departments'),
      api.get('/admin/roles'),
    ]).then(([u, d, r]) => {
      setUsers(u.data);
      setDepartments(d.data);
      setRoles(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', employee_id: '', phone: '', department_id: '', role_id: '', is_active: true });
    setEditingId(null);
    setModal('create');
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '', employee_id: user.employee_id || '', phone: user.phone || '', department_id: user.department_id, role_id: user.role_id, is_active: user.is_active });
    setEditingId(user.id);
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await api.post('/users', form);
        toast.success(t('admin.users.toast.created'));
      } else {
        const rest = { ...form };
        delete rest.password;
        await api.put(`/users/${editingId}`, rest);
        toast.success(t('admin.users.toast.updated'));
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.toast.operationFailed'));
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(t('admin.users.confirmDelete', { name: user.name }))) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success(t('admin.users.toast.deleted'));
      loadData();
    } catch {
      toast.error(t('admin.users.toast.deleteFailed'));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${passwordModal.id}/password`, { password: passwordModal.password });
      toast.success(t('admin.users.toast.passwordUpdated'));
      setPasswordModal(null);
    } catch {
      toast.error(t('admin.users.toast.passwordUpdateFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('admin.users.pageTitle')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.users.pageSubtitle')}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> {t('admin.users.action.new')}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title={t('admin.users.empty')} />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.users.table.employeeId')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.department')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.role')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.status')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('common.labels.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-soft-strong text-brand-text-strong flex items-center justify-center text-sm font-semibold">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.employee_id || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.department_name}</td>
                    <td className="px-4 py-3">
                      <Badge color={u.role_name.includes('admin') ? 'purple' : u.role_name.includes('supervisor') ? 'blue' : 'green'}>
                        {roleLabel(u.role_name)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={u.is_active ? 'green' : 'gray'}>{u.is_active ? t('admin.users.status.active') : t('admin.users.status.inactive')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(u)} aria-label={t('admin.users.aria.edit')} title={t('admin.users.aria.edit')} className="p-1.5 text-gray-500 hover:text-brand-text hover:bg-primary-soft rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPasswordModal({ id: u.id, name: u.name, password: '' })} aria-label={t('admin.users.aria.resetPassword')} title={t('admin.users.aria.resetPassword')} className="p-1.5 text-gray-500 hover:text-blue-soft-text hover:bg-blue-soft rounded-lg">
                          <LockKeyhole className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u)} aria-label={t('admin.users.aria.delete')} title={t('admin.users.aria.delete')} className="p-1.5 text-gray-500 hover:text-red-soft-text hover:bg-red-soft rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? t('admin.users.modal.createTitle') : t('admin.users.modal.editTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.form.fullName')}</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.profile.employeeId')}</label>
              <input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.form.email')}</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          {modal === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.form.password')}</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.form.department')}</label>
              <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="">{t('admin.users.form.select')}</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.form.role')}</label>
              <select required value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="">{t('admin.users.form.select')}</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{roleLabel(r.name)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.phone')}</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            {t('admin.users.form.activeAccount')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.actions.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
              {modal === 'create' ? t('admin.users.action.create') : t('common.actions.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Password modal */}
      <Modal open={passwordModal !== null} onClose={() => setPasswordModal(null)} title={t('admin.users.modal.resetTitle')}>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.form.userLabel', { name: passwordModal?.name })}</label>
            <input
              type="password"
              required
              value={passwordModal?.password || ''}
              onChange={(e) => setPasswordModal({ ...passwordModal, password: e.target.value })}
              placeholder={t('admin.users.form.newPasswordPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPasswordModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.actions.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{t('common.actions.update')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
