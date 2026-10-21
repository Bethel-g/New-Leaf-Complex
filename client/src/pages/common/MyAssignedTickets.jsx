import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UserCheck, FilterX, Download, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import TicketTable from '../../components/TicketTable';
import TicketStatTiles from '../../components/TicketStatTiles';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { downloadCSV } from '../../utils/csv';

const DONE_STATUSES = ['Resolved', 'Completed', 'Closed'];
const WAITING_STATUSES = ['Waiting for Information', 'Waiting for Parts'];

export default function MyAssignedTickets({ type }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });

  const loadTickets = useCallback(() => {
    setLoading(true);
    const params = { type, assigned_to: user.id, limit: 500 };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/tickets', { params }).then((res) => {
      setTickets(res.data.tickets);
    }).catch(() => {
      setTickets([]);
    }).finally(() => setLoading(false));
  }, [type, user.id, filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    api.get('/admin/statuses', { params: { type } }).then((res) => setStatuses(res.data)).catch(() => {});
    api.get('/admin/priorities').then((res) => setPriorities(res.data)).catch(() => {});
  }, [type]);

  const title = type === 'it' ? 'IT Tickets Assigned to Me' : 'Maintenance Tickets Assigned to Me';

  const stats = {
    total: tickets.length,
    unassigned: tickets.filter((t) => !t.assignee_name).length,
    waiting: tickets.filter((t) => WAITING_STATUSES.includes(t.status_name)).length,
    critical: tickets.filter((t) => t.priority_name === 'Critical').length,
    open: tickets.filter((t) => !DONE_STATUSES.includes(t.status_name)).length,
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const exportCSV = () => {
    const rows = tickets.map((t) => ({
      number: t.ticket_number,
      title: t.title,
      category: t.category_name,
      priority: t.priority_name,
      status: t.status_name,
      requester: t.requester_name,
      department: t.department_name,
      created: t.created_at,
    }));
    if (!downloadCSV(rows, `${type}-assigned-to-me`)) toast.error('No tickets to export');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-500 text-sm">Tickets currently assigned to you</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {!loading && `${stats.total} total · ${stats.open} open`}
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <TicketStatTiles stats={stats} accent={type === 'it' ? 'blue' : 'orange'} />

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="col-span-2 md:col-span-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search ticket #, title..."
              aria-label="Search assigned tickets"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilter('priority', e.target.value)}
            aria-label="Filter by priority"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={() => setFilters({ search: '', status: '', priority: '' })}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800"
          >
            <FilterX className="w-4 h-4" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={hasFilters ? 'No tickets match your filters' : 'No tickets assigned to you'}
          subtitle={hasFilters ? 'Try adjusting your filters' : 'When a supervisor assigns you a ticket, it will appear here'}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TicketTable tickets={tickets} type={type} />
        </div>
      )}
    </div>
  );
}
