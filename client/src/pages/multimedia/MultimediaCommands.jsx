import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Loader2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { playbackStatusColor, formatDateTime, statusText } from './multimediaHelpers';

export default function MultimediaCommands() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => {
    api.get('/multimedia/commands').then((res) => { setItems(res.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const retry = async (id) => {
    setBusy(id);
    try {
      const res = await api.post(`/multimedia/commands/${id}/redeliver`);
      toast.success(res.data.message || t('multimedia.commands.toast.redelivered'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.commands.toast.redeliveryFailed'));
      load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('multimedia.commands.title')}</h2>
        <p className="text-gray-500 text-sm">{t('multimedia.commands.subtitle')}</p>
      </div>

      <div className="bg-blue-soft border border-blue-soft-border rounded-lg p-4 flex items-start gap-2 text-sm text-blue-soft-text">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <span>{t('multimedia.commands.notice')}</span>
      </div>

      {items.length === 0 ? (
        <EmptyState title={t('multimedia.commands.empty')} />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3">{t('multimedia.commands.table.device')}</th>
                  <th className="px-4 py-3">{t('multimedia.commands.table.command')}</th>
                  <th className="px-4 py-3">{t('multimedia.commands.table.status')}</th>
                  <th className="px-4 py-3">{t('multimedia.commands.table.attempts')}</th>
                  <th className="px-4 py-3">{t('multimedia.commands.table.requestedBy')}</th>
                  <th className="px-4 py-3">{t('multimedia.commands.table.requestedAt')}</th>
                  <th className="px-4 py-3">{t('multimedia.commands.table.error')}</th>
                  <th className="px-4 py-3">{t('multimedia.commands.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{c.device_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-800">{c.command}</td>
                    <td className="px-4 py-3"><Badge color={playbackStatusColor(c.status)}>{statusText(c.status, t)}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">{c.attempts}</td>
                    <td className="px-4 py-3 text-gray-600">{c.requested_by_name || t('multimedia.system')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(c.created_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] truncate" title={c.error_message}>{c.error_message || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => retry(c.id)}
                        disabled={busy === c.id || !['failed', 'not_supported'].includes(c.status)}
                        title={['failed', 'not_supported'].includes(c.status) ? t('multimedia.commands.redeliver.title') : t('multimedia.commands.redeliver.onlyFailed')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {busy === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} {t('multimedia.commands.redeliver')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}