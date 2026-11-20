import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { Loader2, Play, Square, Wifi, Info } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { statusText, formatDateTime } from './multimediaHelpers';
import { LoadingSpinner, EmptyState } from '../../components/EmptyState';
import toast from 'react-hot-toast';

export default function VirtualTVPlayer() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = ['it_supervisor', 'admin', 'sys_admin'].includes(user?.role_name);

  const [device, setDevice] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState('connecting');
  const [mediaAsset, setMediaAsset] = useState(null);
  const [mediaErrorKey, setMediaErrorKey] = useState(null);
  const [sending, setSending] = useState(false);

  const load = useCallback((showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    Promise.all([
      api.get(`/multimedia/devices/${id}`),
    ])
      .then(([d]) => {
        setDevice(d.data);
        setConnection(['online', 'playing', 'idle'].includes(d.data?.status) ? 'online' : 'offline');
        setIsPlaying(d.data?.status === 'playing');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load virtual TV device:', err);
        setError(t('multimedia.virtualTV.errorLoading'));
        setDevice({
          id: id,
          name: t('multimedia.virtualTV.defaultDeviceName', { id }),
          device_identifier: id,
          status: 'offline',
          location_name: t('multimedia.virtualTV.defaultLocation', { id }),
          ip_address: '',
          manufacturer: 'Virtual',
          model: t('multimedia.virtualTV.tvModel', { id: id.substring(0, 8) }),
          status_message: t('multimedia.virtualTV.deviceOffline'),
        });
        setConnection('offline');
        setLoading(false);
      });
  }, [id, t]);

  useEffect(() => { load(false); }, [load]);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    const mediaId = device?.current_media_id;
    const mediaKey = mediaId
      ? `${mediaId}:${device.current_media_started_at || ''}`
      : null;

    if (!mediaKey || !isPlaying) return undefined;
    api.get(`/multimedia/media/${mediaId}/file`, { responseType: 'blob' })
      .then(({ data }) => {
        const nextUrl = URL.createObjectURL(data);
        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }
        objectUrl = nextUrl;
        setMediaAsset({ key: mediaKey, url: nextUrl });
      })
      .catch(() => {
        if (!cancelled) setMediaErrorKey(mediaKey);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [device?.current_media_id, device?.current_media_started_at, isPlaying]);

  const togglePlay = async () => {
    const command = isPlaying ? 'stop' : 'play';
    setSending(true);
    try {
      const { data } = await api.post(`/multimedia/devices/${id}/command`, { command });
      toast.success(data.message || t('multimedia.deviceDetail.toast.acknowledged'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.deviceDetail.toast.failed'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <div className="bg-surface rounded-xl border border-red-200 p-6 text-red-600">
      <h3 className="font-semibold mb-3">{t('multimedia.virtualTV.errorTitle')}</h3>
      <p>{error}</p>
      <button onClick={load} className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> {t('multimedia.virtualTV.retry')}
      </button>
    </div>
  );

  if (!device) return (
    <EmptyState
      title={t('multimedia.virtualTV.deviceNotFound', { id })}
      description={t('multimedia.virtualTV.deviceNotFoundDesc', { id })}
    />
  );

  const isOnline = connection === 'online';
  const currentMediaKey = device.current_media_id
    ? `${device.current_media_id}:${device.current_media_started_at || ''}`
    : null;
  const mediaUrl = mediaAsset?.key === currentMediaKey ? mediaAsset.url : null;
  const mediaError = mediaErrorKey === currentMediaKey;
  const mediaLoading = Boolean(currentMediaKey && isPlaying && !mediaUrl && !mediaError);
  const canPlayMedia = device.current_media_category === 'video'
    || device.current_media_mime_type?.startsWith('video/');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* TV Screen */}
          <div className="lg:col-span-8 bg-white rounded-2xl overflow-shadow-lg" style={{ minHeight: '400px' }}>
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-800">
                {device.name} {device.device_identifier}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="w-4 h-4" /> {t('multimedia.virtualTV.device', { id })}
              </div>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center relative">
              {mediaLoading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : mediaUrl && isPlaying ? (
                canPlayMedia ? (
                  <video key={mediaUrl} src={mediaUrl} autoPlay muted loop controls playsInline className="w-full h-full object-contain" />
                ) : (
                  <img src={mediaUrl} alt={device.current_media_title || device.name} className="w-full h-full object-contain" />
                )
              ) : (
                <div className="px-6 text-center text-white">
                  <div className="text-lg font-medium">
                    {mediaError
                      ? t('multimedia.virtualTV.mediaLoadFailed')
                      : isPlaying
                        ? t('multimedia.virtualTV.noMedia')
                        : t('multimedia.virtualTV.idle')}
                  </div>
                  {device.current_media_title && (
                    <p className="mt-2 text-sm text-gray-300">{device.current_media_title}</p>
                  )}
                </div>
              )}

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1 text-xs text-white drop-shadow">
                  <Wifi className="w-3 h-3" />
                  {isOnline ? t('multimedia.virtualTV.online') : t('multimedia.virtualTV.offline')}
                </div>
                <div className="flex items-center gap-1 text-xs text-white drop-shadow">
                  <Play className="w-3 h-3" />
                  {isPlaying ? t('multimedia.virtualTV.playing') : t('multimedia.virtualTV.paused')}
                </div>
              </div>
            </div>

            {device.current_media_title && (
              <p className="p-2 text-sm text-gray-400 text-center">{t('multimedia.virtualTV.nowPlaying')}: {device.current_media_title}</p>
            )}
          </div>

          {/* Device Info */}
          <div className="lg:col-span-4 bg-white rounded-2xl overflow-shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">{t('multimedia.virtualTV.deviceInfo')}</h2>
            </div>

            <div className="p-5">
              <div className="mb-3">
                <label className="block text-sm text-gray-500 mb-1">{t('multimedia.virtualTV.identifier')}</label>
                <div className="bg-gray-100 rounded-lg p-2 font-mono text-sm">{id}</div>
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-500 mb-1">{t('multimedia.virtualTV.status')}</label>
                <span className="badge badge-indigo text-sm">{statusText(device.status || 'offline', t)}</span>
              </div>

              {device.location_name && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-500 mb-1">{t('multimedia.virtualTV.location')}</label>
                  <p className="text-gray-600">{device.location_name}</p>
                </div>
              )}

              {device.model && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-500 mb-1">{t('multimedia.virtualTV.model')}</label>
                  <p className="text-gray-600">{device.model}</p>
                </div>
              )}

              {device.ip_address && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-500 mb-1">{t('multimedia.virtualTV.ipAddress')}</label>
                  <div className="bg-gray-100 rounded p-2 text-xs font-mono">{device.ip_address}</div>
                </div>
              )}

              {device.groups && device.groups.length > 0 && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-500 mb-1">{t('multimedia.virtualTV.groups')}</label>
                  <div className="flex flex-wrap gap-1">
                    {device.groups.map((g) => (
                      <span key={g.id} className="text-xs bg-indigo-100 text-indigo-800 rounded px-1.5 py-0.5">{g.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {device.capabilities && device.capabilities.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-500 mb-1">{t('multimedia.virtualTV.capabilities')}</label>
                  <div className="flex flex-wrap gap-1">
                    {device.capabilities.map((c) => (
                      <span key={c} className="text-xs bg-green-100 text-green-800 rounded px-1.5 py-0.5">{t(`multimedia.action.${c}`)}</span>
                    ))}
                  </div>
                </div>
              )}

              {canManage && (
                <div className="mt-5 pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-700 mb-3">{t('multimedia.virtualTV.control')}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={togglePlay}
                      disabled={sending || !isOnline || !device.is_active}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isPlaying ? t('multimedia.deviceDetail.sendCommand.stop') : t('multimedia.deviceDetail.sendCommand.play')}
                    >
                      {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {isPlaying ? t('multimedia.deviceDetail.sendCommand.stop') : t('multimedia.deviceDetail.sendCommand.play')}
                    </button>
                  </div>
                </div>
              )}

              {device.status_message && (
                <div className="mt-3 p-2 rounded text-sm">
                  {device.status_message}
                </div>
              )}

              {device.last_heartbeat_at && (
                <div className="mt-3 text-xs text-gray-500">
                  {t('multimedia.virtualTV.lastHeartbeat')}: {formatDateTime(device.last_heartbeat_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}