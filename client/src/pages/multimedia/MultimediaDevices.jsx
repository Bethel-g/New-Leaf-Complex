import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Power, PowerOff, Loader2, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import Modal from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { deviceStatusColor, formatDateTime, statusText, levelText } from './multimediaHelpers';

const EMPTY_FORM = {
  name: '', device_type: 'tv', manufacturer: '', model: '', location_id: '',
  department_id: '', floor: '', ward: '', room: '', ip_address: '', connection_type: 'wifi',
};

export default function MultimediaDevices() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canManage = hasRole('it_supervisor', 'admin', 'sys_admin');

  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    api.get('/multimedia/devices', { params: { status: statusFilter, query: search || undefined } })
      .then((res) => { setDevices(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/multimedia/locations').then((res) => setLocations(res.data)).catch(() => {});
    load();
  }, []);

  useEffect(() => {
    if (!loading) load();
  }, [statusFilter]);

  const openRegister = () => {
    setModal('register');
    setForm(EMPTY_FORM);
    setNewSecret(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error(t('multimedia.devices.toast.nameRequired'));
    setSaving(true);
    try {
      const res = await api.post('/multimedia/devices', form);
      toast.success(t('multimedia.devices.toast.registered'));
      setNewSecret(res.data);
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.devices.toast.registrationFailed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (d) => {
    try {
      if (d.is_active) {
        await api.post(`/multimedia/devices/${d.id}/disable`);
        toast.success(t('multimedia.devices.toast.disabled'));
      } else {
        await api.post(`/multimedia/devices/${d.id}/enable`);
        toast.success(t('multimedia.devices.toast.enabled'));
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || t('multimedia.devices.toast.operationFailed'));
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(newSecret.device_secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('multimedia.devices.title')}</h2>
          <p className="text-gray-500 text-sm">{t('multimedia.devices.subtitle')}</p>
        </div>
        {canManage && (
          <button onClick={openRegister} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> {t('multimedia.devices.register')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            placeholder={t('multimedia.devices.search.placeholder')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
          <option value="all">{t('multimedia.devices.filter.allStatuses')}</option>
          <option value="online">{statusText('online', t)}</option>
          <option value="playing">{statusText('playing', t)}</option>
          <option value="idle">{statusText('idle', t)}</option>
          <option value="offline">{statusText('offline', t)}</option>
          <option value="error">{statusText('error', t)}</option>
          <option value="disabled">{statusText('disabled', t)}</option>
        </select>
        <button onClick={load} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">{t('multimedia.devices.apply')}</button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : devices.length === 0 ? (
        <EmptyState title={t('multimedia.devices.empty')} />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3">{t('multimedia.devices.table.device')}</th>
                  <th className="px-4 py-3">{t('multimedia.devices.table.status')}</th>
                  <th className="px-4 py-3">{t('multimedia.devices.table.location')}</th>
                  <th className="px-4 py-3">{t('multimedia.devices.table.identifier')}</th>
                  <th className="px-4 py-3">{t('multimedia.devices.table.ipAddress')}</th>
                  <th className="px-4 py-3">{t('multimedia.devices.table.lastHeartbeat')}</th>
                  <th className="px-4 py-3">{t('multimedia.devices.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/multimedia/devices/${d.id}`} className="font-medium text-gray-800 hover:text-brand-text-strong">
                        {d.name}
                      </Link>
                      {d.manufacturer && <div className="text-xs text-gray-500">{d.manufacturer} {d.model}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={deviceStatusColor(d.status)}>{statusText(d.status, t)}</Badge>
                      {d.current_media_title && <div className="text-xs text-gray-500 mt-1 truncate max-w-[140px]">{d.current_media_title}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.location_name || '—'}{d.room ? ` / ${d.room}` : ''}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{d.device_identifier}</td>
                    <td className="px-4 py-3 text-gray-600">{d.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(d.last_heartbeat_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/multimedia/devices/${d.id}`} className="p-1.5 text-gray-500 hover:text-brand-text hover:bg-primary-soft rounded-lg" title={t('multimedia.devices.action.viewDetails')}>
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canManage && (
                          d.is_active ? (
                            <button onClick={() => toggleActive(d)} className="p-1.5 text-gray-500 hover:text-red-soft-text hover:bg-red-soft rounded-lg" title={t('multimedia.devices.action.disable')}>
                              <PowerOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => toggleActive(d)} className="p-1.5 text-gray-500 hover:text-brand-text hover:bg-primary-soft rounded-lg" title={t('multimedia.devices.action.enable')}>
                              <Power className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal === 'register'} onClose={() => setModal(null)} title={t('multimedia.devices.modal.register.title')}>
        {newSecret ? (
          <div className="space-y-4">
            <div className="bg-yellow-soft border border-yellow-soft-border rounded-lg p-4">
              <div className="text-sm font-semibold text-yellow-soft-text mb-1">{t('multimedia.devices.modal.secret.title')}</div>
              <p className="text-xs text-yellow-soft-text mb-3">{t('multimedia.devices.modal.secret.bodyBefore')} <code className="font-mono">X-Device-Secret</code>{t('multimedia.devices.modal.secret.after')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-surface border border-yellow-soft-border rounded-lg text-xs font-mono break-all">{newSecret.device_secret}</code>
                <button onClick={copySecret} className="p-2 bg-surface border border-yellow-soft-border rounded-lg text-yellow-soft-text hover:bg-yellow-soft-strong">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button onClick={() => setNewSecret(null)} className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{t('multimedia.devices.modal.secret.done')}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.name')} *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.type')}</label>
                <select value={form.device_type} onChange={(e) => setForm({ ...form, device_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                  <option value="tv">{t('multimedia.devices.modal.form.type.tv')}</option>
                  <option value="display">{t('multimedia.devices.modal.form.type.display')}</option>
                  <option value="media_player">{t('multimedia.devices.modal.form.type.mediaPlayer')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.connection')}</label>
                <select value={form.connection_type} onChange={(e) => setForm({ ...form, connection_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                  <option value="wifi">{t('multimedia.devices.modal.form.connection.wifi')}</option>
                  <option value="ethernet">{t('multimedia.devices.modal.form.connection.ethernet')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.manufacturer')}</label>
                <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.model')}</label>
                <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.location')}</label>
                <select value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm">
                  <option value="">{t('multimedia.devices.modal.form.location.none')}</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{levelText(l.level, t)} · {l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.floor')}</label>
                <input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.room')}</label>
                <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('multimedia.devices.modal.form.ipAddress')}</label>
                <input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} placeholder={t('multimedia.devices.modal.form.ipPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.actions.cancel')}</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {t('multimedia.devices.modal.form.submit')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}