import { useState, useEffect, Fragment } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { formatDateTime, playbackStatusColor, statusText, actionText } from './multimediaHelpers';

export default function MultimediaHistory() {
  const { t } = useTranslation();
  const [data, setData] = useState({ items: [], total: 0, limit: 20, offset: 0 });
  const [devices, setDevices] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({ deviceId: '', mediaId: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = (o = offset) => {
    api.get('/multimedia/history', {
      params: {
        limit: 20, offset: o,
        deviceId: filters.deviceId || undefined,
        mediaId: filters.mediaId || undefined,
        status: filters.status || undefined,
      },
    }).then((res) => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/multimedia/devices'),
      api.get('/multimedia/media', { params: { limit: 500 } }),
    ]).then(([d, m]) => { setDevices(d.data); setMediaList(m.data.items || []); }).catch(() => {});
    load();
  }, []);

  const p = data;
  const totalPages = Math.max(1, Math.ceil(p.total / p.limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('multimedia.history.title')}</h2>
          <p className="text-gray-500 text-sm">{t('multimedia.history.subtitle')}</p>
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          <Filter className="w-4 h-4" /> {t('multimedia.history.filters')}
        </button>
      </div>

      {showFilters && (
        <div className="bg-surface rounded-xl border border-gray-200 p-4 grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('multimedia.history.filter.device')}</label>
            <select value={filters.deviceId} onChange={(e) => setFilters({ ...filters, deviceId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">{t('multimedia.history.filter.allDevices')}</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('multimedia.history.filter.media')}</label>
            <select value={filters.mediaId} onChange={(e) => setFilters({ ...filters, mediaId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">{t('multimedia.history.filter.allMedia')}</option>
              {mediaList.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('multimedia.history.filter.result')}</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">{t('multimedia.history.filter.allResults')}</option>
              <option value="success">{statusText('success', t)}</option>
              <option value="offline">{statusText('offline', t)}</option>
              <option value="failed">{statusText('failed', t)}</option>
              <option value="online">{statusText('online', t)}</option>
            </select>
          </div>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <button onClick={() => { setFilters({ deviceId: '', mediaId: '', status: '' }); load(0); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('multimedia.history.clear')}</button>
            <button onClick={() => load(0)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
              <Search className="w-4 h-4" /> {t('multimedia.history.apply')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : data.items.length === 0 ? (
        <EmptyState title={t('multimedia.history.empty')} />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">{t('multimedia.history.table.device')}</th>
                  <th className="px-4 py-3">{t('multimedia.history.table.media')}</th>
                  <th className="px-4 py-3">{t('multimedia.history.table.action')}</th>
                  <th className="px-4 py-3">{t('multimedia.history.table.result')}</th>
                  <th className="px-4 py-3">{t('multimedia.history.table.when')}</th>
                  <th className="px-4 py-3">{t('multimedia.history.table.triggeredBy')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((h) => (
                  <Fragment key={h.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
                      <td className="px-4 py-3"><ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === h.id ? 'rotate-180' : ''}`} /></td>
                      <td className="px-4 py-3 text-gray-800">{h.device_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{h.media_title || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{actionText(h.action, t)}</td>
                      <td className="px-4 py-3"><Badge color={playbackStatusColor(h.status)}>{statusText(h.status, t)}</Badge></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(h.created_at)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{h.triggered_by_name || t('multimedia.system')}</td>
                    </tr>
                    {expanded === h.id && (
                      <tr key={`${h.id}-detail`}>
                        <td className="px-4 py-3"></td>
                        <td colSpan={6} className="px-4 py-3 bg-gray-50 text-sm text-gray-600">
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div><div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">{t('multimedia.history.detail.mediaId')}</div>{h.media_id || '—'}</div>
                            <div><div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">{t('multimedia.history.detail.deviceId')}</div>{h.device_id || '—'}</div>
                            <div><div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">{t('multimedia.history.detail.group')}</div>{h.group_name || '—'}</div>
                            <div><div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">{t('multimedia.history.detail.error')}</div>{h.error_message || '—'}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500 border-t border-gray-200">
            <span>{t('multimedia.history.pagination', { page: Math.floor(p.offset / p.limit) + 1, totalPages, total: p.total })}</span>
            <div className="flex gap-2">
              <button disabled={p.offset <= 0} onClick={() => { const o = Math.max(0, p.offset - p.limit); setOffset(o); load(o); }} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">{t('common.actions.previous')}</button>
              <button disabled={p.offset + p.limit >= p.total} onClick={() => { const o = p.offset + p.limit; setOffset(o); load(o); }} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">{t('common.actions.next')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}