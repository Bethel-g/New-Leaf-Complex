import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MonitorCog, Upload, X, CheckCircle2, CalendarClock, Hash, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../components/TicketTable';

export default function SubmitITRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    location: '',
    priority: 'Medium',
    contact_info: '',
  });

  useEffect(() => {
    api.get('/admin/categories', { params: { type: 'it' } }).then((res) => setCategories(res.data));
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files).slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id || !form.title.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', 'it');
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('attachments', f));
      const res = await api.post('/tickets', fd);
      setSubmitted({ ticket_number: res.data.ticket_number, created_at: new Date().toISOString() });
      toast.success(`IT Ticket ${res.data.ticket_number} submitted successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success-100 text-success-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Request Submitted</h2>
          <p className="text-gray-500 mt-1">Your IT support request has been sent to the IT team.</p>

          <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Ticket Number</span>
              <span className="font-semibold text-blue-700">{submitted.ticket_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5" /> Created</span>
              <span className="font-medium text-gray-700">{formatDate(submitted.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Requested By</span>
              <span className="font-medium text-gray-700">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Department</span>
              <span className="font-medium text-gray-700">{user?.department_name}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/my-requests"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              View My Requests <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => { setSubmitted(null); setForm({ category_id: '', title: '', description: '', location: '', priority: 'Medium', contact_info: '' }); setFiles([]); }}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
          <MonitorCog className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">New IT Request</h2>
          <p className="text-sm text-gray-500">Report a technology problem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Auto-populated fields */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="requester" className="block text-sm font-medium text-gray-600 mb-1">Requester</label>
            <input
              id="requester"
              type="text"
              value={user?.name || ''}
              disabled
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-600 mb-1">Department</label>
            <input
              id="department"
              type="text"
              value={user?.department_name || ''}
              disabled
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="ticket-number" className="block text-sm font-medium text-gray-600 mb-1">Ticket Number</label>
            <input
              id="ticket-number"
              type="text"
              value="Assigned automatically on submission"
              disabled
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="created-date" className="block text-sm font-medium text-gray-600 mb-1">Created Date</label>
            <input
              id="created-date"
              type="text"
              value={formatDate(new Date().toISOString())}
              disabled
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Problem Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="e.g. Computer not starting"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Problem Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="Describe the problem in detail..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="e.g. Ward 2, Nursing Station"
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Contact Information (optional)</label>
            <input
              id="contact"
              type="text"
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="e.g. Extension 5421"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-blue-400 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload files
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded">
                {f.name}
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Up to 5 files, max 10 MB each.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}