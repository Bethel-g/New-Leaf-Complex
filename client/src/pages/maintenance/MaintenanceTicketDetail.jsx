import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Paperclip, Wrench, CheckCircle2,
  Upload, CalendarClock, MapPin, Phone, AlertTriangle, RefreshCw, CheckCheck, Boxes
} from 'lucide-react';
import api from '../../services/api';
import { openAttachment } from '../../services/files';
import { Badge, statusColor, priorityColor } from '../../components/Badge';
import { formatDate } from '../../components/TicketTable';
import { LoadingSpinner } from '../../components/EmptyState';
import TaskTimeline from '../../components/TaskTimeline';
import CommentThread from '../../components/CommentThread';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';

export default function MaintenanceTicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, statusLabel, priorityLabel } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [mStatuses, setMStatuses] = useState([]);
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [actionTab, setActionTab] = useState('status');
  const [statusDraft, setStatusDraft] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const loadTicket = useCallback(() => {
    api.get(`/tickets/${id}`).then((res) => {
      setData(res.data);
      setMStatuses(res.data.statuses || []);
      setStatusDraft(res.data.ticket.status_id);
      setLoadError('');
      setLoading(false);
    }).catch(() => {
      setLoadError(t('maintenance.detail.error.loadFailed'));
      setLoading(false);
    });
  }, [id, t]);

  useEffect(() => {
    loadTicket();
    api.get('/users/technicians', { params: { type: 'maintenance' } }).then((res) => setTechnicians(res.data)).catch(() => {});
    api.get('/admin/priorities').then((res) => setPriorities(res.data)).catch(() => {});
  }, [loadTicket]);

  if (loading) return <LoadingSpinner />;
  if (loadError) {
    return (
      <div className="bg-surface rounded-xl border border-red-soft-border p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">{loadError}</p>
        <button
          onClick={() => { setLoading(true); loadTicket(); }}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
        >
          <RefreshCw className="w-4 h-4" /> {t('common.actions.retry')}
        </button>
      </div>
    );
  }
  if (!data) return <div className="text-center py-12 text-gray-500">{t('maintenance.detail.error.notFound')}</div>;

  const { ticket, comments, attachments, history, workNotes } = data;

  const updateTicket = async (updates, successMsg = t('maintenance.detail.toast.updated')) => {
    try {
      await api.put(`/tickets/${ticket.id}`, updates);
      toast.success(successMsg);
      setLoading(true);
      loadTicket();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || t('maintenance.detail.toast.updateFailed'));
      return false;
    }
  };

  const addComment = async (text) => {
    if (!text?.trim()) return false;
    try {
      await api.post(`/tickets/${ticket.id}/comments`, { comment: text.trim() });
      toast.success(t('maintenance.detail.toast.commentAdded'));
      loadTicket();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || t('maintenance.detail.toast.commentFailed'));
      return false;
    }
  };

  const addWorkNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await api.post(`/tickets/${ticket.id}/work-notes`, { notes: note, parts_used: partsUsed });
      setNote(''); setPartsUsed('');
      toast.success(t('maintenance.detail.toast.workRecorded'));
      loadTicket();
    } catch {
      toast.error(t('maintenance.detail.toast.workNoteFailed'));
    }
  };

  const uploadFiles = async (e) => {
    const f = e.target.files;
    if (!f.length) return;
    const fd = new FormData();
    Array.from(f).forEach((file) => fd.append('files', file));
    try {
      await api.post(`/tickets/${ticket.id}/attachments`, fd);
      toast.success(t('maintenance.detail.toast.filesUploaded'));
      loadTicket();
    } catch {
      toast.error(t('maintenance.detail.toast.uploadFailed'));
    }
  };

  const canManage = user && ['maintenance_staff', 'maintenance_supervisor', 'admin', 'sys_admin'].includes(user.role_name);
  const canControl = user && ['maintenance_supervisor', 'admin', 'sys_admin'].includes(user.role_name);
  const isTechnician = user && user.role_name === 'maintenance_staff';
  const isRequester = user && ticket.requester_id === user.id;

  const currentStatusName = ticket.status_name;
  const workingStatuses = ['New', 'Assigned', 'Inspection', 'In Progress', 'Waiting for Parts'];
  const techTargets = ['Inspection', 'In Progress', 'Waiting for Parts', 'Completed'];
  const statusOptions = isTechnician
    ? mStatuses.filter((s) => techTargets.includes(s.name) || s.name === currentStatusName)
    : mStatuses;

  const selectedTarget = mStatuses.find((s) => s.id === Number(statusDraft));
  const isCompletingTarget = selectedTarget && ['Resolved', 'Completed'].includes(selectedTarget.name);

  const applyStatus = async () => {
    if (statusDraft === null || statusDraft === ticket.status_id) {
      if (!isCompletingTarget) return;
    }
    if (!selectedTarget) return;
    const completing = ['Resolved', 'Completed'].includes(selectedTarget.name);
    if (completing && canManage && isTechnician && !resolutionNote.trim()) {
      toast.error(t('maintenance.detail.error.completionRequired'));
      return;
    }
    const ok = await updateTicket(
      { status_id: statusDraft, ...(completing ? { resolution_note: resolutionNote.trim() } : {}) },
      completing ? t('maintenance.detail.toast.markedCompleted') : t('maintenance.detail.toast.statusUpdated'),
    );
    if (ok && completing) setResolutionNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={canManage ? '/maintenance/tickets' : '/my-requests'} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> {canManage ? t('maintenance.detail.back.toTickets') : t('maintenance.detail.back.toMyRequests')}
        </Link>
        <div className="flex items-center gap-2">
          {canManage && ticket.status_name === 'Completed' && (
            <button
              onClick={() => updateTicket({ status_id: mStatuses.find((s) => s.name === 'Closed')?.id }, t('maintenance.detail.toast.requestClosed'))}
              className="px-4 py-2 bg-[#4b5563] text-white rounded-lg text-sm font-medium hover:bg-[#374151]"
            >
              {t('maintenance.detail.action.closeRequest')}
            </button>
          )}
          {canManage && workingStatuses.includes(ticket.status_name) && (
            <button
              onClick={() => {
                const st = mStatuses.find((s) => s.name === 'Completed');
                if (st) { setStatusDraft(st.id); setResolutionNote(''); }
                setActionTab('status');
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              {t('maintenance.detail.action.markCompleted')}
            </button>
          )}
          {isRequester && ticket.status_name === 'Completed' && (
            <>
              <button
                onClick={() => updateTicket({ status_id: mStatuses.find((s) => s.name === 'Closed')?.id }, t('maintenance.detail.toast.problemFixed'))}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                <span className="inline-flex items-center gap-1.5"><CheckCheck className="w-4 h-4" /> {t('maintenance.detail.action.problemFixed')}</span>
              </button>
              <button
                onClick={() => updateTicket({ status_id: mStatuses.find((s) => s.name === 'In Progress')?.id }, t('maintenance.detail.toast.problemNotFixed'))}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                {t('maintenance.detail.action.notFixed')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ticket header */}
      <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h2>
              <Badge color={statusColor(ticket.status_name)}>{statusLabel(ticket.status_name)}</Badge>
            </div>
            <h3 className="text-gray-600 font-medium">{ticket.title}</h3>
          </div>
          <Badge color={priorityColor(ticket.priority_name)}>
            {t('common.notifications.priorityBadge', { priority: priorityLabel(ticket.priority_name) })}
          </Badge>
        </div>
        <div className="px-6 py-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> {t('common.labels.requester')}</div>
            <div className="text-gray-800 font-medium mt-0.5">{ticket.requester_name}</div>
            <div className="text-xs text-gray-500">{ticket.department_name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1"><Wrench className="w-3 h-3" /> {t('common.labels.category')}</div>
            <div className="text-gray-800 font-medium mt-0.5">{ticket.category_name}</div>
            {ticket.equipment_name && <div className="text-xs text-gray-500 flex items-center gap-1"><Boxes className="w-3 h-3" /> {ticket.equipment_name}</div>}
          </div>
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {t('common.labels.created')}</div>
            <div className="text-gray-800 font-medium mt-0.5">{formatDate(ticket.created_at)}</div>
            <div className="text-gray-500 text-xs">
              {ticket.resolved_date && t('maintenance.detail.header.completedOn', { date: formatDate(ticket.resolved_date) })}
              {ticket.closed_date && ` • ${t('maintenance.detail.header.closedOn', { date: formatDate(ticket.closed_date) })}`}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">{t('common.labels.assignee')}</div>
            <div className="text-gray-800 font-medium mt-0.5">{ticket.assignee_name || t('common.labels.unassigned')}</div>
            {ticket.contact_info && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {ticket.contact_info}</div>}
            {ticket.location && <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {ticket.location}</div>}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 font-semibold">{t('common.labels.description')}</div>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{ticket.description || t('common.notifications.noDescription')}</p>
        </div>
      </div>

      {/* Completion summary */}
      {ticket.resolution_notes && (
        <div className="bg-success-soft border border-success-soft-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-success-soft-border flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success-soft-text" />
            <h3 className="font-semibold text-success-soft-text">{t('maintenance.detail.summary.title')}</h3>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-success-soft-text whitespace-pre-wrap">{ticket.resolution_notes}</p>
            {ticket.resolved_date && (
              <div className="text-xs text-success-soft-text mt-2">{t('maintenance.detail.header.completedOn', { date: formatDate(ticket.resolved_date) })}</div>
            )}
          </div>
        </div>
      )}

      {/* Manage actions */}
      {canManage && (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200" role="tablist" aria-label={t('maintenance.detail.aria.actions')}>
            {[
              { key: 'status', label: t('common.labels.status') },
              { key: 'assign', label: t('common.actions.assign'), show: canControl },
              { key: 'work', label: t('maintenance.detail.tab.recordWork') },
            ].filter((tab) => tab.show !== false).map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={actionTab === tab.key}
                onClick={() => setActionTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  actionTab === tab.key ? 'border-orange-600 text-orange-soft-text' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-5">
            {actionTab === 'status' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">{t('maintenance.detail.status.current')}</span>
                  <Badge color={statusColor(currentStatusName)}>{statusLabel(currentStatusName)}</Badge>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-600 font-medium">{t('maintenance.detail.status.setTo')}</span>
                  <select
                    value={statusDraft ?? ''}
                    onChange={(e) => { setStatusDraft(Number(e.target.value)); setResolutionNote(''); }}
                    aria-label={t('maintenance.detail.aria.updateStatus')}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {statusLabel(s.name)}{s.name === currentStatusName ? ` ${t('maintenance.detail.status.currentSuffix')}` : ''}
                      </option>
                    ))}
                  </select>
                  {!isTechnician && (
                    <button
                      onClick={applyStatus}
                      disabled={statusDraft === ticket.status_id}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40"
                    >
                      {t('maintenance.detail.status.apply')}
                    </button>
                  )}
                </div>

                {isCompletingTarget && (
                  <div className="bg-success-soft border border-success-soft-border rounded-lg p-4">
                    <label htmlFor="completion-note" className="block text-sm font-medium text-success-soft-text mb-1">
                      {t('maintenance.detail.completion.label')} {isTechnician ? <span className="text-red-soft-text">*</span> : <span className="text-xs font-normal">{t('maintenance.detail.completion.recommended')}</span>}
                    </label>
                    <textarea
                      id="completion-note"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      rows={3}
                      placeholder={t('maintenance.detail.completion.placeholder')}
                      className="w-full px-4 py-2.5 rounded-lg border border-success-soft-border focus:ring-2 focus:ring-success-500 outline-none text-sm"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={applyStatus}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                      >
                        <CheckCircle2 className="w-4 h-4" /> {t('maintenance.detail.completion.confirm')}
                      </button>
                    </div>
                  </div>
                )}

                {isTechnician && !isCompletingTarget && statusDraft !== ticket.status_id && (
                  <div className="flex justify-end">
                    <button
                      onClick={applyStatus}
                      className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                    >
                      {t('maintenance.detail.status.applyStatus')}
                    </button>
                  </div>
                )}
              </div>
            )}
            {actionTab === 'assign' && canControl && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">{t('maintenance.detail.assign.technician')}</span>
                <select
                  value={ticket.assigned_to || ''}
                  onChange={(e) => updateTicket({ assigned_to: e.target.value }, t('maintenance.detail.toast.assigned'))}
                  aria-label={t('maintenance.detail.aria.assignTechnician')}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">{t('common.labels.unassigned')}</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">| {t('maintenance.detail.assign.priority')}</span>
                  <select
                    value={ticket.priority_id}
                    onChange={(e) => updateTicket({ priority_id: e.target.value }, t('maintenance.detail.toast.priorityUpdated'))}
                    aria-label={t('maintenance.detail.aria.changePriority')}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {priorities.map((p) => (
                      <option key={p.id} value={p.id}>{priorityLabel(p.name)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {actionTab === 'work' && (
              <form onSubmit={addWorkNote} className="space-y-3">
                <label htmlFor="work-note" className="sr-only">{t('maintenance.detail.aria.workNotes')}</label>
                <textarea
                  id="work-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder={t('maintenance.detail.work.placeholder')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={partsUsed}
                    onChange={(e) => setPartsUsed(e.target.value)}
                    placeholder={t('maintenance.detail.work.partsPlaceholder')}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                  <button type="submit" className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                    {t('maintenance.detail.work.saveRecord')}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="px-5 pb-4 flex items-center gap-3">
            <Upload className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-orange-soft-text hover:underline cursor-pointer">
              {t('maintenance.detail.attach.label')}
              <input type="file" multiple accept="image/*" onChange={uploadFiles} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Work notes */}
      {workNotes.length > 0 && (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-soft-text" />
            <h3 className="font-semibold text-gray-800">{t('maintenance.detail.records.title')}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {workNotes.map((n) => (
              <div key={n.id} className="px-5 py-4">
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{n.notes}</div>
                {n.parts_used && (
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="font-medium text-gray-600">{t('maintenance.detail.records.partsUsed')}</span> {n.parts_used}
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
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-orange-soft-text" />
            <h3 className="font-semibold text-gray-800">{t('common.labels.attachments')}</h3>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {attachments.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openAttachment(`/tickets/${ticket.id}/attachments/${a.id}`, a.file_name)}
                className="flex items-center gap-2 text-sm text-orange-soft-text hover:underline p-3 bg-orange-soft rounded-lg"
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
      <TaskTimeline history={history} title={t('maintenance.detail.history.title')} />
    </div>
  );
}