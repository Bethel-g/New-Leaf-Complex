import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Building2, ShieldCheck, Hash, Save,
  Pencil, X, Clock, Activity, ClipboardList, Lightbulb, CircleCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { useTranslation } from '../../i18n';

export default function Profile() {
  const { t, roleLabel, formatDateTime } = useTranslation();
  const { user, updateUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);
  const [details, setDetails] = useState({ name: '', email: '', phone: '' });
  const [savingDetails, setSavingDetails] = useState(false);

  const [security, setSecurity] = useState(null);
  const [counts, setCounts] = useState({ requests: 0, open: 0, suggestions: 0 });

  useEffect(() => {
    setDetails({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  }, [user?.name, user?.email, user?.phone]);

  useEffect(() => {
    api.get('/auth/me/security').then((res) => setSecurity(res.data)).catch(() => {});

    const DONE = ['Resolved', 'Completed', 'Closed'];
    Promise.all([
      api.get('/tickets', { params: { limit: 500 } }),
      api.get('/suggestions', { params: { limit: 500 } }),
    ]).then(([ticketsRes, suggestionsRes]) => {
      // Admins receive every ticket/suggestion; the profile summary is personal,
      // so keep only the current user's own records.
      const mine = ticketsRes.data.tickets.filter((x) => x.requester_id === user?.id);
      const mySuggestions = suggestionsRes.data.suggestions.filter((x) => x.user_id === user?.id);
      setCounts({
        requests: mine.length,
        open: mine.filter((x) => !DONE.includes(x.status_name)).length,
        suggestions: mySuggestions.length,
      });
    }).catch(() => {});
  }, [user?.id]);

  const changePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error(t('common.profile.error.currentPasswordRequired'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('common.profile.error.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('common.profile.error.passwordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { current_password: oldPassword, new_password: newPassword });
      toast.success(t('common.profile.passwordUpdated'));
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.profile.passwordUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    if (!details.name.trim()) {
      toast.error(t('common.profile.error.nameRequired'));
      return;
    }
    setSavingDetails(true);
    try {
      const res = await api.put('/auth/profile', {
        name: details.name.trim(),
        email: details.email.trim(),
        phone: details.phone.trim() || null,
      });
      updateUser(res.data);
      toast.success(t('common.profile.updated'));
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.profile.updateFailed'));
    } finally {
      setSavingDetails(false);
    }
  };

  const infoItems = [
    { key: 'name', icon: User, label: t('common.profile.fullName'), value: user?.name },
    { key: 'employeeId', icon: Hash, label: t('common.profile.employeeId'), value: user?.employee_id || '-' },
    { key: 'email', icon: Mail, label: t('common.labels.email'), value: user?.email },
    { key: 'phone', icon: Phone, label: t('common.labels.phone'), value: user?.phone || '-' },
    { key: 'department', icon: Building2, label: t('common.labels.department'), value: user?.department_name },
    { key: 'role', icon: ShieldCheck, label: t('common.labels.role'), value: roleLabel(user?.role_name) },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('common.profile.title')}</h2>
        <p className="text-gray-500 text-sm">{t('common.profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title={t('common.profile.stat.requests')} value={counts.requests} icon={ClipboardList} color="blue" />
        <StatCard title={t('common.profile.stat.open')} value={counts.open} icon={Clock} color="yellow" />
        <StatCard title={t('common.profile.stat.suggestions')} value={counts.suggestions} icon={Lightbulb} color="purple" />
      </div>

      {/* Account status */}
      <div className="bg-surface rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-text" /> {t('common.profile.accountStatus')}
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">{t('common.labels.status')}</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand-text-strong">
              <CircleCheck className="w-4 h-4" /> {t('status.active')}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">{t('common.profile.lastSignIn')}</div>
            <div className="text-sm font-medium text-gray-800 mt-1">
              {security?.last_login_at ? formatDateTime(security.last_login_at) : '—'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">{t('common.profile.failedAttempts')}</div>
            <div className="text-sm font-medium text-gray-800 mt-1">{security?.failed_attempts_30d ?? 0}</div>
          </div>
        </div>
        {security?.last_login_ip && (
          <p className="text-xs text-gray-400 mt-3">
            {t('common.profile.lastSignInAddress')} <span className="font-mono">{security.last_login_ip}</span>
          </p>
        )}
      </div>

      {/* Personal details */}
      <div className="bg-surface rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{user?.name}</div>
              <div className="text-sm text-gray-500 capitalize">{roleLabel(user?.role_name)}</div>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" /> {t('common.actions.edit')}
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={saveDetails} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.profile.fullName')}</label>
              <input
                type="text"
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.email')}</label>
              <input
                type="email"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.phone')}</label>
              <input
                type="text"
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={savingDetails}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {savingDetails ? t('common.profile.saving') : t('common.profile.saveChanges')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDetails({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <X className="w-4 h-4" /> {t('common.actions.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <item.icon className="w-5 h-5 text-brand-text" />
                <div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="text-sm font-medium text-gray-800">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">{t('common.profile.changePassword')}</h3>
        <form onSubmit={changePassword} className="max-w-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.profile.currentPassword')}</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.profile.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.profile.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? t('common.profile.updating') : t('common.profile.updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
