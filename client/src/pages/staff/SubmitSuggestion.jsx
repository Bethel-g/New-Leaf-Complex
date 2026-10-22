import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lightbulb, Upload, X, CheckCircle2, CalendarClock, Hash, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../components/TicketTable';
import { useTranslation } from '../../i18n';

export default function SubmitSuggestion() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [form, setForm] = useState({
    title: '',
    problem: '',
    proposed_solution: '',
    expected_benefit: '',
  });

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files).slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t('staff.suggestion.form.titleRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('attachments', f));
      const res = await api.post('/suggestions', fd);
      setSubmitted({ suggestion_number: res.data.suggestion_number, created_at: new Date().toISOString() });
      toast.success(t('staff.suggestion.form.success', { number: res.data.suggestion_number }));
    } catch (err) {
      toast.error(err.response?.data?.message || t('staff.suggestion.form.failed'));
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
          <h2 className="text-2xl font-bold text-gray-800">{t('staff.suggestion.submitted.title')}</h2>
          <p className="text-gray-500 mt-1">{t('staff.suggestion.submitted.message')}</p>

          <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> {t('staff.suggestion.form.suggestionNumber')}</span>
              <span className="font-semibold text-brand-text-strong">{submitted.suggestion_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5" /> {t('common.labels.created')}</span>
              <span className="font-medium text-gray-700">{formatDate(submitted.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t('staff.form.submittedBy')}</span>
              <span className="font-medium text-gray-700">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t('common.labels.department')}</span>
              <span className="font-medium text-gray-700">{user?.department_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t('common.labels.status')}</span>
              <span className="font-medium text-brand-text-strong">{t('status.submitted')}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/my-requests"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
            >
              {t('staff.suggestion.submitted.viewSuggestions')} <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => { setSubmitted(null); setForm({ title: '', problem: '', proposed_solution: '', expected_benefit: '' }); setFiles([]); }}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t('staff.suggestion.form.submitAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-lg bg-primary-soft-strong text-brand-text flex items-center justify-center">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('staff.suggestion.form.title')}</h2>
          <p className="text-sm text-gray-500">{t('staff.suggestion.form.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Auto-recorded information */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="submitter" className="block text-sm font-medium text-gray-600 mb-1">{t('staff.form.submittedBy')}</label>
            <input
              id="submitter"
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
            <label htmlFor="suggestion-number" className="block text-sm font-medium text-gray-600 mb-1">{t('staff.suggestion.form.suggestionNumber')}</label>
            <input
              id="suggestion-number"
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

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('staff.suggestion.form.suggestionTitle')} <span className="text-red-soft-text">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder={t('staff.suggestion.form.titlePlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-1">{t('staff.suggestion.form.problemOpportunity')}</label>
          <textarea
            id="problem"
            value={form.problem}
            onChange={(e) => setForm({ ...form, problem: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder={t('staff.suggestion.form.problemPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="proposed_solution" className="block text-sm font-medium text-gray-700 mb-1">{t('staff.suggestion.form.proposedImprovement')}</label>
          <textarea
            id="proposed_solution"
            value={form.proposed_solution}
            onChange={(e) => setForm({ ...form, proposed_solution: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder={t('staff.suggestion.form.solutionPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="expected_benefit" className="block text-sm font-medium text-gray-700 mb-1">{t('staff.suggestion.form.expectedBenefit')}</label>
          <textarea
            id="expected_benefit"
            value={form.expected_benefit}
            onChange={(e) => setForm({ ...form, expected_benefit: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder={t('staff.suggestion.form.benefitPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('staff.suggestion.form.attachmentsOptional')}</label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary-400 cursor-pointer">
              <Upload className="w-4 h-4" />
              {t('staff.form.uploadFiles')}
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1 text-xs bg-primary-soft px-2 py-1 rounded">
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
            {submitting ? t('staff.form.submitting') : t('staff.suggestion.form.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}