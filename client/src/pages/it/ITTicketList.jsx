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
import { useTranslation } from '../../i18n';

const PAGE_SIZE = 20;
const WAITING_STATUSES = ['Waiting for Information'];

export default function ITTicketList() {
  const { hasRole } = useAuth();
  const { t, statusLabel, priorityLabel } = useTranslation();
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
      setError(t('it.tickets.error.loadFailed'));
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
      if (failed) toast.error(t('it.tickets.toast.bulkAssignFailed', { failed, total: selected.length }));
      else toast.success(t('it.tickets.toast.bulkAssignSuccess', { count: selected.length }));
      setSelected([]);
      setModalOpen(false);
      loadTickets();
    } finally {
      setAssigning(false);
    }
  };

  const exportCSV = () => {
    const rows = allTickets.map((ticket) => ({
      number: ticket.ticket_number,
      title: ticket.title,
      category: ticket.category_name,
      priority: ticket.priority_name,
      status: ticket.status_name,
      assigned_to: ticket.assignee_name || t('common.labels.unassigned'),
      department: ticket.department_name,
      location: ticket.location || '',
      created: ticket.created_at,
    }));
    if (!downloadCSV(rows, 'it-tickets')) toast.error(t('common.myAssigned.noTicketsToExport'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('it.tickets.title')}</h2>
          <p className="text-gray-500 text-sm">{t('it.tickets.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> {t('common.myAssigned.exportCsv')}
          </button>
          <div className="text-sm text-gray-500">
            {loading ? t('common.empty.loading') : t('it.tickets.count', { count: total })}
          </div>
        </div>
      </div>

      <TicketStatTiles stats={stats} accent="blue" />

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="col-span-2 md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder={t('it.tickets.filter.searchPlaceholder')}
              aria-label={t('it.tickets.aria.search')}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label={t('common.myAssigned.filterByStatus')}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('common.myAssigned.allStatuses')}</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.name}>{statusLabel(s.name)}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilter('priority', e.target.value)}
            aria-label={t('common.myAssigned.filterByPriority')}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('common.myAssigned.allPriorities')}</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.name}>{priorityLabel(p.name)}</option>
            ))}
          </select>
          <select
            value={filters.department}
            onChange={(e) => setFilter('department', e.target.value)}
            aria-label={t('it.tickets.aria.filterDepartment')}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('it.tickets.filter.allDepartments')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
            aria-label={t('it.tickets.aria.filterCategory')}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">{t('it.tickets.filter.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-soft-text hover:text-blue-soft-text"
          >
            <FilterX className="w-4 h-4" /> {t('common.myAssigned.clearFilters')}
          </button>
        )}
      </div>

      {canAssign && selected.length > 0 && (
        <div className="flex items-center justify-between bg-primary-soft border border-primary-soft-border rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-brand-text-deep">{t('it.tickets.bulk.selected', { count: selected.length })}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected([])} className="text-sm text-gray-600 hover:text-gray-800">{t('common.actions.clear')}</button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <UserCheck className="w-4 h-4" /> {t('it.tickets.bulk.assignSelected')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-surface rounded-xl border border-red-soft-border p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error}</p>
          <button
            onClick={() => { setPage(1); loadTickets(); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" /> {t('common.actions.retry')}
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('it.tickets.empty.title')}
          subtitle={hasFilters ? t('common.myAssigned.empty.filteredSubtitle') : t('it.tickets.empty.subtitle')}
        />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
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
