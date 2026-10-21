import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MonitorCog, Wrench, Lightbulb,
  Inbox, CheckCircle2, LightbulbOff, RefreshCw, CalendarRange,
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import DateFilter from '../../components/DateFilter';
import DashboardList from '../../components/DashboardList';
import { LoadingSpinner } from '../../components/EmptyState';

const quickLinks = [
  {
    to: '/submit-it',
    icon: MonitorCog,
    title: 'IT Support Request',
    desc: 'Report computer, network, printer, or software problems',
    color: 'from-blue-500 to-blue-600',
    accent: 'text-blue-600',
  },
  {
    to: '/submit-maintenance',
    icon: Wrench,
    title: 'Maintenance Request',
    desc: 'Report facility, equipment, plumbing, or electrical issues',
    color: 'from-orange-500 to-orange-600',
    accent: 'text-orange-600',
  },
  {
    to: '/submit-suggestion',
    icon: Lightbulb,
    title: 'Staff Suggestion',
    desc: 'Share an idea to improve the hospital',
    color: 'from-violet-500 to-violet-600',
    accent: 'text-violet-600',
  },
];

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month', from: '', to: '' });

  const load = (next) => {
    setLoading(true);
    const params = { period: next.period };
    if (next.from) params.from = next.from;
    if (next.to) params.to = next.to;
    api.get('/dashboard', { params })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(filters); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const onFilterChange = (next) => {
    setFilters(next);
    load(next);
  };

  const ticketLink = (t) => (t.type === 'it' ? `/it/tickets/${t.id}` : `/maintenance/tickets/${t.id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Dashboard</h2>
          <p className="text-gray-500 text-sm">Submit and track your requests</p>
        </div>
        <DateFilter period={filters.period} from={filters.from} to={filters.to} onChange={onFilterChange} />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${link.color} flex items-center justify-center text-white mb-3`}>
              <link.icon className="w-6 h-6" />
            </div>
            <div className={`font-semibold text-gray-800 group-hover:${link.accent}`}>{link.title}</div>
            <div className="text-sm text-gray-500 mt-1">{link.desc}</div>
          </Link>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Summary + section counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Open Requests" value={stats?.myOpenRequests?.length ?? 0} icon={Inbox} color="yellow" />
            <StatCard title="Resolved Requests" value={stats?.myResolvedRequests?.length ?? 0} icon={CheckCircle2} color="success" />
            <StatCard title="My Suggestions" value={stats?.mySuggestions?.length ?? 0} icon={LightbulbOff} color="purple" />
            <StatCard title="Recently Updated" value={stats?.recentlyUpdated?.length ?? 0} icon={RefreshCw} color="blue" />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CalendarRange className="w-3.5 h-3.5" />
            Showing {filters.period === 'today' ? 'today' : filters.period === 'week' ? 'this week' : filters.period === 'month' ? 'this month' : 'custom range'} ({stats?.totalTickets ?? 0} requests, {stats?.sCount ?? 0} suggestions)
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <DashboardList
              title="My Open Requests"
              items={stats?.myOpenRequests ?? []}
              linkFor={ticketLink}
              empty="No open requests"
            />
            <DashboardList
              title="My Resolved Requests"
              items={stats?.myResolvedRequests ?? []}
              linkFor={ticketLink}
              empty="No resolved requests yet"
            />
            <DashboardList
              title="My Suggestions"
              items={stats?.mySuggestions ?? []}
              linkFor={(s) => `/suggestions/${s.id}`}
              empty="No suggestions yet"
            />
            <DashboardList
              title="Recently Updated Requests"
              items={stats?.recentlyUpdated ?? []}
              linkFor={ticketLink}
              empty="No recent updates"
            />
          </div>
        </>
      )}
    </div>
  );
}