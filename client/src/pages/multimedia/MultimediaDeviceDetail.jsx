import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RefreshCw, Loader2, Play, Square, MapPin, Fingerprint, Network, Cpu, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { deviceStatusColor, playbackStatusColor, formatDateTime } from './multimediaHelpers';

export default function MultimediaDeviceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = ['it_supervisor', 'admin', 'sys_admin'].includes(user?.role_name);

  const [device, setDevice] = useState(null);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/multimedia/devices/${id}`),
      api.get(`/multimedia/devices/${id}/commands`),
    ])
      .then(([d, c]) => { setDevice(d.data); setCommands(c.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sendCommand = async (command, mediaId) => {
    setSending(command);
    try {
      const res = await api.post(`/multimedia/devices/${id}/command`, command === 'play' ? { command, media_id: mediaId } : { command });
      toast.success(res.data.message || 'Command acknowledged');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Command failed');
      load();
    } finally {
      setSending(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!device) return <EmptyState title="Device not found" />;

  const supported = device.capabilities || ['play', 'stop'];
  const online = ['online', 'playing', 'idle'].includes(device.status);
  const unsupportedHint = 'power,volume,mute,reboot,input_source'.split(',');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/multimedia/devices" className="text-sm text-primary-600 hover:underline">← All devices</Link>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-800">{device.name}</h2>
              <Badge color={deviceStatusColor(device.status)}>{device.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5"><Fingerprint className="w-4 h-4" /> {device.device_identifier}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {device.location_name || 'No location'}{device.room ? ` / ${device.room}` : ''}</span>
              <span className="inline-flex items-center gap-1.5"><Network className="w-4 h-4" /> {device.ip_address || '—'} ({device.connection_type})</span>
              <span className="inline-flex items-center gap-1.5"><Cpu className="w-4 h-4" /> {device.manufacturer || 'Unknown'} {device.model || ''}</span>
            </div>
            {device.status_message && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <ShieldAlert className="w-4 h-4" /> {device.status_message}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <div>Last heartbeat: <span className="font-medium text-gray-700">{formatDateTime(device.last_heartbeat_at)}</span></div>
            <div>Now playing: <span className="font-medium text-gray-700">{device.current_media_title || '—'}</span></div>
          </div>
        </div>

        {device.status === 'disabled' && (
          <div className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">This device is disabled and will not receive broadcasts.</div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Send Command</h3>
            <p className="text-xs text-gray-500 mt-1">The mock player integration supports play and stop only. Other commands are reported as unsupported — never faked as success.</p>
          </div>
          <div className="p-5">
            <div className="flex gap-3">
              <button
                onClick={() => sendCommand('play')}
                disabled={!online || !supported.includes('play') || device.status === 'playing'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending === 'play' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Play
              </button>
              <button
                onClick={() => sendCommand('stop')}
                disabled={!online || !supported.includes('stop')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending === 'stop' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />} Stop
              </button>
            </div>
            {!online && device.is_active && <p className="text-xs text-red-500 mt-3">Device is offline — commands will not be delivered.</p>}
            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Unsupported (mock integration)</div>
              <div className="flex flex-wrap gap-2">
                {unsupportedHint.map((c) => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full line-through" title={`${c} is not supported in this phase`}>{c}</span>
                ))}
              </div>
            </div>
            {!canManage && <p className="text-xs text-gray-400 mt-3">Your role can view this device. Register, edit and command permissions require a supervisor.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Group Membership</h3>
          </div>
          <div className="p-5">
            {device.groups?.length ? (
              <div className="flex flex-wrap gap-2">
                {device.groups.map((g) => <Badge key={g.id} color="indigo">{g.name}</Badge>)}
              </div>
            ) : (
              <div className="text-sm text-gray-400">Not a member of any group.</div>
            )}
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Capability manifest</div>
              <div className="flex flex-wrap gap-2">
                {supported.map((c) => <Badge key={c} color="green">{c}</Badge>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Command History</h3>
        </div>
        {commands.length === 0 ? (
          <EmptyState title="No commands sent to this device yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3">Command</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Requested At</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commands.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{c.command}</td>
                    <td className="px-4 py-3"><Badge color={playbackStatusColor(c.status)}>{c.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">{c.requested_by_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(c.requested_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.error_message || c.parameters || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}