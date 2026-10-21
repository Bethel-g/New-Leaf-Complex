import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, FilterX, Printer, Download } from 'lucide-react';
import api from '../../services/api';
import { Badge, statusColor, priorityColor } from '../../components/Badge';
import { formatDate, ticketKind } from '../../components/TicketTable';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';

export default function AllRequests() {
  const [tickets, setTickets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });

  const loadData = useCallback(() => {
    const params = { limit: 200 };
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;

    Promise.all([
      api.get('/tickets', { params }),
      api.get('/suggestions', { params: { limit: 200 } }),
    ]).then(([t, s]) => {
      setTickets(t.data.tickets);
      setSuggestions(s.data.suggestions);
    }).catch(() => {
      setTickets([]);
      setSuggestions([]);
    }).finally(() => setLoading(false));
  }, [filters.search, filters.status, filters.priority]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allItems = [
    ...tickets.map((t) => {
      const kind = ticketKind(t);
      return {
        kind,
        id: t.id,
        number: t.ticket_number,
        title: t.title,
        requester: t.requester_name,
        category: t.category_name,
        priority: t.priority_name,
        status: t.status_name,
        date: t.created_at,
        link: kind === 'it' ? `/it/tickets/${t.id}` : `/maintenance/tickets/${t.id}`,
      };
    }),
    ...suggestions.map((s) => ({
      kind: 'suggestion',
      id: s.id,
      number: s.suggestion_number,
      title: s.title,
      requester: s.user_name,
      category: 'Suggestion',
      priority: null,
      status: s.status_name,
      date: s.created_at,
      link: `/suggestions/${s.id}`,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = allItems.filter((item) => {
    if (tab === 'it' && item.kind !== 'it') return false;
    if (tab === 'maintenance' && item.kind !== 'maintenance') return false;
    if (tab === 'suggestion' && item.kind !== 'suggestion') return false;
    return true;
  });

  const downloadCSV = () => {
    const headers = ['Number', 'Title', 'Requester', 'Type', 'Priority', 'Status', 'Date'];
    const rows = filtered.map((i) => [
      i.number, i.title, i.requester, i.kind, i.priority || '', i.status, new Date(i.date).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newleaf-all-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All Requests</h2>
          <p className="text-gray-500 text-sm">View all tickets and suggestions across the hospital</p>
        </div>
        <div className="flex gap-2">
          <button onClick={printReport} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={downloadCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['all', 'it', 'maintenance', 'suggestion'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'all' ? `All (${allItems.length})` : t === 'it' ? `IT (${tickets.filter((x) => ticketKind(x) === 'it').length})` : t === 'maintenance' ? `Maintenance (${tickets.filter((x) => ticketKind(x) === 'maintenance').length})` : `Suggestions (${suggestions.length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="col-span-2 md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by ID, title, or requester..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Statuses</option>
            {[...new Set(allItems.map((i) => i.status))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Priorities</option>
            {['Low', 'Medium', 'High', 'Critical'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={() => setFilters({ search: '', status: '', priority: '' })}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            <FilterX className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No requests found" subtitle="Try adjusting your filters" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item) => (
                  <tr key={`${item.kind}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={item.link} className="text-sm font-medium text-primary-700 hover:underline">
                        {item.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.requester}</td>
                    <td className="px-4 py-3">
                      <Badge color={item.kind === 'it' ? 'blue' : item.kind === 'maintenance' ? 'orange' : 'green'}>
                        {item.kind === 'it' ? 'IT' : item.kind === 'maintenance' ? 'Maintenance' : 'Suggestion'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                    <td className="px-4 py-3">
                      {item.priority
                        ? <Badge color={priorityColor(item.priority)}>{item.priority}</Badge>
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={statusColor(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}