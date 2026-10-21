import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Upload, Loader2, Eye, Trash2, CheckCircle2, Search, FolderOpen } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { formatBytes, formatDateTime, mediaStatusColor } from './multimediaHelpers';

const EMPTY_FORM = { title: '', category: 'image', file: null };

export default function MultimediaMedia() {
  const { user } = useAuth();
  const canManage = ['it_supervisor', 'admin', 'sys_admin'].includes(user?.role_name);

  const [data, setData] = useState({ items: [], total: 0, limit: 12, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = (o = offset, s = status, q = query) => {
    api.get('/multimedia/media', { params: { limit: 12, offset: o, status: s === 'all' ? undefined : s, query: q || undefined } })
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(0, status, query); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.file) return toast.error('Choose a file to upload');
    setSaving(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('category', form.category);
    fd.append('file', form.file);
    try {
      await api.post('/multimedia/media', fd);
      toast.success('Media uploaded');
      setModal(false);
      setForm(EMPTY_FORM);
      load(1, status, query);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (m) => {
    const target = m.status === 'active' ? 'archive' : 'activate';
    try {
      await api.post(`/multimedia/media/${m.id}/${target}`);
      toast.success(target === 'archive' ? 'Media archived' : 'Media activated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const p = data;
  const totalPages = Math.max(1, Math.ceil(p.total / p.limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Media Library</h2>
          <p className="text-gray-500 text-sm">Images and short videos available for broadcasts</p>
        </div>
        <button onClick={() => setModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Upload className="w-4 h-4" /> Upload Media
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(0, status, query); }}
            placeholder="Search title..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); load(1, e.target.value, query); }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => load(0, status, query)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Apply</button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data.items.length === 0 ? (
        <EmptyState title="No media found" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.items.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                <button onClick={() => setPreview(m)} className="relative aspect-video bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                  {m.category === 'image' ? (
                    <img src={`/api/multimedia/media/${m.id}/file`} alt={m.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">{m.file_type}</span>
                  )}
                  <span className="absolute top-2 right-2"><Badge color={mediaStatusColor(m.status)}>{m.status}</Badge></span>
                </button>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-sm font-medium text-gray-800 truncate">{m.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.category} · {formatBytes(m.file_size)} · {formatDateTime(m.created_at)}</div>
                  <div className="mt-2 text-xs text-gray-400 truncate">Uploaded by {m.uploaded_by_name || '—'}</div>
                  <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-2">
                    <button onClick={() => setPreview(m)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    {canManage && (
                      <button onClick={() => toggleStatus(m)} className="ml-auto p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title={m.status === 'active' ? 'Archive media' : 'Activate media'}>
                        {m.status === 'active' ? <Trash2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Page {Math.floor(p.offset / p.limit) + 1} of {totalPages} · {p.total} items</span>
            <div className="flex gap-2">
              <button disabled={p.offset <= 0} onClick={() => { const o = Math.max(0, p.offset - p.limit); setOffset(o); load(o, status, query); }} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button disabled={p.offset + p.limit >= p.total} onClick={() => { const o = p.offset + p.limit; setOffset(o); load(o, status, query); }} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Upload Media">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="image">Image</option>
              <option value="announcement">Announcement</option>
              <option value="safety">Safety</option>
              <option value="awareness">Awareness</option>
              <option value="event">Event</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">File</span>
              <span className="text-xs text-gray-400">Images (jpg, png, webp) or short videos (mp4, webm)</span>
            </label>
            <input
              type="file"
              accept="image/*,.mp4,.webm"
              onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:text-sm file:font-medium hover:file:bg-primary-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} <Upload className="w-4 h-4" /> Upload
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title}>
        {preview && (
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-100 overflow-hidden">
              {preview.category === 'image' ? (
                <img src={`/api/multimedia/media/${preview.id}/file`} alt={preview.title} className="w-full" />
              ) : (
                <video src={`/api/multimedia/media/${preview.id}/file`} controls className="w-full" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FolderOpen className="w-4 h-4 text-gray-400" /> {preview.category}
              <Badge color={mediaStatusColor(preview.status)}>{preview.status}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}