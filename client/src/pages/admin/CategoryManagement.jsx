import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FolderOpen, Plus, Edit3, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/EmptyState';

function CategoryGrid({ items, typeLabel, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-primary-600" />
        <h3 className="font-semibold text-gray-800">{typeLabel} Categories</h3>
        <Badge color="blue">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">No categories</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((c) => (
            <div key={c.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">{c.name}</div>
                {c.description && <div className="text-xs text-gray-500">{c.description}</div>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(c)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(c)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
    if (!form.name.trim()) return toast.error('Name is required');
    try {
      if (modal === 'create') {
        await api.post('/admin/categories', form);
        toast.success('Category created');
      } else {
        await api.put(`/admin/categories/${editingId}`, form);
        toast.success('Category updated');
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete category ${c.name}?`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      toast.success('Category deleted');
      loadData();
    } catch {
      toast.error('Failed to delete category');
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
          <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
          <p className="text-gray-500 text-sm">Manage IT and maintenance categories</p>
        </div>
        <button onClick={() => { setModal('create'); setEditingId(null); setForm({ name: '', type: 'it', description: '' }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <CategoryGrid items={itCategories} typeLabel="IT" onEdit={openEdit} onDelete={handleDelete} />
          <CategoryGrid items={mCategories} typeLabel="Maintenance" onEdit={openEdit} onDelete={handleDelete} />
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Category' : 'Edit Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="it">IT</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
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