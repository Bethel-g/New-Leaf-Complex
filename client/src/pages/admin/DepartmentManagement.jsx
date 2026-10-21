import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit3, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';

export default function DepartmentManagement() {
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
    if (!form.name.trim()) return toast.error('Name is required');
    try {
      if (modal === 'create') {
        await api.post('/admin/departments', form);
        toast.success('Department created');
      } else {
        await api.put(`/admin/departments/${editingId}`, form);
        toast.success('Department updated');
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete department ${d.name}?`)) return;
    try {
      await api.delete(`/admin/departments/${d.id}`);
      toast.success('Department deleted');
      loadData();
    } catch {
      toast.error('Failed to delete department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Department Management</h2>
          <p className="text-gray-500 text-sm">Manage hospital departments</p>
        </div>
        <button onClick={() => { setModal('create'); setEditingId(null); setForm({ name: '', description: '' }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> New Department
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
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
                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(d)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Department' : 'Edit Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}