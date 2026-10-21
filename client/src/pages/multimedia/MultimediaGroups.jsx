import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Users, Pencil, Trash2, Loader2, MonitorCog } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';

export default function MultimediaGroups() {
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
    if (!form.name.trim()) return toast.error('Group name is required');
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
        toast.success('Group updated');
      } else {
        await api.post('/multimedia/groups', form);
        toast.success('Group created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const destroy = async (g) => {
    if (!window.confirm(`Delete group "${g.name}"? Device membership is removed but devices are kept.`)) return;
    try {
      await api.delete(`/multimedia/groups/${g.id}`);
      toast.success('Group deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Display Groups</h2>
          <p className="text-gray-500 text-sm">Organize devices (e.g. waiting areas) for one-shot broadcasts</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> Create Group
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState title="No groups yet" />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-800">{g.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {canManage && (
                    <>
                      <button onClick={() => openEdit(g)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Edit group">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => destroy(g)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete group">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {g.description && <p className="text-sm text-gray-500 mt-1">{g.description}</p>}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <MonitorCog className="w-4 h-4 text-gray-400" />
                <span>{g.device_count} devices</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Group' : 'Create Group'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Devices ({form.device_ids.length} selected)</label>
            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {devices.filter((d) => d.is_active).length === 0 && <div className="p-4 text-sm text-gray-400">No active devices to add.</div>}
              {devices.filter((d) => d.is_active).map((d) => (
                <label key={d.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={form.device_ids.includes(d.id)} onChange={() => toggleDevice(d.id)} className="rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-gray-800">{d.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{d.location_name || d.status}</span>
                </label>
              ))}
            </div>
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