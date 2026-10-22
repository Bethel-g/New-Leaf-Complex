import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, AlertTriangle, Clock, FileText, AlertCircle,
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

export default function MaintenanceDashboard() {
  const { user } = useAuth();
  const { t, statusLabel } = useTranslation();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month', from: '', to: '' });

  const isSupervisorView = user && ['maintenance_supervisor', 'admin', 'sys_admin'].includes(user.role_name);

  const load = (next) => {
    setLoading(true);
    setError('');
    const params = { period: next.period };
    if (next.from) params.from = next.from;
    if (next.to) params.to = next.to;
    api.get('/dashboard', { params })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t('maintenance.dashboard.error.loadFailed'));
        setLoading(false);
      });
  };

  useEffect(() => { load(filters); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const onFilterChange = (next) => {
    setFilters(next);
    load(next);
  };

  const statusSteps = [
    { label: statusLabel('New'), count: stats?.mStatusCounts?.New ?? 0 },
    { label: statusLabel('Assigned'), count: stats?.mStatusCounts?.Assigned ?? 0 },
    { label: statusLabel('Inspection'), count: stats?.mStatusCounts?.Inspection ?? 0 },
    { label: statusLabel('In Progress'), count: stats?.mStatusCounts?.['In Progress'] ?? 0 },
    { label: statusLabel('Waiting for Parts'), count: stats?.mStatusCounts?.['Waiting for Parts'] ?? 0 },
    { label: statusLabel('Completed'), count: stats?.mStatusCounts?.Completed ?? 0 },
    { label: statusLabel('Closed'), count: stats?.mStatusCounts?.Closed ?? 0 },
  ];

  const itemLink = (ticket) => `/maintenance/tickets/${ticket.id}`;
  const mRecent = (stats?.recentTickets ?? []).filter((ticket) => ticket.type === 'maintenance').slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('maintenance.dashboard.title')}</h2>
          <p className="text-gray-500 text-sm">
            {isSupervisorView ? t('maintenance.dashboard.subtitle.supervisor') : t('maintenance.dashboard.subtitle.staff')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter period={filters.period} from={filters.from} to={filters.to} onChange={onFilterChange} />
          <Link to="/maintenance/tickets" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
            <FileText className="w-4 h-4" /> {t('maintenance.dashboard.allTickets')}
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-surface rounded-xl border border-red-soft-border p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error}</p>
          <button onClick={() => load(filters)} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
            {t('common.actions.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={t('maintenance.dashboard.stat.total')} value={stats?.mCount ?? 0} icon={Wrench} color="orange" />
            <StatCard title={t('common.labels.critical')} value={stats?.mCritical ?? 0} icon={AlertTriangle} color="red" />
            <StatCard title={t('maintenance.dashboard.stat.overdue')} value={stats?.mOverdue ?? 0} icon={Clock} color="orange" />
            <StatCard title={t('maintenance.dashboard.stat.open')} value={stats?.openTickets ?? 0} icon={AlertCircle} color="yellow" />
          </div>

          <StatusSteps steps={statusSteps} color="orange" title={t('maintenance.dashboard.byStatus')} />

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <DashboardList
                title={isSupervisorView ? t('maintenance.dashboard.list.unresolved.title') : t('maintenance.dashboard.list.assigned.title')}
                items={(isSupervisorView ? (stats?.unresolvedTickets ?? []).filter((ticket) => ticket.type === 'maintenance') : stats?.myAssigned ?? [])}
                linkFor={itemLink}
                empty={t('maintenance.dashboard.list.unresolved.empty')}
              />
            </div>
            <div className="lg:col-span-2">
              <DashboardList
                title={t('maintenance.dashboard.list.recent.title')}
                items={mRecent}
                linkFor={itemLink}
                empty={t('maintenance.dashboard.list.recent.empty')}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <CategoryChart title={t('maintenance.dashboard.byCategory')} data={stats?.byCategoryMaint ?? []} color="#ea580c" />
            <DashboardList
              title={t('maintenance.dashboard.list.overdue.title')}
              items={stats?.mOverdueTickets ?? []}
              linkFor={itemLink}
              empty={t('maintenance.dashboard.list.overdue.empty')}
            />
          </div>
        </>
      )}
    </div>
  );
}