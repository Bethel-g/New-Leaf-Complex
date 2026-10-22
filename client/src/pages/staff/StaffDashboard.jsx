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
import { useTranslation } from '../../i18n';

const quickLinks = [
  {
    to: '/submit-it',
    icon: MonitorCog,
    titleKey: 'staff.dashboard.quick.it.title',
    descKey: 'staff.dashboard.quick.it.desc',
    color: 'from-primary-500 to-primary-600',
    accent: 'group-hover:text-blue-soft-text',
  },
  {
    to: '/submit-maintenance',
    icon: Wrench,
    titleKey: 'staff.dashboard.quick.maintenance.title',
    descKey: 'staff.dashboard.quick.maintenance.desc',
    color: 'from-orange-500 to-orange-600',
    accent: 'group-hover:text-orange-soft-text',
  },
  {
    to: '/submit-suggestion',
    icon: Lightbulb,
    titleKey: 'staff.dashboard.quick.suggestion.title',
    descKey: 'staff.dashboard.quick.suggestion.desc',
    color: 'from-violet-500 to-violet-600',
    accent: 'group-hover:text-violet-soft-text',
  },
];

export default function StaffDashboard() {
  const { t } = useTranslation();
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

  const ticketLink = (ticket) => (ticket.type === 'it' ? `/it/tickets/${ticket.id}` : `/maintenance/tickets/${ticket.id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('staff.dashboard.title')}</h2>
          <p className="text-gray-500 text-sm">{t('staff.dashboard.subtitle')}</p>
        </div>
        <DateFilter period={filters.period} from={filters.from} to={filters.to} onChange={onFilterChange} />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-surface rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${link.color} flex items-center justify-center text-white mb-3`}>
              <link.icon className="w-6 h-6" />
            </div>
            <div className={`font-semibold text-gray-800 ${link.accent}`}>{t(link.titleKey)}</div>
            <div className="text-sm text-gray-500 mt-1">{t(link.descKey)}</div>
          </Link>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Summary + section counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title={t('staff.dashboard.stat.open')} value={stats?.myOpenRequests?.length ?? 0} icon={Inbox} color="yellow" />
            <StatCard title={t('staff.dashboard.stat.resolved')} value={stats?.myResolvedRequests?.length ?? 0} icon={CheckCircle2} color="success" />
            <StatCard title={t('staff.dashboard.stat.suggestions')} value={stats?.mySuggestions?.length ?? 0} icon={LightbulbOff} color="purple" />
            <StatCard title={t('staff.dashboard.stat.recentlyUpdated')} value={stats?.recentlyUpdated?.length ?? 0} icon={RefreshCw} color="blue" />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CalendarRange className="w-3.5 h-3.5" />
            {t('staff.dashboard.showing', {
              period: t(`common.dateFilter.${filters.period}`),
              requests: stats?.totalTickets ?? 0,
              suggestions: stats?.sCount ?? 0,
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <DashboardList
              title={t('staff.dashboard.list.open.title')}
              items={stats?.myOpenRequests ?? []}
              linkFor={ticketLink}
              empty={t('staff.dashboard.list.open.empty')}
            />
            <DashboardList
              title={t('staff.dashboard.list.resolved.title')}
              items={stats?.myResolvedRequests ?? []}
              linkFor={ticketLink}
              empty={t('staff.dashboard.list.resolved.empty')}
            />
            <DashboardList
              title={t('staff.dashboard.list.suggestions.title')}
              items={stats?.mySuggestions ?? []}
              linkFor={(s) => `/suggestions/${s.id}`}
              empty={t('staff.dashboard.list.suggestions.empty')}
            />
            <DashboardList
              title={t('staff.dashboard.list.recent.title')}
              items={stats?.recentlyUpdated ?? []}
              linkFor={ticketLink}
              empty={t('staff.dashboard.list.recent.empty')}
            />
          </div>
        </>
      )}
    </div>
  );
}