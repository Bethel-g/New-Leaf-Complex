import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Printer, Download, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import PrintHeader from '../../components/PrintHeader';
import { Badge, statusColor, priorityColor } from '../../components/Badge';
import { formatDate } from '../../components/TicketTable';
import { downloadCSV } from '../../utils/csv';

const NOW = Date.now();
const PIE_COLORS = ['#2563eb', '#0ea5e9', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/tickets', { params: { limit: 500 } }),
      api.get('/suggestions', { params: { limit: 500 } }),
    ]).then(([d, t, s]) => {
      setStats(d.data);
      setTickets(t.data.tickets);
      setSuggestions(s.data.suggestions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const averageResolutionTime = useMemo(() => {
    const resolved = tickets.filter((t) => ['Resolved', 'Completed', 'Closed'].includes(t.status_name));
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((sum, t) => {
      const created = new Date(t.created_at);
      const end = new Date(t.resolved_date || t.updated_at);
      const endMs = Number.isFinite(end.getTime()) ? end.getTime() : NOW;
      return sum + (endMs - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    return (total / resolved.length).toFixed(1);
  }, [tickets]);

  // Overdue rows come from the server, so the report honours the configured SLA
  // targets instead of a client-side copy of the thresholds.
  const dueTickets = stats?.overdueTickets ?? [];

  const monthly = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-GB', { month: 'short' }),
        IT: 0,
        Maintenance: 0,
        total: 0,
      });
    }
    const index = Object.fromEntries(months.map((m) => [m.key, m]));
    tickets.forEach((t) => {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = index[key];
      if (!m) return;
      if (t.type === 'it') m.IT += 1;
      else if (t.type === 'maintenance') m.Maintenance += 1;
      m.total += 1;
    });
    return months;
  }, [tickets]);

  const statusData = useMemo(() => {
    const map = {};
    tickets.forEach((t) => { map[t.status_name] = (map[t.status_name] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const byType = useMemo(() => ([
    { name: 'IT', count: tickets.filter((t) => t.type === 'it').length },
    { name: 'Maintenance', count: tickets.filter((t) => t.type === 'maintenance').length },
  ]), [tickets]);

  const topRequesters = useMemo(() => {
    const map = {};
    tickets.forEach((t) => { const n = t.requester_name || 'Unknown'; map[n] = (map[n] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [tickets]);

  const suggestionPipeline = useMemo(() => {
    const map = {};
    suggestions.forEach((s) => { map[s.status_name] = (map[s.status_name] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [suggestions]);

  const exportCSV = () => {
    const rows = tickets.map((t) => ({
      number: t.ticket_number,
      title: t.title,
      type: t.type,
      requester: t.requester_name,
      department: t.department_name,
      category: t.category_name,
      priority: t.priority_name,
      status: t.status_name,
      created: formatDate(t.created_at),
    }));
    if (!downloadCSV(rows, 'newleaf-tickets-report')) toast.error('No data to export');
  };

  const print = () => window.print();

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <PrintHeader title="Operations Report" />
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-gray-500 text-sm">Generate management reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={print} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={stats?.totalTickets ?? 0} icon={BarChart3} color="blue" />
        <StatCard title="Average Resolution Time" value={`${averageResolutionTime} days`} icon={BarChart3} color="primary" />
        <StatCard title="Critical Open" value={stats?.criticalTickets ?? 0} icon={BarChart3} color="red" />
        <StatCard title="Overdue Requests" value={stats?.overdueCount ?? 0} icon={BarChart3} color="orange" />
      </div>

      {/* Trend: monthly volume + IT/Maintenance split */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Request Volume by Month (IT vs Maintenance)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Legend />
              <Bar dataKey="IT" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Maintenance" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Requests by Status</h3>
          {statusData.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Total Volume Trend (12 months)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#totalFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Requests by Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byType} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Summary by Department</h3>
          </div>
          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="pb-2">Department</th>
                  <th className="pb-2 text-right">Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.byDepartment?.map((d) => (
                  <tr key={d.name}>
                    <td className="py-2 text-gray-700">{d.name}</td>
                    <td className="py-2 text-right font-medium">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Summary by Category</h3>
          </div>
          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.byCategory?.map((c) => (
                  <tr key={c.name}>
                    <td className="py-2 text-gray-700">{c.name}</td>
                    <td className="py-2 text-right font-medium">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top requesters */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Top Requesters</h3>
          </div>
          {topRequesters.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pb-2">Requester</th>
                    <th className="pb-2 text-right">Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topRequesters.map((r) => (
                    <tr key={r.name}>
                      <td className="py-2 text-gray-700">{r.name}</td>
                      <td className="py-2 text-right font-medium">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Suggestion pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Suggestion Pipeline</h3>
          {suggestionPipeline.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No suggestions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(suggestionPipeline.length * 40, 180)}>
              <BarChart data={suggestionPipeline} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Overdue */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Overdue / Aging Requests</h3>
          <p className="text-xs text-gray-400 mt-0.5">Measured against the SLA targets configured in Settings.</p>
        </div>
        {dueTickets.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No overdue requests</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dueTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-primary-700">{t.ticket_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{t.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.department_name}</td>
                    <td className="px-4 py-3"><Badge color={priorityColor(t.priority_name)}>{t.priority_name}</Badge></td>
                    <td className="px-4 py-3"><Badge color={statusColor(t.status_name)}>{t.status_name}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-red-600">{Math.max(1, Math.floor((NOW - new Date(t.created_at)) / (1000 * 60 * 60 * 24)))}</td>
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
