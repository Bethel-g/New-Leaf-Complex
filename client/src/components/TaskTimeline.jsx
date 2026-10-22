import { History } from 'lucide-react';
import { formatDate } from './TicketTable';
import { useTranslation } from '../i18n';

/**
 * Every recorded change on a ticket or a suggestion, oldest first.
 *
 * Both resources write the same history vocabulary, so the labels below cover
 * them together and any action this component has not seen falls back to a
 * readable form of the action name rather than disappearing.
 */
const ACTION_KEYS = {
  created: 'common.timeline.created',
  assigned: 'common.timeline.assigned',
  assigned_department_changed: 'common.timeline.assignedDepartmentChanged',
  assigned_person_changed: 'common.timeline.assignedPersonChanged',
  status_changed: 'common.timeline.statusChanged',
  priority_changed: 'common.timeline.priorityChanged',
  comment_added: 'common.timeline.commentAdded',
  attachment_added: 'common.timeline.attachmentAdded',
  attachment_removed: 'common.timeline.attachmentRemoved',
  information_provided: 'common.timeline.informationProvided',
  work_notes_added: 'common.timeline.workNotesAdded',
  resolved: 'common.timeline.resolved',
  completed: 'common.timeline.completed',
  reopened: 'common.timeline.reopened',
  closed: 'common.timeline.closed',
  rejected: 'common.timeline.rejected',
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

function humanize(action, t) {
  const key = ACTION_KEYS[action];
  if (key) return t(key);
  const spaced = String(action || '').replace(/_/g, ' ');
  return t('common.timeline.unknown', { action: spaced });
}

export default function TaskTimeline({ history, title, emptyText }) {
  const { t } = useTranslation();
  const entries = history || [];
  const heading = title || t('common.labels.history');
  const emptyMessage = emptyText || t('common.timeline.empty');

  return (
    <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
        <History className="w-4 h-4 text-blue-soft-text" />
        <h3 className="font-semibold text-gray-800">{heading}</h3>
        {entries.length > 0 && <span className="text-xs text-gray-400">{t('common.timeline.entries', { count: entries.length })}</span>}
      </div>
      <div className="px-5 py-4">
        {entries.length === 0 ? (
          <div className="text-gray-400 text-sm">{emptyMessage}</div>
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
                    <span className="font-medium text-gray-800">{h.user_name || t('common.timeline.system')}</span> {humanize(h.action, t)}
                  </div>
                  {TRANSITION_ACTIONS.has(h.action) && (h.old_value || h.new_value) && (
                    <div className="text-sm text-gray-500 mt-0.5">
                      {h.old_value || t('common.timeline.none')} → <span className="font-medium text-gray-700">{h.new_value || t('common.timeline.none')}</span>
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
