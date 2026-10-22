import { Link } from 'react-router-dom';
import { Badge, statusColor, priorityColor } from './Badge';
import { formatDate } from './TicketTable';
import { useTranslation } from '../i18n';

export default function DashboardList({ title, items, linkFor, empty }) {
  const { t, statusLabel, priorityLabel } = useTranslation();
  const emptyText = empty || t('common.empty.noItems');
  return (
    <div className="bg-surface rounded-xl border border-gray-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-400">{t('common.dashboard.totalCount', { count: items.length })}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">{emptyText}</div>
        )}
        {items.map((t) => (
          <Link
            key={t.id}
            to={linkFor(t)}
            className="block px-5 py-3 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-800 truncate">
                {t.ticket_number ? `${t.ticket_number} - ${t.title}` : t.title}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {t.priority_name && <Badge color={priorityColor(t.priority_name)}>{priorityLabel(t.priority_name)}</Badge>}
                {t.status_name && <Badge color={statusColor(t.status_name)}>{statusLabel(t.status_name)}</Badge>}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {t.requester_name && `${t.requester_name} • `}
              {formatDate(t.created_at || t.updated_at)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}