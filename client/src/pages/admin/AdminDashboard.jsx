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
import { useTranslation } from '../../i18n';

const DONE_STATUSES = ['Resolved', 'Completed', 'Closed'];
const REVIEW_STATUSES = ['Submitted', 'Under Review', 'Needs More Information'];
const TEAM_CAPACITY = 10; // open tickets considered a full workload for one technician
const DAY_MS = 86400000;

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

function ProgressBar({ value, color = 'bg-success-500' }) {
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function AdminDashboard() {
  const { t, statusLabel, formatDateTime, formatNumber } = useTranslation();
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
      .then(([d, ticketRes, s, it, mt, a]) => {
        setStats(d.data);
        setTickets(ticketRes.data.tickets);
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

  const actionLabel = (action) => {
    const key = ACTION_LABEL_KEYS[action];
    return key ? t(key) : String(action || '').replace(/_/g, ' ');
  };

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
          <h2 className="text-2xl font-bold text-gray-800">{t('admin.dashboard.title')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter period={filters.period} from={filters.from} to={filters.to} onChange={onFilterChange} />
          <Link to="/admin/reports" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <BarChart3 className="w-4 h-4" /> {t('nav.reports')}
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title={t('admin.dashboard.stat.totalIt')} value={stats?.itCount ?? 0} icon={MonitorCog} color="blue" />
            <StatCard title={t('admin.dashboard.stat.totalMaintenance')} value={stats?.mCount ?? 0} icon={Wrench} color="orange" />
            <StatCard title={t('admin.dashboard.stat.totalSuggestions')} value={stats?.sCount ?? 0} icon={Lightbulb} color="purple" />
            <StatCard title={t('admin.dashboard.stat.openRequests')} value={stats?.openTickets ?? 0} icon={Inbox} color="yellow" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title={t('admin.dashboard.stat.criticalRequests')} value={stats?.criticalTickets ?? 0} icon={AlertTriangle} color="red" />
            <StatCard title={t('admin.dashboard.stat.overdueRequests')} value={stats?.overdueCount ?? 0} icon={Clock} color="orange" />
            <StatCard title={t('admin.dashboard.stat.resolvedRequests')} value={stats?.resolvedTickets ?? 0} icon={CheckCircle2} color="success" />
            <StatCard title={t('admin.dashboard.stat.avgResolutionTime')} value={`${formatNumber(stats?.avgResolutionTimeDays ?? 0)} ${t('admin.unit.daysLong')}`} icon={Timer} color="indigo" />
          </div>

          {/* SLA performance + team workload */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Timer className="w-4 h-4 text-brand-text" /> {t('admin.dashboard.sla.title')}
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('admin.dashboard.sla.within24h')}</span>
                    <span className="font-semibold text-gray-800">{resolvedWithin(1)}%</span>
                  </div>
                  <ProgressBar value={resolvedWithin(1)} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('admin.dashboard.sla.within3d')}</span>
                    <span className="font-semibold text-gray-800">{resolvedWithin(3)}%</span>
                  </div>
                  <ProgressBar value={resolvedWithin(3)} color="bg-blue-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('admin.dashboard.sla.openWithinSla')}</span>
                    <span className="font-semibold text-gray-800">{withinSlaPct}%</span>
                  </div>
                  <ProgressBar value={withinSlaPct} color={withinSlaPct >= 80 ? 'bg-success-500' : 'bg-orange-500'} />
                  <p className="text-xs text-gray-400 mt-1">
                    {t('admin.dashboard.sla.pastTarget', { overdue, open: openTickets })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-text" /> {t('admin.dashboard.workload.title')}
              </h3>
              {workload.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">{t('admin.dashboard.workload.empty')}</div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {workload.map((tech) => {
                    const pct = Math.round((tech.open / TEAM_CAPACITY) * 100);
                    return (
                      <div key={tech.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{tech.name}</span>
                          <span className="text-gray-500">{t('admin.dashboard.workload.open', { count: tech.open })}</span>
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
            <CategoryChart title={t('admin.dashboard.chart.byDepartment')} data={stats?.byDepartment ?? []} color="#2563eb" />
            <CategoryChart title={t('admin.dashboard.chart.byCategory')} data={stats?.byCategory ?? []} color="#0ea5e9" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <DashboardList
              title={t('admin.dashboard.list.recentSubmitted.title')}
              items={(stats?.recentTickets ?? []).slice(0, 8)}
              linkFor={ticketLink}
              empty={t('admin.dashboard.list.recentSubmitted.empty')}
            />
            <DashboardList
              title={t('admin.dashboard.list.recentCompleted.title')}
              items={(stats?.recentCompleted ?? []).slice(0, 8)}
              linkFor={ticketLink}
              empty={t('admin.dashboard.list.recentCompleted.empty')}
            />
          </div>

          {/* Suggestions needing review + recent system activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-purple-soft-text" /> {t('admin.dashboard.suggestions.title')}
                </h3>
                <Link to="/admin/suggestions" className="text-sm text-brand-text hover:underline">{t('admin.dashboard.suggestions.reviewAll')}</Link>
              </div>
              {needingReview.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('admin.dashboard.suggestions.empty')}</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {needingReview.slice(0, 8).map((s) => (
                    <li key={s.id}>
                      <Link to={`/suggestions/${s.id}`} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{s.suggestion_number} · {s.title}</div>
                          <div className="text-xs text-gray-500 truncate">{s.department_name}</div>
                        </div>
                        <Badge color={statusColor(s.status_name)}>{statusLabel(s.status_name)}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-surface rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-text" /> {t('admin.dashboard.activity.title')}
                </h3>
              </div>
              {activity.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('admin.dashboard.activity.empty')}</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {activity.map((log) => (
                    <li key={log.id} className="px-5 py-3">
                      <div className="text-sm text-gray-800">
                        <span className="font-medium">{log.user_name || t('common.timeline.system')}</span>{' '}
                        <span className="text-gray-500">{actionLabel(log.action)}</span>
                      </div>
                      <div className="text-xs text-gray-400">{log.details || '—'} · {formatDateTime(log.created_at)}</div>
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
