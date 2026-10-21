import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Paperclip, Wrench, CheckCircle2,
  Send, Upload, CalendarClock, MapPin, Phone, AlertTriangle, RefreshCw, Info, CheckCheck
} from 'lucide-react';
import api from '../../services/api';
import { openAttachment } from '../../services/files';
import { Badge, statusColor, priorityColor } from '../../components/Badge';
import { formatDate } from '../../components/TicketTable';
import { LoadingSpinner } from '../../components/EmptyState';
import TaskTimeline from '../../components/TaskTimeline';
import CommentThread from '../../components/CommentThread';
import { useAuth } from '../../context/AuthContext';

export default function ITTicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [itStatuses, setItStatuses] = useState([]);
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [actionTab, setActionTab] = useState('status');
  const [statusDraft, setStatusDraft] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [info, setInfo] = useState('');

  const loadTicket = useCallback(() => {
    api.get(`/tickets/${id}`).then((res) => {
      setData(res.data);
      setItStatuses(res.data.statuses || []);
      setStatusDraft(res.data.ticket.status_id);
      setLoadError('');
      setLoading(false);
    }).catch(() => {
      setLoadError('Failed to load this ticket');
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    loadTicket();
    api.get('/users/technicians', { params: { type: 'it' } }).then((res) => setTechnicians(res.data)).catch(() => {});
    api.get('/admin/priorities').then((res) => setPriorities(res.data)).catch(() => {});
  }, [loadTicket]);

  if (loading) return <LoadingSpinner />;
  if (loadError) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">{loadError}</p>
        <button
          onClick={() => { setLoading(true); loadTicket(); }}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }
  if (!data) return <div className="text-center py-12 text-gray-500">Ticket not found</div>;

  const { ticket, comments, attachments, history, workNotes } = data;

  const updateTicket = async (updates, successMsg = 'Ticket updated') => {
    try {
      await api.put(`/tickets/${ticket.id}`, updates);
      toast.success(successMsg);
      setLoading(true);
      loadTicket();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
      return false;
    }
  };

  const addComment = async (text) => {
    if (!text?.trim()) return false;
    try {
      await api.post(`/tickets/${ticket.id}/comments`, { comment: text.trim() });
      toast.success('Comment added');
      loadTicket();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
      return false;
    }
  };

  const addWorkNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await api.post(`/tickets/${ticket.id}/work-notes`, { notes: note, parts_used: partsUsed });
      setNote(''); setPartsUsed('');
      toast.success('Work note recorded');
      loadTicket();
    } catch {
      toast.error('Failed to add work note');
    }
  };

  const downloadAttachment = async (attachmentId, fileName) => {
    try {
      await openAttachment(`/tickets/${ticket.id}/attachments/${attachmentId}`, fileName);
    } catch (error) {
      toast.error(error?.response?.status === 403 ? 'Insufficient permissions' : 'Unable to download attachment');
    }
  };

  const uploadFiles = async (e) => {
    const f = e.target.files;
    if (!f.length) return;
    const fd = new FormData();
    Array.from(f).forEach((file) => fd.append('files', file));
    try {
      await api.post(`/tickets/${ticket.id}/attachments`, fd);
      toast.success('Files uploaded');
      loadTicket();
    } catch {
      toast.error('Upload failed');
    }
  };

  const canManage = user && ['it_staff', 'it_supervisor', 'admin', 'sys_admin'].includes(user.role_name);
  const canControl = user && ['it_supervisor', 'admin', 'sys_admin'].includes(user.role_name);
  const isTechnician = user && user.role_name === 'it_staff';
  const isRequester = user && ticket.requester_id === user.id;

  const currentStatusName = ticket.status_name;
  const workingStatuses = ['New', 'Assigned', 'In Progress', 'Waiting for Information'];
  const techTargets = ['In Progress', 'Waiting for Information', 'Resolved'];
  const statusOptions = isTechnician
    ? itStatuses.filter((s) => techTargets.includes(s.name) || s.name === currentStatusName)
    : itStatuses;

  const selectedTarget = itStatuses.find((s) => s.id === Number(statusDraft));
  const isResolvingTarget = selectedTarget && ['Resolved', 'Completed'].includes(selectedTarget.name);

  const applyStatus = async () => {
    if (statusDraft === null || statusDraft === ticket.status_id) {
      if (!isResolvingTarget) return;
    }
    if (!selectedTarget) return;
    const resolving = ['Resolved', 'Completed'].includes(selectedTarget.name);
    if (resolving && canManage && isTechnician && !resolutionNote.trim()) {
      toast.error('A resolution description is required when resolving a ticket');
      return;
    }
    const ok = await updateTicket(
      { status_id: statusDraft, ...(resolving ? { resolution_note: resolutionNote.trim() } : {}) },
      resolving ? 'Ticket marked as resolved' : 'Status updated',
    );
    if (ok && resolving) setResolutionNote('');
  };

  const submitInfo = async (e) => {
    e.preventDefault();
    if (!info.trim()) {
      toast.error('Please describe the additional information');
      return;
    }
    try {
      await api.post(`/tickets/${ticket.id}/comments`, { comment: info.trim() });
      const inProgress = itStatuses.find((s) => s.name === 'In Progress');
      if (inProgress) await api.put(`/tickets/${ticket.id}`, { status_id: inProgress.id });
      toast.success('Information provided - ticket updated');
      setInfo('');
      loadTicket();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit information');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={canManage ? '/it/tickets' : '/my-requests'} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> {canManage ? 'Back to IT Tickets' : 'Back to My Requests'}
        </Link>
        <div className="flex items-center gap-2">
          {canManage && ticket.status_name === 'Resolved' && (
            <button
              onClick={() => updateTicket({ status_id: itStatuses.find((s) => s.name === 'Closed')?.id }, 'Ticket closed')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
            >
              Close Ticket
            </button>
          )}
          {canManage && workingStatuses.includes(ticket.status_name) && (
            <button
              onClick={() => {
                const st = itStatuses.find((s) => s.name === 'Resolved');
                if (st) { setStatusDraft(st.id); setResolutionNote(''); }
                setActionTab('status');
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              Mark Resolved
            </button>
          )}
          {isRequester && ticket.status_name === 'Resolved' && (
            <>
              <button
                onClick={() => updateTicket({ status_id: itStatuses.find((s) => s.name === 'Closed')?.id }, 'Confirmed - problem solved')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                <span className="inline-flex items-center gap-1.5"><CheckCheck className="w-4 h-4" /> Problem Solved</span>
              </button>
              <button
                onClick={() => updateTicket({ status_id: itStatuses.find((s) => s.name === 'In Progress')?.id }, 'Ticket reopened - problem not solved')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Not Solved
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ticket header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h2>
              <Badge color={statusColor(ticket.status_name)}>{ticket.status_name}</Badge>
            </div>
            <h3 className="text-gray-600 font-medium">{ticket.title}</h3>
          </div>
          <Badge color={priorityColor(ticket.priority_name)}>{ticket.priority_name} Priority</Badge>
        </div>
        <div className="px-6 py-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> Requester</div>
            <div className="text-gray-800 font-medium mt-0.5">{ticket.requester_name}</div>
            <div className="text-xs text-gray-500">{ticket.department_name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1"><Wrench className="w-3 h-3" /> Category</div>
            <div className="text-gray-800 font-medium mt-0.5">{ticket.category_name}</div>
            {ticket.equipment_name && <div className="text-xs text-gray-500">Equipment: {ticket.equipment_name}</div>}
          </div>
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Submitted</div>
            <div className="text-gray-800 font-medium mt-0.5">{formatDate(ticket.created_at)}</div>
            <div className="text-gray-500 text-xs">
              {ticket.resolved_date && `Resolved ${formatDate(ticket.resolved_date)}`}
              {ticket.closed_date && ` • Closed ${formatDate(ticket.closed_date)}`}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Assigned To</div>
            <div className="text-gray-800 font-medium mt-0.5">{ticket.assignee_name || 'Unassigned'}</div>
            {ticket.contact_info && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {ticket.contact_info}</div>}
            {ticket.location && <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {ticket.location}</div>}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 font-semibold">Description</div>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* Resolution summary */}
      {ticket.resolution_notes && (
        <div className="bg-success-50 border border-success-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-success-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success-600" />
            <h3 className="font-semibold text-success-800">Resolution</h3>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-success-900 whitespace-pre-wrap">{ticket.resolution_notes}</p>
            {ticket.resolved_date && (
              <div className="text-xs text-success-600 mt-2">Resolved on {formatDate(ticket.resolved_date)}</div>
            )}
          </div>
        </div>
      )}

      {/* Requester: provide information when asked */}
      {isRequester && ticket.status_name === 'Waiting for Information' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Additional Information Requested</h3>
          </div>
          <form onSubmit={submitInfo} className="px-5 py-4">
            <p className="text-sm text-amber-800 mb-2">The IT team needs more details. Please provide them below so work can continue.</p>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={3}
              placeholder="Additional details..."
              required
              className="w-full px-4 py-2.5 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white"
            />
            <div className="flex justify-end mt-3">
              <button type="submit" className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                <Send className="w-4 h-4" /> Submit Information
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage actions */}
      {canManage && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200" role="tablist" aria-label="Ticket actions">
            {[
              { key: 'status', label: 'Status' },
              { key: 'assign', label: 'Assign', show: canControl },
              { key: 'work', label: 'Work Notes' },
            ].filter((t) => t.show !== false).map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={actionTab === t.key}
                onClick={() => setActionTab(t.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  actionTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-5">
            {actionTab === 'status' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">Current status:</span>
                  <Badge color={statusColor(currentStatusName)}>{currentStatusName}</Badge>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-600 font-medium">Set status to:</span>
                  <select
                    value={statusDraft ?? ''}
                    onChange={(e) => { setStatusDraft(Number(e.target.value)); setResolutionNote(''); }}
                    aria-label="Update status"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}{s.name === currentStatusName ? ' (current)' : ''}</option>
                    ))}
                  </select>
                  {!isTechnician && (
                    <button
                      onClick={applyStatus}
                      disabled={statusDraft === ticket.status_id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {isResolvingTarget && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <label htmlFor="resolution-note" className="block text-sm font-medium text-success-800 mb-1">
                      Resolution Description {isTechnician ? <span className="text-red-500">*</span> : <span className="text-xs font-normal">(recommended)</span>}
                    </label>
                    <textarea
                      id="resolution-note"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      rows={3}
                      placeholder="Describe what was done to solve the problem..."
                      className="w-full px-4 py-2.5 rounded-lg border border-success-300 focus:ring-2 focus:ring-success-500 outline-none text-sm"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={applyStatus}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirm Resolution
                      </button>
                    </div>
                  </div>
                )}

                {isTechnician && !isResolvingTarget && statusDraft !== ticket.status_id && (
                  <div className="flex justify-end">
                    <button
                      onClick={applyStatus}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Apply Status
                    </button>
                  </div>
                )}
              </div>
            )}
            {actionTab === 'assign' && canControl && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Assign to Technician:</span>
                <select
                  value={ticket.assigned_to || ''}
                  onChange={(e) => updateTicket({ assigned_to: e.target.value }, 'Ticket assigned')}
                  aria-label="Assign to technician"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">| Priority:</span>
                  <select
                    value={ticket.priority_id}
                    onChange={(e) => updateTicket({ priority_id: e.target.value }, 'Priority updated')}
                    aria-label="Change priority"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {priorities.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {actionTab === 'work' && (
              <form onSubmit={addWorkNote} className="space-y-3">
                <label htmlFor="work-note" className="sr-only">Work notes</label>
                <textarea
                  id="work-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Record what you did to solve the problem..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={partsUsed}
                    onChange={(e) => setPartsUsed(e.target.value)}
                    placeholder="Parts/materials used (optional)"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Add Note
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="px-5 pb-4 flex items-center gap-3">
            <Upload className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-blue-600 hover:underline cursor-pointer">
              Attach file (screenshot, document)
              <input type="file" multiple onChange={uploadFiles} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Work notes */}
      {workNotes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Work Notes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {workNotes.map((n) => (
              <div key={n.id} className="px-5 py-4">
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{n.notes}</div>
                {n.parts_used && (
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="font-medium text-gray-600">Parts used:</span> {n.parts_used}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1.5">
                  {n.user_name} • {formatDate(n.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Attachments</h3>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {attachments.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => downloadAttachment(a.id, a.file_name)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-3 bg-blue-50 rounded-lg text-left"
              >
                <Paperclip className="w-4 h-4" />
                <span className="truncate">{a.file_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <CommentThread
        comments={comments}
        value={comment}
        onChange={setComment}
        onSubmit={addComment}
      />

      {/* History */}
      <TaskTimeline history={history} title="Ticket History" />
    </div>
  );
}