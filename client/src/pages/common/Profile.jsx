import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Building2, ShieldCheck, Hash, Save,
  Pencil, X, Clock, Activity, ClipboardList, Lightbulb, CircleCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { formatDate } from '../../components/TicketTable';

export default function Profile() {
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
    ]).then(([t, s]) => {
      // Admins receive every ticket/suggestion; the profile summary is personal,
      // so keep only the current user's own records.
      const mine = t.data.tickets.filter((x) => x.requester_id === user?.id);
      const mySuggestions = s.data.suggestions.filter((x) => x.user_id === user?.id);
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
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { current_password: oldPassword, new_password: newPassword });
      toast.success('Password updated successfully');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    if (!details.name.trim()) {
      toast.error('Name cannot be empty');
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
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingDetails(false);
    }
  };

  const infoItems = [
    { icon: User, label: 'Full Name', value: user?.name },
    { icon: Hash, label: 'Employee ID', value: user?.employee_id || '-' },
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Phone, label: 'Phone', value: user?.phone || '-' },
    { icon: Building2, label: 'Department', value: user?.department_name },
    { icon: ShieldCheck, label: 'Role', value: user?.role_name?.replace(/_/g, ' ') },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <p className="text-gray-500 text-sm">View your account, update your details and change your password</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="My Requests" value={counts.requests} icon={ClipboardList} color="blue" />
        <StatCard title="Open Requests" value={counts.open} icon={Clock} color="yellow" />
        <StatCard title="My Suggestions" value={counts.suggestions} icon={Lightbulb} color="purple" />
      </div>

      {/* Account status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" /> Account Status
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Status</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700">
              <CircleCheck className="w-4 h-4" /> Active
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Last sign-in</div>
            <div className="text-sm font-medium text-gray-800 mt-1">
              {security?.last_login_at ? formatDate(security.last_login_at) : '—'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Failed attempts (30d)</div>
            <div className="text-sm font-medium text-gray-800 mt-1">{security?.failed_attempts_30d ?? 0}</div>
          </div>
        </div>
        {security?.last_login_ip && (
          <p className="text-xs text-gray-400 mt-3">Last sign-in address: <span className="font-mono">{security.last_login_ip}</span></p>
        )}
      </div>

      {/* Personal details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{user?.name}</div>
              <div className="text-sm text-gray-500 capitalize">{user?.role_name?.replace(/_/g, ' ')}</div>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={saveDetails} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
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
                <Save className="w-4 h-4" /> {savingDetails ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDetails({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <item.icon className="w-5 h-5 text-primary-600" />
                <div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="text-sm font-medium text-gray-800">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
        <form onSubmit={changePassword} className="max-w-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
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
            <Save className="w-4 h-4" /> {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
