import { Link } from 'react-router-dom';
import { Badge, statusColor, priorityColor } from './Badge';

// oxlint-disable-next-line react/only-export-components
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// oxlint-disable-next-line react/only-export-components
export function ticketKind(t) {
  if (t.type === 'it' || t.type === 'maintenance') return t.type;
  if (t.ticket_number && t.ticket_number.startsWith('MT-')) return 'maintenance';
  if (t.ticket_number && t.ticket_number.startsWith('IT-')) return 'it';
  return t.type;
}

export default function TicketTable({
  tickets, type,
  selectable = false, selectedIds = [], onToggle, onToggleAll, canSelect,
}) {
  const linkBase = type === 'it' ? '/it/tickets' : '/maintenance/tickets';
  const selected = new Set(selectedIds);
  const selectableIds = tickets.filter((t) => (canSelect ? canSelect(t) : true)).map((t) => t.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const colCount = selectable ? 7 : 6;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  aria-label="Select all tickets on this page"
                  checked={allSelected}
                  onChange={(e) => onToggleAll?.(e.target.checked, selectableIds)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tickets.length === 0 && (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400 text-sm">
                No tickets found
              </td>
            </tr>
          )}
          {tickets.map((t) => {
            const canPick = canSelect ? canSelect(t) : true;
            return (
              <tr key={t.id} className="hover:bg-gray-50">
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ticket ${t.ticket_number}`}
                      checked={selected.has(t.id)}
                      disabled={!canPick}
                      onChange={() => onToggle?.(t.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link to={`${linkBase}/${t.id}`} className="text-sm font-medium text-primary-700 hover:underline">
                    {t.ticket_number}
                  </Link>
                  <div className="text-xs text-gray-500 max-w-[200px] truncate">{t.title}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.category_name}</td>
                <td className="px-4 py-3">
                  <Badge color={priorityColor(t.priority_name)}>{t.priority_name}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={statusColor(t.status_name)}>{t.status_name}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.assignee_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(t.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}