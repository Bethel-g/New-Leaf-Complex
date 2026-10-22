import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MonitorCog, Upload, X, CheckCircle2, CalendarClock, Hash, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../components/TicketTable';
import { useTranslation } from '../../i18n';

export default function SubmitITRequest() {
  const { t, priorityLabel } = useTranslation();
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
      toast.error(t('staff.form.requiredFields'));
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
      toast.success(t('staff.it.form.success', { number: res.data.ticket_number }));
    } catch (err) {
      toast.error(err.response?.data?.message || t('staff.form.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-surface rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success-soft-strong text-success-soft-text flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{t('staff.it.submitted.title')}</h2>
          <p className="text-gray-500 mt-1">{t('staff.it.submitted.message')}</p>

          <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> {t('staff.form.ticketNumber')}</span>
              <span className="font-semibold text-blue-soft-text">{submitted.ticket_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5" /> {t('common.labels.created')}</span>
              <span className="font-medium text-gray-700">{formatDate(submitted.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t('staff.form.requestedBy')}</span>
              <span className="font-medium text-gray-700">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t('common.labels.department')}</span>
              <span className="font-medium text-gray-700">{user?.department_name}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/my-requests"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
            >
              {t('staff.form.viewMyRequests')} <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => { setSubmitted(null); setForm({ category_id: '', title: '', description: '', location: '', priority: 'Medium', contact_info: '' }); setFiles([]); }}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t('staff.form.submitAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-lg bg-blue-soft-strong text-blue-soft-text flex items-center justify-center">
          <MonitorCog className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('nav.newItRequest')}</h2>
          <p className="text-sm text-gray-500">{t('staff.it.form.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Auto-populated fields */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="requester" className="block text-sm font-medium text-gray-600 mb-1">{t('common.labels.requester')}</label>
            <input
              id="requester"
              type="text"
              value={user?.name || ''}
              disabled
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-gray-200 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-600 mb-1">{t('common.labels.department')}</label>
            <input
              id="department"
              type="text"
              value={user?.department_name || ''}
              disabled
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-gray-200 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="ticket-number" className="block text-sm font-medium text-gray-600 mb-1">{t('staff.form.ticketNumber')}</label>
            <input
              id="ticket-number"
              type="text"
              value={t('staff.form.autoAssigned')}
              disabled
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-gray-200 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="created-date" className="block text-sm font-medium text-gray-600 mb-1">{t('staff.form.createdDate')}</label>
            <input
              id="created-date"
              type="text"
              value={formatDate(new Date().toISOString())}
              disabled
              readOnly
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-gray-200 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.labels.category')} <span className="text-red-soft-text">*</span>
            </label>
            <select
              id="category"
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            >
              <option value="">{t('staff.form.selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.priority')}</label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            >
              {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                <option key={p} value={p}>{priorityLabel(p)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('staff.form.problemTitle')} <span className="text-red-soft-text">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder={t('staff.it.form.titlePlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">{t('staff.form.problemDescription')}</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder={t('staff.form.describeProblem')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.location')}</label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder={t('staff.it.form.locationPlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">{t('staff.form.contactInfo')}</label>
            <input
              id="contact"
              type="text"
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder={t('staff.form.contactPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.attachments')}</label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary-400 cursor-pointer">
              <Upload className="w-4 h-4" />
              {t('staff.form.uploadFiles')}
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1 text-xs bg-blue-soft px-2 py-1 rounded">
                {f.name}
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={t('staff.form.removeFile', { name: f.name })}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{t('staff.form.fileHint')}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {t('common.actions.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? t('staff.form.submitting') : t('staff.form.submitRequest')}
          </button>
        </div>
      </form>
    </div>
  );
}