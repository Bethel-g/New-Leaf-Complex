import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Radio, Loader2, FolderOpen, MonitorCog, Users } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/EmptyState';
import { playbackStatusColor, statusText, categoryText } from './multimediaHelpers';

export default function MultimediaBroadcast() {
  const { t } = useTranslation();
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
    ? groups.map((g) => ({ id: g.id, label: g.name, sub: t('multimedia.groups.devicesCount', { count: g.device_count || 0 }) }))
    : devices.filter((d) => d.is_active).map((d) => ({ id: d.id, label: d.name, sub: d.location_name || statusText(d.status, t) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!mediaId) return toast.error(t('multimedia.broadcast.toast.selectMedia'));
    if (targetType !== 'all' && !targetId) return toast.error(t('multimedia.broadcast.toast.selectTarget'));
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
      toast.success(t('multimedia.broadcast.toast.completed'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.broadcast.toast.failed'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('multimedia.broadcast.title')}</h2>
        <p className="text-gray-500 text-sm">{t('multimedia.broadcast.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-gray-400" /> {t('multimedia.broadcast.media.label')} *
            </label>
            <select value={mediaId} onChange={(e) => setMediaId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">{t('multimedia.broadcast.media.select')}</option>
              {mediaList.map((m) => <option key={m.id} value={m.id}>{m.title} ({categoryText(m.category, t)})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.broadcast.target.label')}</label>
            <select value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetId(''); }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="device">{t('multimedia.broadcast.target.device')}</option>
              <option value="group">{t('multimedia.broadcast.target.group')}</option>
              <option value="all">{t('multimedia.broadcast.target.all')}</option>
            </select>
          </div>

          {targetType !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                {targetType === 'group' ? <Users className="w-4 h-4 text-gray-400" /> : <MonitorCog className="w-4 h-4 text-gray-400" />}
                {targetType === 'group' ? t('multimedia.broadcast.target.groupLabel') : t('multimedia.broadcast.target.deviceLabel')} *
              </label>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                <option value="">{t('multimedia.broadcast.target.select')}</option>
                {targetOptions.map((o) => <option key={o.id} value={o.id}>{o.label} ({o.sub})</option>)}
              </select>
            </div>
          )}

          {targetType === 'all' && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              {t('multimedia.broadcast.target.allInfo')}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.broadcast.priority.label')}</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="0">{t('multimedia.broadcast.priority.normal')}</option>
              <option value="1">{t('multimedia.broadcast.priority.high')}</option>
            </select>
          </div>

          <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />} {t('multimedia.broadcast.broadcast')}
          </button>
        </form>

        <div className="space-y-6">
          {result && (
            <div className="bg-surface rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-3">{t('multimedia.broadcast.result.title')}</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{result.devices_total}</div>
                  <div className="text-xs text-gray-500">{t('multimedia.broadcast.result.devices')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-text">{result.devices_success}</div>
                  <div className="text-xs text-gray-500">{t('multimedia.broadcast.result.playing')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-soft-text">{result.devices_offline}</div>
                  <div className="text-xs text-gray-500">{t('multimedia.broadcast.result.offline')}</div>
                </div>
              </div>
              <div className="mt-4 max-h-56 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-100">
                {result.results.map((r, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                    <span className="text-gray-800">{r.name}</span>
                    <Badge color={playbackStatusColor(r.status)}>{statusText(r.status, t)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-2">{t('multimedia.broadcast.howItWorks.title')}</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>{t('multimedia.broadcast.howItWorks.line1Before')} <code className="font-mono text-xs bg-gray-100 px-1 rounded">play</code> {t('multimedia.broadcast.howItWorks.line1After')}</p>
              <p className="text-xs text-gray-500">{t('multimedia.broadcast.howItWorks.line2')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}