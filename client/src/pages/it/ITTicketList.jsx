import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, FileText, FilterX, AlertTriangle, RefreshCw, Download, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TicketTable from '../../components/TicketTable';
import TicketStatTiles from '../../components/TicketStatTiles';
import BulkAssignModal from '../../components/BulkAssignModal';
import Pagination from '../../components/Pagination';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { downloadCSV } from '../../utils/csv';

const PAGE_SIZE = 20;
const WAITING_STATUSES = ['Waiting for Information'];

export default function ITTicketList() {
  const { hasRole } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    department: '',
    category: '',
  });
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  const canAssign = hasRole('it_supervisor', 'admin', 'sys_admin');

  const activeFilters = () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    return params;
  };

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    const base = activeFilters();
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get('/tickets', { params: { type: 'it', ...base, limit: PAGE_SIZE, page } }),
        api.get('/tickets', { params: { type: 'it', ...base, limit: 500 } }),
      ]);
      setTickets(listRes.data.tickets);
      setTotal(listRes.data.total);
      const all = statsRes.data.tickets;
      setAllTickets(all);
      setStats({
        total: listRes.data.total,
        unassigned: all.filter((t) => !t.assignee_name).length,
        waiting: all.filter((t) => WAITING_STATUSES.includes(t.status_name)).length,
        critical: all.filter((t) => t.priority_name === 'Critical').length,
      });
    } catch {
      setError('Failed to load IT tickets');
      setTickets([]);
      setAllTickets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    loadTickets();
    // Reload whenever the page or any filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterKey]);

  useEffect(() => {
    api.get('/admin/categories', { params: { type: 'it' } }).then((res) => setCategories(res.data)).catch(() => {});
    api.get('/admin/statuses', { params: { type: 'it' } }).then((res) => setStatuses(res.data)).catch(() => {});
    api.get('/admin/priorities').then((res) => setPriorities(res.data)).catch(() => {});
    api.get('/tickets', { params: { type: 'it', limit: 200 } }).then((res) => {
      const depts = [...new Set(res.data.tickets.map((t) => t.department_name).filter(Boolean))];
      setDepartments(depts);
    }).catch(() => {});
    if (canAssign) {
      api.get('/users/technicians', { params: { type: 'it' } }).then((res) => setTechnicians(res.data)).catch(() => {});
    }
  }, [canAssign]);

  const hasFilters = Object.values(filters).some(Boolean);

  const clearFilters = () => {
    setFilters({ search: '', status: '', priority: '', department: '', category: '' });
    setPage(1);
    setSelected([]);
  };

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setSelected([]);
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = (checked, ids) => {
    setSelected((current) => (checked ? [...new Set([...current, ...ids])] : current.filter((x) => !ids.includes(x))));
  };

  const applyBulkAssign = async (technicianId) => {
    setAssigning(true);
    try {
      const results = await Promise.allSettled(selected.map((id) => api.put(`/tickets/${id}`, { assigned_to: technicianId })));
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed) toast.error(`${failed} of ${selected.length} tickets could not be assigned`);
      else toast.success(`Assigned ${selected.length} ticket${selected.length === 1 ? '' : 's'}`);
      setSelected([]);
      setModalOpen(false);
      loadTickets();
    } finally {
      setAssigning(false);
    }
  };

  const exportCSV = () => {
    const rows = allTickets.map((t) => ({
      number: t.ticket_number,
      title: t.title,
      category: t.category_name,
      priority: t.priority_name,
      status: t.status_name,
      assigned_to: t.assignee_name || 'Unassigned',
      department: t.department_name,
      location: t.location || '',
      created: t.created_at,
    }));
    if (!downloadCSV(rows, 'it-tickets')) toast.error('No tickets to export');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">IT Tickets</h2>
          <p className="text-gray-500 text-sm">View and manage IT support tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <div className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${total} ticket${total === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      <TicketStatTiles stats={stats} accent="blue" />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="col-span-2 md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search ticket #, title, requester..."
              aria-label="Search tickets"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          <select
            value={filters.department}
            onChange={(e) => setFilter('department', e.target.value)}
            aria-label="Filter by department"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            <FilterX className="w-4 h-4" /> Clear filters
          </button>
        )}
      </div>

      {canAssign && selected.length > 0 && (
        <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-primary-800">{selected.length} ticket{selected.length === 1 ? '' : 's'} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected([])} className="text-sm text-gray-600 hover:text-gray-800">Clear</button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <UserCheck className="w-4 h-4" /> Assign selected
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error}</p>
          <button
            onClick={() => { setPage(1); loadTickets(); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No IT tickets found"
          subtitle={hasFilters ? 'Try adjusting your filters' : 'New tickets will appear here'}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TicketTable
            tickets={tickets}
            type="it"
            selectable={canAssign}
            selectedIds={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
          <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}

      <BulkAssignModal
        open={modalOpen}
        technicians={technicians}
        count={selected.length}
        saving={assigning}
        onClose={() => setModalOpen(false)}
        onAssign={applyBulkAssign}
      />
    </div>
  );
}
