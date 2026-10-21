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
import { formatDate } from '../../components/TicketTable';
import { LoadingSpinner } from '../../components/EmptyState';
import TaskTimeline from '../../components/TaskTimeline';
import CommentThread from '../../components/CommentThread';

/**
 * One notification, and everything about the request or suggestion it points
 * at. Recipients use this to read the full story and answer without hunting
 * through menus; the task's own page stays the place for the full toolset.
 */
export default function NotificationDetail() {
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
          ? 'This notification is not available'
          : 'Failed to load this notification',
      );
      setLoading(false);
    });
  }, [id]);

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
      toast.success('Reply sent');
      load();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
      return false;
    }
  };

  const download = async (base, attachment) => {
    try {
      await openAttachment(`${base}/${attachment.id}`, attachment.file_name);
    } catch (err) {
      toast.error(err?.response?.status === 403 ? 'Insufficient permissions' : 'Unable to download attachment');
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-red-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">{error}</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link to="/notifications" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back to notifications
          </Link>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" /> Retry
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
    ? 'Open full ticket'
    : suggestion
      ? 'Open full suggestion'
      : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate('/notifications')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> Back to Notifications
        </button>
        {taskLink && (
          <Link to={taskLink} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            {taskLinkLabel} <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* The notification itself */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 flex items-start gap-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-primary-100 text-primary-600">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-800">{notification?.title}</h2>
            {notification?.message && <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">{notification.message}</p>}
            <div className="text-xs text-gray-400 mt-1">{formatDate(notification?.created_at)}</div>
          </div>
        </div>

        {!task && (
          <div className="px-5 py-4 text-sm text-gray-500 flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>
              {notification?.entity_type
                ? 'The request or suggestion this referred to is no longer available to you.'
                : 'This is a general notification with no request attached.'}
            </span>
          </div>
        )}
      </div>

      {/* Ticket summary */}
      {ticket && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-xl font-bold text-gray-800">{ticket.ticket_number}</h3>
                <Badge color={statusColor(ticket.status_name)}>{ticket.status_name}</Badge>
                <Badge color="gray">{ticket.type === 'maintenance' ? 'Maintenance' : 'IT'}</Badge>
              </div>
              <p className="text-gray-600 font-medium">{ticket.title}</p>
            </div>
            {ticket.priority_name && <Badge color={priorityColor(ticket.priority_name)}>{ticket.priority_name} Priority</Badge>}
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
            </div>
            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1"><UserCircle2 className="w-3 h-3" /> Assigned To</div>
              <div className="text-gray-800 font-medium mt-0.5">{ticket.assignee_name || 'Unassigned'}</div>
              {ticket.contact_info && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {ticket.contact_info}</div>}
              {ticket.location && <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {ticket.location}</div>}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 font-semibold">Description</div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
          </div>

          {ticket.resolution_notes && (
            <div className="px-6 py-4 bg-success-50 border-t border-success-100">
              <div className="text-xs text-success-700 uppercase tracking-wide mb-1.5 font-semibold">Resolution</div>
              <p className="text-success-900 text-sm whitespace-pre-wrap">{ticket.resolution_notes}</p>
              {ticket.resolved_date && <div className="text-xs text-success-600 mt-2">Resolved on {formatDate(ticket.resolved_date)}</div>}
            </div>
          )}
        </div>
      )}

      {/* Suggestion summary */}
      {suggestion && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-xl font-bold text-gray-800">{suggestion.suggestion_number}</h3>
              <Badge color={statusColor(suggestion.status_name)}>{suggestion.status_name}</Badge>
              <Badge color="green">Suggestion</Badge>
            </div>
            <p className="text-gray-600 font-medium flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary-600" /> {suggestion.title}</p>
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
            {suggestion.proposed_solution && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Proposed Improvement</div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{suggestion.proposed_solution}</p>
              </div>
            )}
            {suggestion.expected_benefit && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expected Benefit</div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{suggestion.expected_benefit}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 text-sm">
            <div className="text-xs text-gray-400">Responsible Staff</div>
            <div className="text-gray-800 font-medium mt-0.5">{suggestion.assignee_name || 'Not assigned'}</div>
          </div>
        </div>
      )}

      {/* Attachments */}
      {task && task.attachments?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Attachments</h3>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {task.attachments.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => download(attachmentBase, a)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-3 bg-blue-50 rounded-lg text-left"
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
          title="Reply"
          placeholder="Write a reply to this request..."
          multiline
          emptyText="No replies yet — start the conversation."
        />
      )}

      {/* Full history */}
      {task && <TaskTimeline history={task.history} title="Full History" />}
    </div>
  );
}
