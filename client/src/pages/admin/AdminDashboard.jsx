import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MonitorCog, Wrench, Lightbulb, Inbox, AlertTriangle, Clock,
  CheckCircle2, Timer, BarChart3, UserCheck, ClipboardCheck, Activity,
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import DateFilter from '../../components/DateFilter';
import DashboardList from '../../components/DashboardList';
import CategoryChart from '../../components/CategoryChart';
import { Badge, statusColor } from '../../components/Badge';
import { LoadingSpinner } from '../../components/EmptyState';
import { formatDate } from '../../components/TicketTable';

const DONE_STATUSES = ['Resolved', 'Completed', 'Closed'];
const REVIEW_STATUSES = ['Submitted', 'Under Review', 'Needs More Information'];
const TEAM_CAPACITY = 10; // open tickets considered a full workload for one technician
const DAY_MS = 86400000;

function ProgressBar({ value, color = 'bg-success-500' }) {
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month', from: '', to: '' });

  const load = (next) => {
    setLoading(true);
    const params = { period: next.period };
    if (next.from) params.from = next.from;
    if (next.to) params.to = next.to;
    Promise.all([
      api.get('/dashboard', { params }),
      api.get('/tickets', { params: { limit: 500 } }),
      api.get('/suggestions', { params: { limit: 500 } }),
      api.get('/users/technicians', { params: { type: 'it' } }),
      api.get('/users/technicians', { params: { type: 'maintenance' } }),
      api.get('/admin/recent-activity'),
    ])
      .then(([d, t, s, it, mt, a]) => {
        setStats(d.data);
        setTickets(t.data.tickets);
        setSuggestions(s.data.suggestions);
        setTechnicians([...it.data, ...mt.data]);
        setActivity(a.data);
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

  // ── Derived panels (all from real records) ─────────────────────────────────
  const resolved = tickets.filter((t) => DONE_STATUSES.includes(t.status_name));
  const resolvedWithin = (days) => {
    if (resolved.length === 0) return 0;
    const within = resolved.filter((t) => {
      const end = new Date(t.resolved_date || t.updated_at).getTime();
      return Number.isFinite(end) && (end - new Date(t.created_at).getTime()) <= days * DAY_MS;
    }).length;
    return Math.round((within / resolved.length) * 100);
  };
  const openTickets = stats?.openTickets ?? 0;
  const overdue = stats?.overdueCount ?? 0;
  const withinSlaPct = openTickets > 0 ? Math.round((1 - overdue / openTickets) * 100) : 100;

  const workload = technicians
    .map((tech) => ({
      ...tech,
      open: tickets.filter((t) => t.assigned_to === tech.id && !DONE_STATUSES.includes(t.status_name)).length,
    }))
    .sort((a, b) => b.open - a.open);

  const needingReview = suggestions.filter((s) => REVIEW_STATUSES.includes(s.status_name));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Administration Dashboard</h2>
          <p className="text-gray-500 text-sm">Hospital-wide operations overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter period={filters.period} from={filters.from} to={filters.to} onChange={onFilterChange} />
          <Link to="/admin/reports" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <BarChart3 className="w-4 h-4" /> Reports
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total IT Requests" value={stats?.itCount ?? 0} icon={MonitorCog} color="blue" />
            <StatCard title="Total Maintenance Requests" value={stats?.mCount ?? 0} icon={Wrench} color="orange" />
            <StatCard title="Total Suggestions" value={stats?.sCount ?? 0} icon={Lightbulb} color="purple" />
            <StatCard title="Open Requests" value={stats?.openTickets ?? 0} icon={Inbox} color="yellow" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Critical Requests" value={stats?.criticalTickets ?? 0} icon={AlertTriangle} color="red" />
            <StatCard title="Overdue Requests" value={stats?.overdueCount ?? 0} icon={Clock} color="orange" />
            <StatCard title="Resolved Requests" value={stats?.resolvedTickets ?? 0} icon={CheckCircle2} color="success" />
            <StatCard title="Avg Resolution Time" value={`${stats?.avgResolutionTimeDays ?? 0} d`} icon={Timer} color="indigo" />
          </div>

          {/* SLA performance + team workload */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary-600" /> SLA Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Resolved within 24 hours</span>
                    <span className="font-semibold text-gray-800">{resolvedWithin(1)}%</span>
                  </div>
                  <ProgressBar value={resolvedWithin(1)} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Resolved within 3 days</span>
                    <span className="font-semibold text-gray-800">{resolvedWithin(3)}%</span>
                  </div>
                  <ProgressBar value={resolvedWithin(3)} color="bg-blue-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Open requests within SLA</span>
                    <span className="font-semibold text-gray-800">{withinSlaPct}%</span>
                  </div>
                  <ProgressBar value={withinSlaPct} color={withinSlaPct >= 80 ? 'bg-success-500' : 'bg-orange-500'} />
                  <p className="text-xs text-gray-400 mt-1">{overdue} of {openTickets} open requests are past their priority target.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary-600" /> Team Workload
              </h3>
              {workload.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">No technicians found</div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {workload.map((tech) => {
                    const pct = Math.round((tech.open / TEAM_CAPACITY) * 100);
                    return (
                      <div key={tech.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{tech.name}</span>
                          <span className="text-gray-500">{tech.open} open</span>
                        </div>
                        <ProgressBar value={pct} color={pct >= 100 ? 'bg-red-500' : pct >= 60 ? 'bg-orange-500' : 'bg-success-500'} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <CategoryChart title="Requests by Department" data={stats?.byDepartment ?? []} color="#2563eb" />
            <CategoryChart title="Requests by Category" data={stats?.byCategory ?? []} color="#0ea5e9" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <DashboardList
              title="Recently Submitted"
              items={(stats?.recentTickets ?? []).slice(0, 8)}
              linkFor={ticketLink}
              empty="No requests submitted in period"
            />
            <DashboardList
              title="Recently Resolved / Completed"
              items={(stats?.recentCompleted ?? []).slice(0, 8)}
              linkFor={ticketLink}
              empty="No resolved requests in period"
            />
          </div>

          {/* Suggestions needing review + recent system activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-purple-600" /> Suggestions Needing Review
                </h3>
                <Link to="/admin/suggestions" className="text-sm text-primary-600 hover:underline">Review all</Link>
              </div>
              {needingReview.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">Nothing awaiting review</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {needingReview.slice(0, 8).map((s) => (
                    <li key={s.id}>
                      <Link to={`/suggestions/${s.id}`} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{s.suggestion_number} · {s.title}</div>
                          <div className="text-xs text-gray-500 truncate">{s.department_name}</div>
                        </div>
                        <Badge color={statusColor(s.status_name)}>{s.status_name}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-600" /> Recent System Activity
                </h3>
              </div>
              {activity.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">No activity recorded yet</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {activity.map((log) => (
                    <li key={log.id} className="px-5 py-3">
                      <div className="text-sm text-gray-800">
                        <span className="font-medium">{log.user_name || 'System'}</span>{' '}
                        <span className="text-gray-500">{log.action?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-xs text-gray-400">{log.details || '—'} · {formatDate(log.created_at)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
