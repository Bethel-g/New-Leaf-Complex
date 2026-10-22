import { Link } from 'react-router-dom';
import { Badge, statusColor, priorityColor } from '../components/Badge';
import { formatDate } from '../components/TicketTable';
import { useTranslation } from '../i18n';

export default function TicketCard({ ticket, basePath }) {
  const { t, statusLabel, priorityLabel } = useTranslation();
  return (
    <div className="bg-surface rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <Link to={`${basePath}/${ticket.id}`} className="font-semibold text-brand-text-strong hover:underline">
          {ticket.ticket_number}
        </Link>
        <Badge color={priorityColor(ticket.priority_name)}>{priorityLabel(ticket.priority_name)}</Badge>
      </div>
      <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-1">{ticket.title}</h3>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span>{ticket.type === 'it' ? t('common.ticket.type.it') : t('common.ticket.type.maintenance')}</span>
        <span>•</span>
        <span>{ticket.requester_name}</span>
      </div>
      <div className="flex items-center justify-between">
        <Badge color={statusColor(ticket.status_name)}>{statusLabel(ticket.status_name)}</Badge>
        <span className="text-xs text-gray-400">{formatDate(ticket.created_at)}</span>
      </div>
    </div>
  );
}