import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Radio, Loader2, FolderOpen, MonitorCog, Users } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/EmptyState';
import { playbackStatusColor } from './multimediaHelpers';

export default function MultimediaBroadcast() {
  const [mediaList, setMediaList] = useState([]);
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaId, setMediaId] = useState('');
  const [targetType, setTargetType] = useState('device');
  const [targetId, setTargetId] = useState('');
  const [priority, setPriority] = useState('0');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/multimedia/media', { params: { status: 'active', limit: 500 } }),
      api.get('/multimedia/devices'),
      api.get('/multimedia/groups'),
    ]).then(([m, d, g]) => {
      setMediaList(m.data.items || []);
      setDevices(d.data);
      setGroups(g.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const targetOptions = targetType === 'group'
    ? groups.map((g) => ({ id: g.id, label: g.name, sub: `${g.device_count || 0} devices` }))
    : devices.filter((d) => d.is_active).map((d) => ({ id: d.id, label: d.name, sub: d.location_name || d.status }));

  const submit = async (e) => {
    e.preventDefault();
    if (!mediaId) return toast.error('Select a media asset to broadcast');
    if (targetType !== 'all' && !targetId) return toast.error('Select a target');
    setSending(true);
    setResult(null);
    try {
      const res = await api.post('/multimedia/broadcast', {
        media_id: Number(mediaId),
        target_type: targetType,
        target_id: targetType === 'all' ? undefined : Number(targetId),
        priority: Number(priority),
      });
      setResult(res.data);
      toast.success('Broadcast completed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Broadcast Content</h2>
        <p className="text-gray-500 text-sm">Send a media asset to one device, a group, or every display at once</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-gray-400" /> Media Asset *
            </label>
            <select value={mediaId} onChange={(e) => setMediaId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">— select media —</option>
              {mediaList.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.category})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
            <select value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetId(''); }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="device">Single device</option>
              <option value="group">A group</option>
              <option value="all">All devices</option>
            </select>
          </div>

          {targetType !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                {targetType === 'group' ? <Users className="w-4 h-4 text-gray-400" /> : <MonitorCog className="w-4 h-4 text-gray-400" />}
                {targetType === 'group' ? 'Group *' : 'Device *'}
              </label>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="">— select —</option>
                {targetOptions.map((o) => <option key={o.id} value={o.id}>{o.label} ({o.sub})</option>)}
              </select>
            </div>
          )}

          {targetType === 'all' && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Every active device in the hospital. Offline or errored devices are recorded as offline and are never reported as playing.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="0">Normal</option>
              <option value="1">High</option>
            </select>
          </div>

          <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />} Broadcast
          </button>
        </form>

        <div className="space-y-6">
          {result && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Broadcast Result</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{result.devices_total}</div>
                  <div className="text-xs text-gray-500">Devices</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">{result.devices_success}</div>
                  <div className="text-xs text-gray-500">Playing</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{result.devices_offline}</div>
                  <div className="text-xs text-gray-500">Offline</div>
                </div>
              </div>
              <div className="mt-4 max-h-56 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-100">
                {result.results.map((r, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                    <span className="text-gray-800">{r.name}</span>
                    <Badge color={playbackStatusColor(r.status)}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-2">How broadcasting works</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Online devices receive a <code className="font-mono text-xs bg-gray-100 px-1 rounded">play</code> command and are marked as playing. Devices without a fresh heartbeat within the timeout (default 3 minutes) are recorded as offline and excluded — never fabricated as successful.</p>
              <p className="text-xs text-gray-500">Real hardware integration, emergency broadcast and remote power are later-phase features; the current mock player reports play/stop only.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}