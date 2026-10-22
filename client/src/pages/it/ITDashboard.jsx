import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MonitorCog, AlertTriangle, Clock, FileText, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import DateFilter from '../../components/DateFilter';
import DashboardList from '../../components/DashboardList';
import StatusSteps from '../../components/StatusSteps';
import CategoryChart from '../../components/CategoryChart';
import { LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';

export default function ITDashboard() {
  const { user } = useAuth();
  const { t, statusLabel } = useTranslation();
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month', from: '', to: '' });

  const isSupervisorView = user && ['it_supervisor', 'admin', 'sys_admin'].includes(user.role_name);

  const load = (next) => {
    setLoading(true);
    setFailed(false);
    const params = { period: next.period };
    if (next.from) params.from = next.from;
    if (next.to) params.to = next.to;
    api.get('/dashboard', { params })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  };

  useEffect(() => { load(filters); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const onFilterChange = (next) => {
    setFilters(next);
    load(next);
  };

  const statusSteps = [
    { label: statusLabel('New'), count: stats?.itStatusCounts?.New ?? 0 },
    { label: statusLabel('Assigned'), count: stats?.itStatusCounts?.Assigned ?? 0 },
    { label: statusLabel('In Progress'), count: stats?.itStatusCounts?.['In Progress'] ?? 0 },
    { label: statusLabel('Waiting for Information'), count: stats?.itStatusCounts?.['Waiting for Information'] ?? 0 },
    { label: statusLabel('Resolved'), count: stats?.itStatusCounts?.Resolved ?? 0 },
    { label: statusLabel('Closed'), count: stats?.itStatusCounts?.Closed ?? 0 },
  ];

  const itemLink = (ticket) => `/it/tickets/${ticket.id}`;
  const itRecent = (stats?.recentTickets ?? []).filter((ticket) => ticket.type === 'it').slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('it.dashboard.title')}</h2>
          <p className="text-gray-500 text-sm">
            {isSupervisorView ? t('it.dashboard.subtitle.supervisor') : t('it.dashboard.subtitle.staff')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter period={filters.period} from={filters.from} to={filters.to} onChange={onFilterChange} />
          <Link to="/it/tickets" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <FileText className="w-4 h-4" /> {t('it.dashboard.allTickets')}
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : failed ? (
        <div className="bg-surface rounded-xl border border-red-soft-border p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{t('it.dashboard.error.loadFailed')}</p>
          <button onClick={() => load(filters)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            {t('common.actions.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={t('it.dashboard.stat.total')} value={stats?.itCount ?? 0} icon={MonitorCog} color="blue" />
            <StatCard title={t('common.labels.critical')} value={stats?.itCritical ?? 0} icon={AlertTriangle} color="red" />
            <StatCard title={t('it.dashboard.stat.overdue')} value={stats?.itOverdue ?? 0} icon={Clock} color="orange" />
            <StatCard title={t('it.dashboard.stat.open')} value={stats?.openTickets ?? 0} icon={AlertCircle} color="yellow" />
          </div>

          <StatusSteps steps={statusSteps} color="blue" title={t('it.dashboard.byStatus')} />

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <DashboardList
                title={isSupervisorView ? t('it.dashboard.list.unresolved.title') : t('it.dashboard.list.assigned.title')}
                items={(isSupervisorView ? (stats?.unresolvedTickets ?? []).filter((ticket) => ticket.type === 'it') : stats?.myAssigned ?? [])}
                linkFor={itemLink}
                empty={t('it.dashboard.list.unresolved.empty')}
              />
            </div>
            <div className="lg:col-span-2">
              <DashboardList
                title={t('it.dashboard.list.recent.title')}
                items={itRecent}
                linkFor={itemLink}
                empty={t('it.dashboard.list.recent.empty')}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <CategoryChart title={t('it.dashboard.byCategory')} data={stats?.byCategoryIt ?? []} color="#2563eb" />
            <DashboardList
              title={t('it.dashboard.list.overdue.title')}
              items={stats?.itOverdueTickets ?? []}
              linkFor={itemLink}
              empty={t('it.dashboard.list.overdue.empty')}
            />
          </div>
        </>
      )}
    </div>
  );
}