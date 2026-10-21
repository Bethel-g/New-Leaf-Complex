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

export default function ITDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month', from: '', to: '' });

  const isSupervisorView = user && ['it_supervisor', 'admin', 'sys_admin'].includes(user.role_name);

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
    { label: 'New', count: stats?.itStatusCounts?.New ?? 0 },
    { label: 'Assigned', count: stats?.itStatusCounts?.Assigned ?? 0 },
    { label: 'In Progress', count: stats?.itStatusCounts?.['In Progress'] ?? 0 },
    { label: 'Waiting', count: stats?.itStatusCounts?.['Waiting for Information'] ?? 0 },
    { label: 'Resolved', count: stats?.itStatusCounts?.Resolved ?? 0 },
    { label: 'Closed', count: stats?.itStatusCounts?.Closed ?? 0 },
  ];

  const itemLink = (t) => `/it/tickets/${t.id}`;
  const itRecent = (stats?.recentTickets ?? []).filter((t) => t.type === 'it').slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">IT Support Dashboard</h2>
          <p className="text-gray-500 text-sm">
            {isSupervisorView ? 'Monitor the IT queue and unresolved tickets' : 'Manage your assigned tickets'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter period={filters.period} from={filters.from} to={filters.to} onChange={onFilterChange} />
          <Link to="/it/tickets" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <FileText className="w-4 h-4" /> All IT Tickets
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error}</p>
          <button onClick={() => load(filters)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total IT Tickets" value={stats?.itCount ?? 0} icon={MonitorCog} color="blue" />
            <StatCard title="Critical" value={stats?.itCritical ?? 0} icon={AlertTriangle} color="red" />
            <StatCard title="Overdue" value={stats?.itOverdue ?? 0} icon={Clock} color="orange" />
            <StatCard title="Open (active)" value={stats?.openTickets ?? 0} icon={AlertCircle} color="yellow" />
          </div>

          <StatusSteps steps={statusSteps} color="blue" title="IT tickets by status" />

          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <DashboardList
                title={isSupervisorView ? 'Unresolved IT Tickets' : 'My Assigned IT Tickets'}
                items={(isSupervisorView ? (stats?.unresolvedTickets ?? []).filter((t) => t.type === 'it') : stats?.myAssigned ?? [])}
                linkFor={itemLink}
                empty="No unresolved IT tickets. Great job!"
              />
            </div>
            <div className="lg:col-span-2">
              <DashboardList
                title="Recent IT Tickets"
                items={itRecent}
                linkFor={itemLink}
                empty="No IT tickets in period"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <CategoryChart title="IT Tickets by Category" data={stats?.byCategoryIt ?? []} color="#2563eb" />
            <DashboardList
              title="Overdue IT Tickets"
              items={stats?.itOverdueTickets ?? []}
              linkFor={itemLink}
              empty="No overdue IT tickets"
            />
          </div>
        </>
      )}
    </div>
  );
}