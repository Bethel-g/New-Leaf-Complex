import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ScrollText, Loader2, Download, FilterX, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import StatCard from '../../components/StatCard';
import { EmptyState } from '../../components/EmptyState';
import { downloadCSV } from '../../utils/csv';

const ACTION_OPTIONS = [
  'login', 'logout', 'login_failed', 'login_blocked', 'password_changed', 'profile_updated',
  'created', 'assigned', 'reassigned', 'status_changed', 'priority_changed',
  'work_notes_added', 'resolved', 'reopened', 'closed',
];

// Wording for each audit action the server reports.
const ACTION_LABEL_KEYS = {
  login: 'admin.activity.action.login',
  logout: 'admin.activity.action.logout',
  login_failed: 'admin.activity.action.loginFailed',
  login_blocked: 'admin.activity.action.loginBlocked',
  password_changed: 'admin.activity.action.passwordChanged',
  profile_updated: 'admin.activity.action.profileUpdated',
  created: 'admin.activity.action.created',
  assigned: 'admin.activity.action.assigned',
  reassigned: 'admin.activity.action.reassigned',
  status_changed: 'admin.activity.action.statusChanged',
  priority_changed: 'admin.activity.action.priorityChanged',
  work_notes_added: 'admin.activity.action.workNotesAdded',
  resolved: 'admin.activity.action.resolved',
  reopened: 'admin.activity.action.reopened',
  closed: 'admin.activity.action.closed',
};

export default function ActivityLog() {
  const { t, formatDateTime } = useTranslation();
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

  const actionLabel = (action) => {
    const key = ACTION_LABEL_KEYS[action];
    return key ? t(key) : String(action || '').replace(/_/g, ' ');
  };

  const actionColor = (action) => {
    const map = {
      login: 'bg-blue-soft text-blue-soft-text',
      logout: 'bg-gray-100 text-gray-600',
      login_failed: 'bg-red-soft text-red-soft-text',
      login_blocked: 'bg-red-soft-strong text-red-soft-text',
      password_changed: 'bg-amber-soft text-amber-soft-text',
      profile_updated: 'bg-accent-soft text-accent-soft-text',
      created: 'bg-primary-soft text-brand-text-strong',
      assigned: 'bg-indigo-soft text-indigo-soft-text',
      status_changed: 'bg-yellow-soft text-yellow-soft-text',
      priority_changed: 'bg-orange-soft text-orange-soft-text',
      work_notes_added: 'bg-purple-soft text-purple-soft-text',
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
      user: l.user_name || t('common.timeline.system'),
      action: l.action,
      entity: l.entity_type || '',
      entity_id: l.entity_id || '',
      details: l.details || '',
      ip_address: l.ip_address || '',
      timestamp: l.created_at,
    }));
    if (!downloadCSV(rows, 'activity-log')) toast.error(t('admin.activity.toast.noActivityToExport'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('admin.activity.title')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.activity.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> {t('admin.activity.refresh')}
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Download className="w-4 h-4" /> {t('common.myAssigned.exportCsv')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t('admin.activity.stat.entries')} value={stats.total} icon={ScrollText} color="primary" />
        <StatCard title={t('common.dateFilter.today')} value={stats.today} icon={ScrollText} color="blue" />
        <StatCard title={t('admin.activity.stat.activeUsers')} value={stats.users} icon={ScrollText} color="purple" />
        <StatCard title={t('admin.activity.stat.sourceAddresses')} value={stats.from} icon={ScrollText} color="indigo" />
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder={t('admin.activity.filter.searchPlaceholder')}
              aria-label={t('admin.activity.aria.search')}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.action}
            onChange={(e) => setFilter('action', e.target.value)}
            aria-label={t('admin.activity.aria.filterAction')}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">{t('admin.activity.filter.allActions')}</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{actionLabel(a)}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilter('from', e.target.value)}
            aria-label={t('common.dateFilter.from')}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilter('to', e.target.value)}
            aria-label={t('common.dateFilter.to')}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => setFilters({ search: '', action: '', from: '', to: '' })}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-text hover:text-brand-text-deep"
          >
            <FilterX className="w-4 h-4" /> {t('common.myAssigned.clearFilters')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-text" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title={t('admin.activity.empty.title')} subtitle={hasFilters ? t('common.myAssigned.empty.filteredSubtitle') : undefined} />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.user')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.activity.table.action')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.activity.table.entity')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.details')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.ipAddress')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.activity.table.dateTime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{log.user_name || t('common.timeline.system')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.entity_type || '-'} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.details || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{log.ip_address || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(log.created_at)}</td>
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
