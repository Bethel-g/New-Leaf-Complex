import { Link } from 'react-router-dom';
import { Badge, statusColor, priorityColor } from '../components/Badge';
import { formatDate } from '../components/TicketTable';

export default function TicketCard({ ticket, basePath }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <Link to={`${basePath}/${ticket.id}`} className="font-semibold text-primary-700 hover:underline">
          {ticket.ticket_number}
        </Link>
        <Badge color={priorityColor(ticket.priority_name)}>{ticket.priority_name}</Badge>
      </div>
      <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-1">{ticket.title}</h3>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span>{ticket.type === 'it' ? 'IT' : 'Maintenance'}</span>
        <span>•</span>
        <span>{ticket.requester_name}</span>
      </div>
      <div className="flex items-center justify-between">
        <Badge color={statusColor(ticket.status_name)}>{ticket.status_name}</Badge>
        <span className="text-xs text-gray-400">{formatDate(ticket.created_at)}</span>
      </div>
    </div>
  );
}