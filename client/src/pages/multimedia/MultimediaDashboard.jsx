import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, MonitorCog, Boxes, FolderOpen, CalendarClock, AlertTriangle,
  RefreshCw, CheckCircle2, ScrollText
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { deviceStatusColor, playbackStatusColor, formatDateTime } from './multimediaHelpers';

export default function MultimediaDashboard() {
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
  if (!data) return <EmptyState title="Could not load multimedia dashboard" />;

  const t = data.totals;
  const activity = data.recent_activity || [];
  const attention = data.needs_attention || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Digital Signage Overview</h2>
          <p className="text-gray-500 text-sm">Monitor and control display devices across the hospital</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Devices" value={t.total} icon={Boxes} color="blue" />
        <StatCard title="Online" value={t.online} icon={MonitorCog} color="success" sub={`${t.playing} now playing`} />
        <StatCard title="Offline" value={t.offline} icon={AlertTriangle} color="red" />
        <StatCard title="Media Assets" value={t.media} icon={FolderOpen} color="purple" />
        <StatCard title="Active Schedules" value={t.schedules} icon={CalendarClock} color="indigo" />
        <StatCard title="Today's Activity" value={t.history_today} icon={CheckCircle2} color="orange" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-gray-800">Recent Playback Activity</h3>
          </div>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div className="divide-y divide-gray-100">
              {activity.map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-800">{a.device_name || '—'}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {a.media_title || ''} {a.triggered_by_name && <span>by {a.triggered_by_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color="gray">{a.action}</Badge>
                    <Badge color={playbackStatusColor(a.status)}>{a.status}</Badge>
                    <span className="text-xs text-gray-400">{formatDateTime(a.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-800">Needs Attention</h3>
          </div>
          {attention.length === 0 ? (
            <EmptyState title="All displays healthy" />
          ) : (
            <div className="divide-y divide-gray-100">
              {attention.map((d) => (
                <Link key={d.id} to={`/multimedia/devices/${d.id}`} className="px-5 py-3 block hover:bg-gray-50">
                  <div className="text-sm font-medium text-gray-800">{d.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={deviceStatusColor(d.status)}>{d.status}</Badge>
                    <span className="text-xs text-gray-500 truncate">{d.status_message || d.location_name || ''}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard className="w-4 h-4 text-primary-600" />
          <h3 className="font-semibold text-gray-800">Player Integration</h3>
          <Badge color="blue">{data.integration?.id}</Badge>
        </div>
        <p className="text-sm text-gray-600">{data.integration?.description}</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Supported commands</div>
            <div className="flex gap-2">
              {(data.integration?.supported_commands || []).map((c) => <Badge key={c} color="green">{c}</Badge>)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Not supported in this phase</div>
            <div className="flex flex-wrap gap-2">
              {(data.integration?.not_supported_hint || '').split(',').map((c) => <Badge key={c} color="red">{c.trim()}</Badge>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}