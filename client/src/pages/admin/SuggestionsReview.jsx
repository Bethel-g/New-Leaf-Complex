import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Lightbulb, Send, Search, FilterX, AlertTriangle,
  RefreshCw, Paperclip, Upload, X, Building2, UserCircle2,
} from 'lucide-react';
import api from '../../services/api';
import { openAttachment } from '../../services/files';
import { Badge, statusColor } from '../../components/Badge';
import { formatDate } from '../../components/TicketTable';
import Pagination from '../../components/Pagination';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import TaskTimeline from '../../components/TaskTimeline';
import CommentThread from '../../components/CommentThread';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 20;

// Button wording for each workflow step the server reports as allowed.
const ACTION_LABELS = {
  'Under Review': 'Under Review',
  Accepted: 'Accept',
  Assigned: 'Mark Assigned',
  Implementation: 'Start Implementation',
  Implemented: 'Mark Implemented',
  Closed: 'Close',
  Rejected: 'Reject',
  'Needs More Information': 'Request More Info',
  'Already Planned': 'Already Planned',
  'Forwarded to Department': 'Forward to Department',
};

export default function SuggestionsReview() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'sys_admin'].includes(user.role_name);

  // List state
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statuses, setStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', department: '', assigned_to: '', date: '' });

  // Detail state
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [providedInfo, setProvidedInfo] = useState('');
  const [file, setFile] = useState(null);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { limit: PAGE_SIZE, page };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    try {
      const res = await api.get('/suggestions', { params });
      setSuggestions(res.data.suggestions);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load suggestions');
      setSuggestions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setDetailLoading(true);
    try {
      const res = await api.get(`/suggestions/${id}`);
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id, loadDetail]);

  useEffect(() => {
    if (id) {
      api.get('/admin/statuses', { params: { type: 'suggestion' } }).then((res) => setStatuses(res.data)).catch(() => {});
      api.get('/admin/departments').then((res) => setDepartments(res.data)).catch(() => {});
      if (isAdmin) {
        api.get('/users/staff').then((res) => setStaffMembers(res.data)).catch(() => {});
      }
    } else {
      api.get('/admin/statuses', { params: { type: 'suggestion' } }).then((res) => setStatuses(res.data)).catch(() => {});
      api.get('/admin/departments').then((res) => setDepartments(res.data)).catch(() => {});
      api.get('/users/staff').then((res) => setStaffMembers(res.data)).catch(() => {});
    }
  }, [id, isAdmin]);

  // List mode: filter effects like the maintenance list
  useEffect(() => {
    if (id) return;
    loadSuggestions();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id) return;
    setPage(1);
    loadSuggestions();
  }, [filters.search, filters.status, filters.department, filters.assigned_to, filters.date]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = Object.values(filters).some(Boolean);

  const clearFilters = () => {
    setFilters({ search: '', status: '', department: '', assigned_to: '', date: '' });
  };

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const statusIdByName = (name) => statuses.find((s) => s.name === name)?.id;

  const updateSuggestion = async (sid, updates) => {
    try {
      await api.put(`/suggestions/${sid}`, updates);
      toast.success('Suggestion updated');
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const addComment = async (text) => {
    if (!text?.trim() || !detail) return false;
    try {
      await api.post(`/suggestions/${detail.suggestion.id}/comments`, { comment: text.trim() });
      toast.success('Comment added');
      loadDetail();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
      return false;
    }
  };

  const provideInformation = async () => {
    if (!detail) return;
    try {
      const underReviewId = statusIdByName('Under Review');
      if (!underReviewId) {
        toast.error('Under Review status not found');
        return;
      }
      if (providedInfo.trim()) {
        await api.post(`/suggestions/${detail.suggestion.id}/comments`, { comment: `Information provided: ${providedInfo}` });
      }
      await api.put(`/suggestions/${detail.suggestion.id}`, { status_id: underReviewId });
      setProvidedInfo('');
      toast.success('Information submitted — suggestion is under review again');
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit information');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !detail) return;
    const fd = new FormData();
    fd.append('files', file);
    try {
      await api.post(`/suggestions/${detail.suggestion.id}/attachments`, fd);
      setFile(null);
      toast.success('Attachment added');
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const removeAttachment = async (attId) => {
    if (!detail) return;
    try {
      await api.delete(`/suggestions/${detail.suggestion.id}/attachments/${attId}`);
      toast.success('Attachment removed');
      loadDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove attachment');
    }
  };

  // ── Detail view ───────────────────────────────────────────────────────
  if (id) {
    if (detailLoading) return <LoadingSpinner />;
    if (!detail) {
      return (
        <div className="max-w-4xl mx-auto">
          <Link to={isAdmin ? '/admin/suggestions' : '/my-requests'} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4" /> {isAdmin ? 'Back to Suggestions' : 'Back to My Requests'}
          </Link>
          <div className="text-center py-12 text-gray-500">Suggestion not found</div>
        </div>
      );
    }

    const suggestion = detail.suggestion;
    const comments = detail.comments || [];
    const attachments = detail.attachments || [];
    const history = detail.history || [];
    const isAuthor = suggestion.user_id === user?.id;
    const isAssignee = suggestion.assigned_to === user?.id;
    // The author, the responsible staff member and reviewers all take part in
    // the conversation; only the author and reviewers may delete files.
    const canParticipate = isAdmin || isAuthor || isAssignee;
    const canRemoveFiles = isAdmin || isAuthor;
    const allowedNext = suggestion.allowed_statuses || [];
    const isAssigneeView = !isAdmin && isAssignee;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link to={isAdmin ? '/admin/suggestions' : '/my-requests'} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> {isAdmin ? 'Back to Suggestions' : 'Back to My Requests'}
        </Link>

        {/* Header + details */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-800">{suggestion.suggestion_number}</h2>
                <Badge color={statusColor(suggestion.status_name)}>{suggestion.status_name}</Badge>
              </div>
              <h3 className="text-gray-600 font-medium">{suggestion.title}</h3>
            </div>
          </div>

          <div className="px-6 py-4 grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">Submitted By</div>
              <div className="text-gray-800 font-medium mt-0.5">{suggestion.user_name}</div>
              <div className="text-xs text-gray-500">{suggestion.department_name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Date Submitted</div>
              <div className="text-gray-800 font-medium mt-0.5">{formatDate(suggestion.created_at)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> Assigned Department</div>
              <div className="text-gray-800 font-medium mt-0.5">{suggestion.assigned_department_name || 'Not assigned'}</div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4 bg-gray-50 border-t border-gray-100">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Problem / Opportunity</div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{suggestion.problem || '-'}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Proposed Improvement</div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{suggestion.proposed_solution || '-'}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expected Benefit</div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{suggestion.expected_benefit || '-'}</p>
            </div>
          </div>

          <div className="px-6 py-4 grid sm:grid-cols-2 gap-4 border-t border-gray-100 text-sm">
            <div className="flex items-center gap-2">
              <UserCircle2 className="w-4 h-4 text-primary-600" />
              <div>
                <div className="text-xs text-gray-400">Responsible Staff</div>
                <div className="text-gray-800 font-medium mt-0.5">{suggestion.assignee_name || 'Not assigned'}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Current Status</div>
              <div className="text-gray-800 font-medium mt-0.5">{suggestion.status_name}</div>
            </div>
          </div>

          {/* Reviewer decision panel */}
          {isAdmin && (
            <div className="px-6 py-4 space-y-4 border-t border-gray-100">
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Review Decision</div>
                {allowedNext.length === 0 ? (
                  <p className="text-sm text-gray-400">No further workflow steps are available for this status.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allowedNext.map((name) => (
                      <button
                        key={name}
                        onClick={() => updateSuggestion(suggestion.id, { status_id: statusIdByName(name) })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                          suggestion.status_name === name
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 text-gray-600 hover:border-primary-400'
                        }`}
                      >
                        {ACTION_LABELS[name] || name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="assign-dept" className="block text-xs font-medium text-gray-500 mb-1">Assign to Department</label>
                  <select
                    id="assign-dept"
                    value={suggestion.assigned_department_id || ''}
                    onChange={(e) => updateSuggestion(suggestion.id, { assigned_department_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Not assigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="assign-staff" className="block text-xs font-medium text-gray-500 mb-1">Assign Responsible Staff</label>
                  <select
                    id="assign-staff"
                    value={suggestion.assigned_to || ''}
                    onChange={(e) => updateSuggestion(suggestion.id, { assigned_to: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Not assigned</option>
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.department_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Responsible staff progress panel */}
          {isAssigneeView && (
            <div className="px-6 py-4 border-t border-gray-100 bg-primary-50/40">
              <div className="text-sm font-semibold text-gray-700 mb-1">Update Progress</div>
              {allowedNext.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nothing to update from "{suggestion.status_name}" — the review team takes it from here.
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    You are responsible for this suggestion. Record progress as you carry out the agreed improvement.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allowedNext.map((name) => (
                      <button
                        key={name}
                        onClick={() => updateSuggestion(suggestion.id, { status_id: statusIdByName(name) })}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-primary-300 text-primary-700 bg-white hover:bg-primary-50"
                      >
                        {ACTION_LABELS[name] || name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Staff provide-information panel */}
          {!isAdmin && isAuthor && suggestion.status_name === 'Needs More Information' && (
            <div className="px-6 py-4 border-t border-gray-100 bg-orange-50">
              <div className="text-sm font-semibold text-orange-800 mb-1">Action Required — Information Needed</div>
              <p className="text-xs text-orange-600 mb-3">
                The review team needs more information before your suggestion can proceed. Provide it below and it will return to Under Review.
              </p>
              <textarea
                value={providedInfo}
                onChange={(e) => setProvidedInfo(e.target.value)}
                rows={3}
                placeholder="Add the requested details..."
                className="w-full px-4 py-2.5 rounded-lg border border-orange-300 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
              />
              <button
                onClick={provideInformation}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
              >
                <Send className="w-4 h-4" /> Submit Information
              </button>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-gray-800">Attachments</h3>
            </div>
            {canParticipate && (
              <form onSubmit={handleUpload} className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:border-primary-400 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Choose file
                  <input type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                </label>
                {file && <span className="text-xs text-gray-500 max-w-[180px] truncate">{file.name}</span>}
                <button type="submit" disabled={!file} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-50">
                  Upload
                </button>
                {file && (
                  <button type="button" onClick={() => setFile(null)} aria-label="Clear file" className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            )}
          </div>
          <div className="px-5 py-4">
            {attachments.length === 0 ? (
              <div className="text-gray-400 text-sm">No attachments</div>
            ) : (
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-gray-100">
                    <button
                      type="button"
                      onClick={() => openAttachment(`/suggestions/${s.id}/attachments/${a.id}`, a.file_name)}
                      className="text-sm text-primary-700 hover:underline flex items-center gap-2"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> {a.file_name}
                    </button>
                    {canRemoveFiles && (
                      <button onClick={() => removeAttachment(a.id)} className="text-xs text-red-500 hover:underline" aria-label={`Remove ${a.file_name}`}>
                        Remove
                      </button>)}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* History */}
        <TaskTimeline history={history} title="Status History" emptyText="No history yet" />

        {/* Comments */}
        <CommentThread
          comments={comments}
          onSubmit={addComment}
          disabled={!canParticipate}
          disabledHint="You are not part of this suggestion's conversation."
          placeholder="Add a comment..."
        />
      </div>
    );
  }

  // ── Admin list view ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Suggestions Review</h2>
          <p className="text-gray-500 text-sm">Review and manage staff improvement ideas</p>
        </div>
        <div className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${total} suggestion${total === 1 ? '' : 's'}`}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search number, title, submitter..."
              aria-label="Search suggestions"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
          <select
            value={filters.department}
            onChange={(e) => setFilter('department', e.target.value)}
            aria-label="Filter by department"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <select
            value={filters.assigned_to}
            onChange={(e) => setFilter('assigned_to', e.target.value)}
            aria-label="Filter by responsible staff"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Staff</option>
            {staffMembers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilter('date', e.target.value)}
            aria-label="Filter by date"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800"
          >
            <FilterX className="w-4 h-4" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error}</p>
          <button
            onClick={() => { setPage(1); loadSuggestions(); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No suggestions found"
          subtitle={hasFilters ? 'Try adjusting your filters' : 'Staff suggestions will appear here'}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Dept</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Person</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suggestions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/suggestions/${s.id}`} className="text-sm font-medium text-primary-700 hover:underline">
                        {s.suggestion_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[260px] truncate">{s.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.user_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.department_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.assigned_department_name || <span className="text-gray-300">-</span>}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.assignee_name || <span className="text-gray-300">-</span>}</td>
                    <td className="px-4 py-3">
                      <Badge color={statusColor(s.status_name)}>{s.status_name}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}