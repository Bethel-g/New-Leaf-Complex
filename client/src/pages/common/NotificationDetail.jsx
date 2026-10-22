import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Bell, Paperclip, RefreshCw, AlertTriangle, ExternalLink,
  User, Wrench, CalendarClock, MapPin, Phone, UserCircle2, Building2, FileText, Lightbulb,
} from 'lucide-react';
import api from '../../services/api';
import { openAttachment } from '../../services/files';
import { Badge, statusColor, priorityColor } from '../../components/Badge';
import { LoadingSpinner } from '../../components/EmptyState';
import TaskTimeline from '../../components/TaskTimeline';
import CommentThread from '../../components/CommentThread';
import { useTranslation } from '../../i18n';

/**
 * One notification, and everything about the request or suggestion it points
 * at. Recipients use this to read the full story and answer without hunting
 * through menus; the task's own page stays the place for the full toolset.
 */
export default function NotificationDetail() {
  const { t, statusLabel, priorityLabel, formatDateTime } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get(`/notifications/${id}`).then((res) => {
      setNotification(res.data.notification);
      setTask(res.data.task);
      setError('');
      setLoading(false);
    }).catch((err) => {
      setError(
        err.response?.status === 404
          ? t('common.notifications.error.notFound')
          : t('common.notifications.error.loadFailed'),
      );
      setLoading(false);
    });
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  // Opening it counts as reading it.
  useEffect(() => {
    if (notification && !notification.is_read) {
      api.put(`/notifications/${id}/read`).catch(() => {});
    }
  }, [notification, id]);

  const reply = async (text) => {
    try {
      await api.post(`/notifications/${id}/reply`, { comment: text.trim() });
      toast.success(t('common.notifications.replySent'));
      load();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.notifications.replyFailed'));
      return false;
    }
  };

  const download = async (base, attachment) => {
    try {
      await openAttachment(`${base}/${attachment.id}`, attachment.file_name);
    } catch (err) {
      toast.error(err?.response?.status === 403 ? t('common.notifications.insufficientPermissions') : t('common.notifications.downloadFailed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-surface rounded-xl border border-red-soft-border p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-soft-text mx-auto mb-3" />
        <p className="text-gray-600 font-medium">{error}</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link to="/notifications" className="inline-flex items-center gap-2 px-4 py-2 bg-[#4b5563] text-white rounded-lg text-sm font-medium hover:bg-[#374151]">
            <ArrowLeft className="w-4 h-4" /> {t('common.notifications.backToList')}
          </Link>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            <RefreshCw className="w-4 h-4" /> {t('common.actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  const ticket = task?.ticket;
  const suggestion = task?.suggestion;
  const attachmentBase = ticket
    ? `/tickets/${ticket.id}/attachments`
    : suggestion
      ? `/suggestions/${suggestion.id}/attachments`
      : null;
  const taskLink = ticket
    ? `/${ticket.type === 'maintenance' ? 'maintenance' : 'it'}/tickets/${ticket.id}`
    : suggestion
      ? `/suggestions/${suggestion.id}`
      : null;
  const taskLinkLabel = ticket
    ? t('common.notifications.openTicket')
    : suggestion
      ? t('common.notifications.openSuggestion')
      : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate('/notifications')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> {t('common.notifications.backToList')}
        </button>
        {taskLink && (
          <Link to={taskLink} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            {taskLinkLabel} <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* The notification itself */}
      <div className="bg-surface rounded-xl border border-gray-200">
        <div className="px-5 py-4 flex items-start gap-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-primary-soft-strong text-brand-text">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-800">{notification?.title}</h2>
            {notification?.message && <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">{notification.message}</p>}
            <div className="text-xs text-gray-400 mt-1">{formatDateTime(notification?.created_at)}</div>
          </div>
        </div>

        {!task && (
          <div className="px-5 py-4 text-sm text-gray-500 flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>
              {notification?.entity_type
                ? t('common.notifications.entityUnavailable')
                : t('common.notifications.generalNotification')}
            </span>
          </div>
        )}
      </div>

      {/* Ticket summary */}
      {ticket && (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h3>
                <Badge color={statusColor(ticket.status_name)}>{statusLabel(ticket.status_name)}</Badge>
                <Badge color="gray">{ticket.type === 'maintenance' ? t('common.ticket.type.maintenance') : t('common.ticket.type.it')}</Badge>
              </div>
              <p className="text-gray-600 font-medium">{ticket.title}</p>
            </div>
            {ticket.priority_name && (
              <Badge color={priorityColor(ticket.priority_name)}>
                {t('common.notifications.priorityBadge', { priority: priorityLabel(ticket.priority_name) })}
              </Badge>
            )}
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
              {ticket.equipment_name && <div className="text-xs text-gray-500">{t('common.notifications.equipment', { name: ticket.equipment_name })}</div>}
            </div>
            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {t('common.notifications.submitted')}</div>
              <div className="text-gray-800 font-medium mt-0.5">{formatDateTime(ticket.created_at)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1"><UserCircle2 className="w-3 h-3" /> {t('common.labels.assignee')}</div>
              <div className="text-gray-800 font-medium mt-0.5">{ticket.assignee_name || t('common.labels.unassigned')}</div>
              {ticket.contact_info && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {ticket.contact_info}</div>}
              {ticket.location && <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {ticket.location}</div>}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 font-semibold">{t('common.labels.description')}</div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{ticket.description || t('common.notifications.noDescription')}</p>
          </div>

          {ticket.resolution_notes && (
            <div className="px-6 py-4 bg-success-soft border-t border-success-soft-border">
              <div className="text-xs text-success-soft-text uppercase tracking-wide mb-1.5 font-semibold">{t('common.labels.resolution')}</div>
              <p className="text-success-soft-text text-sm whitespace-pre-wrap">{ticket.resolution_notes}</p>
              {ticket.resolved_date && <div className="text-xs text-success-soft-text mt-2">{t('common.notifications.resolvedOn', { date: formatDateTime(ticket.resolved_date) })}</div>}
            </div>
          )}
        </div>
      )}

      {/* Suggestion summary */}
      {suggestion && (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-xl font-bold text-gray-800">{suggestion.suggestion_number}</h3>
              <Badge color={statusColor(suggestion.status_name)}>{statusLabel(suggestion.status_name)}</Badge>
              <Badge color="green">{t('common.ticket.type.suggestion')}</Badge>
            </div>
            <p className="text-gray-600 font-medium flex items-center gap-2"><Lightbulb className="w-4 h-4 text-brand-text" /> {suggestion.title}</p>
          </div>

          <div className="px-6 py-4 grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">{t('common.notifications.submittedBy')}</div>
              <div className="text-gray-800 font-medium mt-0.5">{suggestion.user_name}</div>
              <div className="text-xs text-gray-500">{suggestion.department_name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">{t('common.notifications.dateSubmitted')}</div>
              <div className="text-gray-800 font-medium mt-0.5">{formatDateTime(suggestion.created_at)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> {t('common.notifications.assignedDepartment')}</div>
              <div className="text-gray-800 font-medium mt-0.5">{suggestion.assigned_department_name || t('common.notifications.notAssigned')}</div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4 bg-gray-50 border-t border-gray-100">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('common.notifications.problemOpportunity')}</div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{suggestion.problem || '-'}</p>
            </div>
            {suggestion.proposed_solution && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('common.notifications.proposedImprovement')}</div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{suggestion.proposed_solution}</p>
              </div>
            )}
            {suggestion.expected_benefit && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('common.notifications.expectedBenefit')}</div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{suggestion.expected_benefit}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 text-sm">
            <div className="text-xs text-gray-400">{t('common.notifications.responsibleStaff')}</div>
            <div className="text-gray-800 font-medium mt-0.5">{suggestion.assignee_name || t('common.notifications.notAssigned')}</div>
          </div>
        </div>
      )}

      {/* Attachments */}
      {task && task.attachments?.length > 0 && (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-blue-soft-text" />
            <h3 className="font-semibold text-gray-800">{t('common.labels.attachments')}</h3>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {task.attachments.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => download(attachmentBase, a)}
                className="flex items-center gap-2 text-sm text-blue-soft-text hover:underline p-3 bg-blue-soft rounded-lg text-left"
              >
                <Paperclip className="w-4 h-4" />
                <span className="truncate">{a.file_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      {task && (
        <CommentThread
          comments={task.comments}
          onSubmit={reply}
          title={t('common.notifications.replyTitle')}
          placeholder={t('common.notifications.replyPlaceholder')}
          multiline
          emptyText={t('common.notifications.noReplies')}
        />
      )}

      {/* Full history */}
      {task && <TaskTimeline history={task.history} title={t('common.notifications.fullHistory')} />}
    </div>
  );
}
