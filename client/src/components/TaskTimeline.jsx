import { History } from 'lucide-react';
import { formatDate } from './TicketTable';

/**
 * Every recorded change on a ticket or a suggestion, oldest first.
 *
 * Both resources write the same history vocabulary, so the labels below cover
 * them together and any action this component has not seen falls back to a
 * readable form of the action name rather than disappearing.
 */
const ACTION_LABELS = {
  created: 'created the request',
  assigned: 'assigned the request',
  assigned_department_changed: 'changed the assigned department',
  assigned_person_changed: 'changed the responsible staff member',
  status_changed: 'changed the status',
  priority_changed: 'changed the priority',
  comment_added: 'added a comment',
  attachment_added: 'attached a file',
  attachment_removed: 'removed a file',
  information_provided: 'provided the requested information',
  work_notes_added: 'added work notes',
  resolved: 'resolved the request',
  completed: 'completed the work',
  reopened: 'reopened the request',
  closed: 'closed the request',
  rejected: 'rejected the suggestion',
};

const SUMMARY_ACTIONS = new Set(['comment_added', 'work_notes_added', 'resolved', 'completed']);
const TRANSITION_ACTIONS = new Set([
  'status_changed',
  'priority_changed',
  'assigned',
  'assigned_department_changed',
  'assigned_person_changed',
]);
const DOT_COLORS = {
  reopened: 'bg-red-500',
  resolved: 'bg-success-500',
  completed: 'bg-success-500',
  rejected: 'bg-red-500',
  closed: 'bg-gray-400',
};

function humanize(action) {
  const known = ACTION_LABELS[action];
  if (known) return known;
  const spaced = String(action || '').replace(/_/g, ' ');
  return `updated the request (${spaced})`;
}

export default function TaskTimeline({ history, title = 'History', emptyText = 'Nothing has happened yet' }) {
  const entries = history || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
        <History className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {entries.length > 0 && <span className="text-xs text-gray-400">{entries.length} entries</span>}
      </div>
      <div className="px-5 py-4">
        {entries.length === 0 ? (
          <div className="text-gray-400 text-sm">{emptyText}</div>
        ) : (
          <ol className="space-y-3">
            {entries.map((h, i) => (
              <li key={h.id ?? i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${DOT_COLORS[h.action] || 'bg-blue-500'}`} />
                  {i < entries.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                </div>
                <div className="pb-2 min-w-0">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium text-gray-800">{h.user_name || 'System'}</span> {humanize(h.action)}
                  </div>
                  {TRANSITION_ACTIONS.has(h.action) && (h.old_value || h.new_value) && (
                    <div className="text-sm text-gray-500 mt-0.5">
                      {h.old_value || 'none'} → <span className="font-medium text-gray-700">{h.new_value || 'none'}</span>
                    </div>
                  )}
                  {SUMMARY_ACTIONS.has(h.action) && h.new_value && (
                    <div className="text-sm text-gray-500 mt-0.5 italic">"{h.new_value}"</div>
                  )}
                  {!TRANSITION_ACTIONS.has(h.action) && !SUMMARY_ACTIONS.has(h.action) && h.new_value && (
                    <div className="text-sm text-gray-500 mt-0.5">{h.new_value}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(h.created_at)}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
