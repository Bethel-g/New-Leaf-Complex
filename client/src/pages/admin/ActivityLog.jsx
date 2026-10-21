import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ScrollText, Loader2, Download, FilterX, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatDate } from '../../components/TicketTable';
import StatCard from '../../components/StatCard';
import { EmptyState } from '../../components/EmptyState';
import { downloadCSV } from '../../utils/csv';

const ACTION_OPTIONS = [
  'login', 'logout', 'login_failed', 'login_blocked', 'password_changed', 'profile_updated',
  'created', 'assigned', 'reassigned', 'status_changed', 'priority_changed',
  'work_notes_added', 'resolved', 'reopened', 'closed',
];

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', action: '', from: '', to: '' });

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = { limit: 500 };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/admin/activity-logs', { params }).then((res) => {
      setLogs(res.data);
    }).catch(() => {
      setLogs([]);
    }).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const hasFilters = Object.values(filters).some(Boolean);
  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const actionColor = (action) => {
    const map = {
      login: 'bg-blue-50 text-blue-700',
      logout: 'bg-gray-100 text-gray-600',
      login_failed: 'bg-red-50 text-red-700',
      login_blocked: 'bg-red-100 text-red-800',
      password_changed: 'bg-amber-50 text-amber-700',
      profile_updated: 'bg-accent-50 text-accent-700',
      created: 'bg-primary-50 text-primary-700',
      assigned: 'bg-indigo-50 text-indigo-700',
      status_changed: 'bg-yellow-50 text-yellow-700',
      priority_changed: 'bg-orange-50 text-orange-700',
      work_notes_added: 'bg-purple-50 text-purple-700',
    };
    return map[action] || 'bg-gray-100 text-gray-700';
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const stats = {
    total: logs.length,
    today: logs.filter((l) => new Date(l.created_at) >= startOfToday).length,
    users: new Set(logs.map((l) => l.user_name).filter(Boolean)).size,
    from: new Set(logs.map((l) => l.ip_address).filter(Boolean)).size,
  };

  const exportCSV = () => {
    const rows = logs.map((l) => ({
      user: l.user_name || 'System',
      action: l.action,
      entity: l.entity_type || '',
      entity_id: l.entity_id || '',
      details: l.details || '',
      ip_address: l.ip_address || '',
      timestamp: l.created_at,
    }));
    if (!downloadCSV(rows, 'activity-log')) toast.error('No activity to export');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">System Activity Log</h2>
          <p className="text-gray-500 text-sm">Audit trail of important system actions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Entries Shown" value={stats.total} icon={ScrollText} color="primary" />
        <StatCard title="Today" value={stats.today} icon={ScrollText} color="blue" />
        <StatCard title="Active Users" value={stats.users} icon={ScrollText} color="purple" />
        <StatCard title="Source Addresses" value={stats.from} icon={ScrollText} color="indigo" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search details, action..."
              aria-label="Search activity"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.action}
            onChange={(e) => setFilter('action', e.target.value)}
            aria-label="Filter by action"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilter('from', e.target.value)}
            aria-label="From date"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilter('to', e.target.value)}
            aria-label="To date"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => setFilters({ search: '', action: '', from: '', to: '' })}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800"
          >
            <FilterX className="w-4 h-4" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity recorded" subtitle={hasFilters ? 'Try adjusting your filters' : undefined} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{log.user_name || 'System'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.entity_type || '-'} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.details || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{log.ip_address || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(log.created_at)}</td>
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
