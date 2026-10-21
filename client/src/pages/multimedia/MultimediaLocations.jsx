import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Building2, Pencil, Trash2, Loader2, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';

const LEVELS = ['campus', 'building', 'floor', 'ward', 'location', 'room'];

export default function MultimediaLocations() {
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
    if (!form.name.trim()) return toast.error('Location name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/multimedia/locations/${editing.id}`, form);
        toast.success('Location updated');
      } else {
        await api.post('/multimedia/locations', form);
        toast.success('Location created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const destroy = async (l) => {
    if (!window.confirm(`Delete "${l.name}"? Devices attached to it will be unassigned.`)) return;
    try {
      await api.delete(`/multimedia/locations/${l.id}`);
      toast.success('Location deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const renderTree = (loc, depth = 0) => {
    const children = locations.filter((x) => x.parent_id === loc.id);
    const deletable = children.length === 0 && !(Number(loc.device_count) > 0);
    return (
      <div key={loc.id}>
        <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg" style={{ marginLeft: depth * 20 }}>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <Building2 className="w-4 h-4 text-primary-600 shrink-0" />
          <span className="text-sm font-medium text-gray-800">{loc.name}</span>
          <Badge color="gray">{loc.level}</Badge>
          <span className="text-xs text-gray-400">{loc.device_count || 0} devices</span>
          {children.length > 0 && <span className="text-xs text-gray-400">{children.length} child</span>}
          {canManage && (
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => openCreate(loc)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Add child location">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => openEdit(loc)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit location">
                <Pencil className="w-4 h-4" />
              </button>
              {deletable && (
                <button onClick={() => destroy(loc)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete location">
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
          <h2 className="text-2xl font-bold text-gray-800">Locations</h2>
          <p className="text-gray-500 text-sm">Hierarchy of physical sites where displays are installed</p>
        </div>
        {canManage && (
          <button onClick={() => openCreate(null)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> Add Location
          </button>
        )}
      </div>

      {roots.length === 0 ? (
        <EmptyState title="No locations defined" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          {roots.map((r) => renderTree(r))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Location' : 'Add Location'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Outpatient Waiting Area" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                {LEVELS.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
              <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="">— none (root) —</option>
                {editing && editing.parent_id ? null : locations.filter((l) => l.id !== editing?.id).map((l) => (
                  <option key={l.id} value={l.id}>{l.level} · {l.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}