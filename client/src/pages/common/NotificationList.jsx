import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, MailOpen, ChevronRight, Settings, X,
  Inbox, Lightbulb, CalendarDays, Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { formatDate } from '../../components/TicketTable';
import StatCard from '../../components/StatCard';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function NotificationList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState({ tickets: true, suggestions: true, system: true });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const loadData = () => {
    setLoading(true);
    api.get('/notifications').then((res) => {
      setNotifications(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openSettings = () => {
    setSettingsOpen(true);
    api.get('/notifications/preferences').then((res) => setPrefs(res.data)).catch(() => {});
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      const res = await api.put('/notifications/preferences', prefs);
      setPrefs(res.data);
      toast.success('Notification settings saved');
      setSettingsOpen(false);
      loadData();
      window.dispatchEvent(new Event('focus'));
    } catch {
      toast.error('Failed to save notification settings');
    } finally {
      setSavingPrefs(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      toast.success('All notifications marked as read');
      loadData();
      window.dispatchEvent(new Event('focus'));
    } catch {
      toast.error('Failed to update');
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadData();
      window.dispatchEvent(new Event('focus'));
    } catch {}
  };

  const unread = notifications.filter((n) => !n.is_read).length;
  const now = Date.now();
  const stats = {
    unread,
    week: notifications.filter((n) => now - new Date(n.created_at).getTime() <= WEEK_MS).length,
    requests: notifications.filter((n) => n.entity_type === 'ticket').length,
    suggestions: notifications.filter((n) => n.entity_type === 'suggestion').length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-gray-500 text-sm">{unread} unread</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openSettings}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          {unread > 0 && (
            <button onClick={markAllRead} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
              <CheckCheck className="w-4 h-4" /> Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Unread" value={stats.unread} icon={Bell} color="red" />
        <StatCard title="This Week" value={stats.week} icon={CalendarDays} color="blue" />
        <StatCard title="Requests" value={stats.requests} icon={Inbox} color="primary" />
        <StatCard title="Suggestions" value={stats.suggestions} icon={Lightbulb} color="purple" />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" subtitle="You will be notified of important updates here" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/notifications/${n.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/notifications/${n.id}`); } }}
              className={`px-5 py-4 flex gap-3 cursor-pointer hover:bg-gray-50 ${n.is_read ? 'bg-white' : 'bg-primary-50/50'}`}
            >
              <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-primary-100 text-primary-600">
                {n.is_read ? <MailOpen className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-800">{n.title}</div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <button
                        type="button"
                        aria-label={`Mark "${n.title}" as read`}
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        className="text-xs text-gray-400 hover:text-primary-600"
                      >
                        Mark read
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
                {n.message && <div className="text-sm text-gray-600 mt-0.5">{n.message}</div>}
                <div className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</div>
              </div>
              {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-2 shrink-0" />}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Open a notification to read the full request, reply and follow its history.{' '}
        <Link to="/my-requests" className="text-primary-600 hover:underline">Track all of your requests</Link>.
      </p>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={savingPrefs ? undefined : () => setSettingsOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Notification settings" className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-600" /> Notification Settings
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Choose which notification categories appear for you.</p>
              </div>
              <button onClick={() => setSettingsOpen(false)} disabled={savingPrefs} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'tickets', label: 'Request updates', hint: 'Assignments, status changes and replies on IT / maintenance requests' },
                { key: 'suggestions', label: 'Suggestion updates', hint: 'Progress and comments on suggestions' },
                { key: 'system', label: 'System messages', hint: 'General announcements' },
              ].map((row) => (
                <label key={row.key} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer">
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{row.label}</span>
                    <span className="block text-xs text-gray-500">{row.hint}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={!!prefs[row.key]}
                    onChange={(e) => setPrefs({ ...prefs, [row.key]: e.target.checked })}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setSettingsOpen(false)} disabled={savingPrefs} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={savePrefs}
                disabled={savingPrefs}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
