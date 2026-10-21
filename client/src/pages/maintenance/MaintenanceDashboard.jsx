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

export default function MaintenanceDashboard() {
  const { user } = useAuth();
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
        setError('Failed to load dashboard');
        setLoading(false);
      });
  };

  useEffect(() => { load(filters); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const onFilterChange = (next) => {
    setFilters(next);
    load(next);
  };

  const statusSteps = [
    { label: 'New', count: stats?.mStatusCounts?.New ?? 0 },
    { label: 'Assigned', count: stats?.mStatusCounts?.Assigned ?? 0 },
    { label: 'Inspection', count: stats?.mStatusCounts?.Inspection ?? 0 },
    { label: 'In Progress', count: stats?.mStatusCounts?.['In Progress'] ?? 0 },
    { label: 'Waiting for Parts', count: stats?.mStatusCounts?.['Waiting for Parts'] ?? 0 },
    { label: 'Completed', count: stats?.mStatusCounts?.Completed ?? 0 },
    { label: 'Closed', count: stats?.mStatusCounts?.Closed ?? 0 },
  ];

  const itemLink = (t) => `/maintenance/tickets/${t.id}`;
  const mRecent = (stats?.recentTickets ?? []).filter((t) => t.type === 'maintenance').slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Maintenance Dashboard</h2>
          <p className="text-gray-500 text-sm">
            {isSupervisorView ? 'Monitor the maintenance queue and unresolved requests' : 'Manage your assigned requests'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter period={filters.period} from={filters.from} to={filters.to} onChange={onFilterChange} />
          <Link to="/maintenance/tickets" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
            <FileText className="w-4 h-4" /> All Maintenance Tickets
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error}</p>
          <button onClick={() => load(filters)} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Maintenance" value={stats?.mCount ?? 0} icon={Wrench} color="orange" />
            <StatCard title="Critical" value={stats?.mCritical ?? 0} icon={AlertTriangle} color="red" />
            <StatCard title="Overdue" value={stats?.mOverdue ?? 0} icon={Clock} color="orange" />
            <StatCard title="Open (active)" value={stats?.openTickets ?? 0} icon={AlertCircle} color="yellow" />
          </div>

          <StatusSteps steps={statusSteps} color="orange" title="Maintenance requests by status" />

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <DashboardList
                title={isSupervisorView ? 'Unresolved Maintenance Requests' : 'My Assigned Maintenance Requests'}
                items={(isSupervisorView ? (stats?.unresolvedTickets ?? []).filter((t) => t.type === 'maintenance') : stats?.myAssigned ?? [])}
                linkFor={itemLink}
                empty="No unresolved maintenance requests. Great job!"
              />
            </div>
            <div className="lg:col-span-2">
              <DashboardList
                title="Recent Maintenance Requests"
                items={mRecent}
                linkFor={itemLink}
                empty="No maintenance requests in period"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <CategoryChart title="Maintenance Requests by Category" data={stats?.byCategoryMaint ?? []} color="#ea580c" />
            <DashboardList
              title="Overdue Maintenance Requests"
              items={stats?.mOverdueTickets ?? []}
              linkFor={itemLink}
              empty="No overdue maintenance requests"
            />
          </div>
        </>
      )}
    </div>
  );
}