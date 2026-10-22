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
import { downloadCSV } from '../../utils/csv';
import { useTranslation } from '../../i18n';

const NOW = Date.now();
const PIE_COLORS = ['#2563eb', '#0ea5e9', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

export default function Reports() {
  const { t, statusLabel, priorityLabel, typeLabel, formatDate, formatNumber } = useTranslation();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/tickets', { params: { limit: 500 } }),
      api.get('/suggestions', { params: { limit: 500 } }),
    ]).then(([d, ticketRes, s]) => {
      setStats(d.data);
      setTickets(ticketRes.data.tickets);
      setSuggestions(s.data.suggestions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const averageResolutionTime = useMemo(() => {
    const resolved = tickets.filter((tk) => ['Resolved', 'Completed', 'Closed'].includes(tk.status_name));
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((sum, tk) => {
      const created = new Date(tk.created_at);
      const end = new Date(tk.resolved_date || tk.updated_at);
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
        label: formatDate(d, { month: 'short' }),
        IT: 0,
        Maintenance: 0,
        total: 0,
      });
    }
    const index = Object.fromEntries(months.map((m) => [m.key, m]));
    tickets.forEach((tk) => {
      const d = new Date(tk.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = index[key];
      if (!m) return;
      if (tk.type === 'it') m.IT += 1;
      else if (tk.type === 'maintenance') m.Maintenance += 1;
      m.total += 1;
    });
    return months;
  }, [tickets, formatDate]);

  const statusData = useMemo(() => {
    const map = {};
    tickets.forEach((tk) => { map[tk.status_name] = (map[tk.status_name] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ key: name, name: statusLabel(name), value }));
  }, [tickets, statusLabel]);

  const byType = useMemo(() => ([
    { name: typeLabel('it'), count: tickets.filter((tk) => tk.type === 'it').length },
    { name: typeLabel('maintenance'), count: tickets.filter((tk) => tk.type === 'maintenance').length },
  ]), [tickets, typeLabel]);

  const topRequesters = useMemo(() => {
    const map = {};
    tickets.forEach((tk) => { const n = tk.requester_name || t('admin.reports.unknownRequester'); map[n] = (map[n] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [tickets, t]);

  const suggestionPipeline = useMemo(() => {
    const map = {};
    suggestions.forEach((s) => { map[s.status_name] = (map[s.status_name] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name: statusLabel(name), count }));
  }, [suggestions, statusLabel]);

  const exportCSV = () => {
    const headers = {
      number: t('admin.requests.csv.number'),
      title: t('common.labels.title'),
      type: t('common.labels.type'),
      requester: t('common.labels.requester'),
      department: t('common.labels.department'),
      category: t('common.labels.category'),
      priority: t('common.labels.priority'),
      status: t('common.labels.status'),
      created: t('common.labels.date'),
    };
    const rows = tickets.map((tk) => ({
      [headers.number]: tk.ticket_number,
      [headers.title]: tk.title,
      [headers.type]: typeLabel(tk.type),
      [headers.requester]: tk.requester_name,
      [headers.department]: tk.department_name,
      [headers.category]: tk.category_name,
      [headers.priority]: priorityLabel(tk.priority_name),
      [headers.status]: statusLabel(tk.status_name),
      [headers.created]: formatDate(tk.created_at),
    }));
    if (!downloadCSV(rows, 'newleaf-tickets-report')) toast.error(t('admin.reports.toast.noDataToExport'));
  };

  const print = () => window.print();

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <PrintHeader title={t('admin.reports.printTitle')} />
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('nav.reports')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={print} className="inline-flex items-center gap-2 px-4 py-2 bg-[#4b5563] text-white rounded-lg text-sm font-medium hover:bg-[#374151]">
            <Printer className="w-4 h-4" /> {t('common.actions.print')}
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            <Download className="w-4 h-4" /> {t('admin.reports.export')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t('admin.reports.stat.total')} value={formatNumber(stats?.totalTickets ?? 0)} icon={BarChart3} color="blue" />
        <StatCard title={t('admin.reports.stat.avgResolution')} value={`${averageResolutionTime} ${t('admin.unit.daysLong')}`} icon={BarChart3} color="primary" />
        <StatCard title={t('admin.reports.stat.criticalOpen')} value={formatNumber(stats?.criticalTickets ?? 0)} icon={BarChart3} color="red" />
        <StatCard title={t('admin.reports.stat.overdue')} value={formatNumber(stats?.overdueCount ?? 0)} icon={BarChart3} color="orange" />
      </div>

      {/* Trend: monthly volume + IT/Maintenance split */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">{t('admin.reports.chart.volumeByMonth')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Legend />
              <Bar dataKey="IT" name={typeLabel('it')} stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Maintenance" name={typeLabel('maintenance')} stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">{t('admin.reports.chart.byStatus')}</h3>
          {statusData.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">{t('common.empty.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map((entry, i) => (
                    <Cell key={entry.key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
        <div className="bg-surface rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">{t('admin.reports.chart.totalTrend')}</h3>
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

        <div className="bg-surface rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">{t('admin.reports.chart.byType')}</h3>
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
        <div className="bg-surface rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">{t('admin.reports.summary.byDepartment')}</h3>
          </div>
          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="pb-2">{t('common.labels.department')}</th>
                  <th className="pb-2 text-right">{t('admin.reports.summary.requests')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.byDepartment?.map((d) => (
                  <tr key={d.name}>
                    <td className="py-2 text-gray-700">{d.name}</td>
                    <td className="py-2 text-right font-medium">{formatNumber(d.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">{t('admin.reports.summary.byCategory')}</h3>
          </div>
          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="pb-2">{t('common.labels.category')}</th>
                  <th className="pb-2 text-right">{t('admin.reports.summary.requests')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.byCategory?.map((c) => (
                  <tr key={c.name}>
                    <td className="py-2 text-gray-700">{c.name}</td>
                    <td className="py-2 text-right font-medium">{formatNumber(c.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top requesters */}
        <div className="bg-surface rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">{t('admin.reports.topRequesters.title')}</h3>
          </div>
          {topRequesters.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('common.empty.noData')}</div>
          ) : (
            <div className="p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pb-2">{t('common.labels.requester')}</th>
                    <th className="pb-2 text-right">{t('admin.reports.summary.requests')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topRequesters.map((r) => (
                    <tr key={r.name}>
                      <td className="py-2 text-gray-700">{r.name}</td>
                      <td className="py-2 text-right font-medium">{formatNumber(r.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Suggestion pipeline */}
        <div className="bg-surface rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">{t('admin.reports.suggestionPipeline.title')}</h3>
          {suggestionPipeline.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">{t('admin.reports.suggestionPipeline.empty')}</div>
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
      <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{t('admin.reports.overdue.title')}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{t('admin.reports.overdue.hint')}</p>
        </div>
        {dueTickets.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('admin.reports.overdue.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.reports.overdue.table.number')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.title')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.department')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.priority')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('common.labels.created')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.reports.overdue.table.days')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dueTickets.map((tk) => (
                  <tr key={tk.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-brand-text-strong">{tk.ticket_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{tk.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tk.department_name}</td>
                    <td className="px-4 py-3"><Badge color={priorityColor(tk.priority_name)}>{priorityLabel(tk.priority_name)}</Badge></td>
                    <td className="px-4 py-3"><Badge color={statusColor(tk.status_name)}>{statusLabel(tk.status_name)}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(tk.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-red-soft-text">{formatNumber(Math.max(1, Math.floor((NOW - new Date(tk.created_at)) / (1000 * 60 * 60 * 24))))}</td>
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
