import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lightbulb, Upload, X, CheckCircle2, CalendarClock, Hash, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../components/TicketTable';

export default function SubmitSuggestion() {
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
      toast.error('Please enter a suggestion title');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('attachments', f));
      const res = await api.post('/suggestions', fd);
      setSubmitted({ suggestion_number: res.data.suggestion_number, created_at: new Date().toISOString() });
      toast.success(`Suggestion ${res.data.suggestion_number} submitted successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit suggestion');
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
          <h2 className="text-2xl font-bold text-gray-800">Suggestion Submitted</h2>
          <p className="text-gray-500 mt-1">Thank you! Your improvement idea has been sent to the review team.</p>

          <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Suggestion Number</span>
              <span className="font-semibold text-primary-700">{submitted.suggestion_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5" /> Created</span>
              <span className="font-medium text-gray-700">{formatDate(submitted.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Submitted By</span>
              <span className="font-medium text-gray-700">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Department</span>
              <span className="font-medium text-gray-700">{user?.department_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-primary-700">Submitted</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/my-requests"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
            >
              View My Suggestions <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => { setSubmitted(null); setForm({ title: '', problem: '', proposed_solution: '', expected_benefit: '' }); setFiles([]); }}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Submit Another Suggestion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Submit Staff Suggestion</h2>
          <p className="text-sm text-gray-500">Share an idea to improve the hospital</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Auto-recorded information */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="submitter" className="block text-sm font-medium text-gray-600 mb-1">Submitted By</label>
            <input
              id="submitter"
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
            <label htmlFor="suggestion-number" className="block text-sm font-medium text-gray-600 mb-1">Suggestion Number</label>
            <input
              id="suggestion-number"
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

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Suggestion Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder="e.g. Improve patient direction signs"
          />
        </div>

        <div>
          <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-1">Problem / Opportunity</label>
          <textarea
            id="problem"
            value={form.problem}
            onChange={(e) => setForm({ ...form, problem: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder="What problem or opportunity have you identified?"
          />
        </div>

        <div>
          <label htmlFor="proposed_solution" className="block text-sm font-medium text-gray-700 mb-1">Proposed Improvement</label>
          <textarea
            id="proposed_solution"
            value={form.proposed_solution}
            onChange={(e) => setForm({ ...form, proposed_solution: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder="What is your proposed solution?"
          />
        </div>

        <div>
          <label htmlFor="expected_benefit" className="block text-sm font-medium text-gray-700 mb-1">Expected Benefit</label>
          <textarea
            id="expected_benefit"
            value={form.expected_benefit}
            onChange={(e) => setForm({ ...form, expected_benefit: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            placeholder="What benefits do you expect?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (optional)</label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary-400 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload files
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1 text-xs bg-primary-50 px-2 py-1 rounded">
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
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </div>
      </form>
    </div>
  );
}