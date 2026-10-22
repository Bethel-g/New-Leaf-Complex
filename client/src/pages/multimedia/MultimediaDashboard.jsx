import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, MonitorCog, Boxes, FolderOpen, CalendarClock, AlertTriangle,
  RefreshCw, CheckCircle2, ScrollText
} from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import StatCard from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { deviceStatusColor, playbackStatusColor, formatDateTime, statusText, actionText } from './multimediaHelpers';

export default function MultimediaDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/multimedia/dashboard')
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState title={t('multimedia.dashboard.error.loadFailed')} />;

  const totals = data.totals;
  const activity = data.recent_activity || [];
  const attention = data.needs_attention || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('multimedia.dashboard.title')}</h2>
          <p className="text-gray-500 text-sm">{t('multimedia.dashboard.subtitle')}</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {t('multimedia.dashboard.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title={t('multimedia.dashboard.stat.totalDevices')} value={totals.total} icon={Boxes} color="blue" />
        <StatCard title={t('multimedia.dashboard.stat.online')} value={totals.online} icon={MonitorCog} color="success" sub={t('multimedia.dashboard.stat.nowPlaying', { count: totals.playing })} />
        <StatCard title={t('multimedia.dashboard.stat.offline')} value={totals.offline} icon={AlertTriangle} color="red" />
        <StatCard title={t('multimedia.dashboard.stat.mediaAssets')} value={totals.media} icon={FolderOpen} color="purple" />
        <StatCard title={t('multimedia.dashboard.stat.activeSchedules')} value={totals.schedules} icon={CalendarClock} color="indigo" />
        <StatCard title={t('multimedia.dashboard.stat.todayActivity')} value={totals.history_today} icon={CheckCircle2} color="orange" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-brand-text" />
            <h3 className="font-semibold text-gray-800">{t('multimedia.dashboard.recentActivity.title')}</h3>
          </div>
          {activity.length === 0 ? (
            <EmptyState title={t('multimedia.dashboard.recentActivity.empty')} />
          ) : (
            <div className="divide-y divide-gray-100">
              {activity.map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-800">{a.device_name || '—'}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {a.media_title || ''} {a.triggered_by_name && <span>{t('multimedia.dashboard.recentActivity.by', { name: a.triggered_by_name })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color="gray">{actionText(a.action, t)}</Badge>
                    <Badge color={playbackStatusColor(a.status)}>{statusText(a.status, t)}</Badge>
                    <span className="text-xs text-gray-400">{formatDateTime(a.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-soft-text" />
            <h3 className="font-semibold text-gray-800">{t('multimedia.dashboard.needsAttention.title')}</h3>
          </div>
          {attention.length === 0 ? (
            <EmptyState title={t('multimedia.dashboard.needsAttention.empty')} />
          ) : (
            <div className="divide-y divide-gray-100">
              {attention.map((d) => (
                <Link key={d.id} to={`/multimedia/devices/${d.id}`} className="px-5 py-3 block hover:bg-gray-50">
                  <div className="text-sm font-medium text-gray-800">{d.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={deviceStatusColor(d.status)}>{statusText(d.status, t)}</Badge>
                    <span className="text-xs text-gray-500 truncate">{d.status_message || d.location_name || ''}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard className="w-4 h-4 text-brand-text" />
          <h3 className="font-semibold text-gray-800">{t('multimedia.dashboard.playerIntegration.title')}</h3>
          <Badge color="blue">{data.integration?.id}</Badge>
        </div>
        <p className="text-sm text-gray-600">
          {data.integration?.id === 'mock-local-player'
            ? t('multimedia.dashboard.playerIntegration.mockDescription')
            : data.integration?.description}
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('multimedia.dashboard.playerIntegration.supportedCommands')}</div>
            <div className="flex gap-2">
              {(data.integration?.supported_commands || []).map((c) => <Badge key={c} color="green">{c}</Badge>)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{t('multimedia.dashboard.playerIntegration.notSupported')}</div>
            <div className="flex flex-wrap gap-2">
              {(data.integration?.not_supported_hint || '').split(',').map((c) => <Badge key={c} color="red">{c.trim()}</Badge>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}