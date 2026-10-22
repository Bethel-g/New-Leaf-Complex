import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, FilterX, Printer, Download } from 'lucide-react';
import api from '../../services/api';
import { Badge, statusColor, priorityColor } from '../../components/Badge';
import { ticketKind } from '../../components/TicketTable';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';
import PrintHeader from '../../components/PrintHeader';
import { useTranslation } from '../../i18n';

export default function AllRequests() {
  const { t, statusLabel, priorityLabel, typeLabel, formatDateTime } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });

  const loadData = useCallback(() => {
    const params = { limit: 200 };
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;

    Promise.all([
      api.get('/tickets', { params }),
      api.get('/suggestions', { params: { limit: 200 } }),
    ]).then(([t, s]) => {
      setTickets(t.data.tickets);
      setSuggestions(s.data.suggestions);
    }).catch(() => {
      setTickets([]);
      setSuggestions([]);
    }).finally(() => setLoading(false));
  }, [filters.search, filters.status, filters.priority]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allItems = [
    ...tickets.map((t) => {
      const kind = ticketKind(t);
      return {
        kind,
        id: t.id,
        number: t.ticket_number,
        title: t.title,
        requester: t.requester_name,
        category: t.category_name,
        priority: t.priority_name,
        status: t.status_name,
        date: t.created_at,
        link: kind === 'it' ? `/it/tickets/${t.id}` : `/maintenance/tickets/${t.id}`,
      };
    }),
    ...suggestions.map((s) => ({
      kind: 'suggestion',
      id: s.id,
      number: s.suggestion_number,
      title: s.title,
      requester: s.user_name,
      category: typeLabel('suggestion'),
      priority: null,
      status: s.status_name,
      date: s.created_at,
      link: `/suggestions/${s.id}`,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = allItems.filter((item) => {
    if (tab === 'it' && item.kind !== 'it') return false;
    if (tab === 'maintenance' && item.kind !== 'maintenance') return false;
    if (tab === 'suggestion' && item.kind !== 'suggestion') return false;
    return true;
  });

  const downloadCSV = () => {
    const headers = [
      t('admin.requests.csv.number'),
      t('common.labels.title'),
      t('common.labels.requester'),
      t('common.labels.type'),
      t('common.labels.priority'),
      t('common.labels.status'),
      t('common.labels.date'),
    ];
    const rows = filtered.map((i) => [
      i.number, i.title, i.requester, typeLabel(i.kind), i.priority ? priorityLabel(i.priority) : '', i.status ? statusLabel(i.status) : '', new Date(i.date).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newleaf-all-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PrintHeader title={t('admin.requests.title')} />
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('admin.requests.title')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.requests.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={printReport} className="inline-flex items-center gap-2 px-4 py-2 bg-[#4b5563] text-white rounded-lg text-sm font-medium hover:bg-[#374151]">
            <Printer className="w-4 h-4" /> {t('common.actions.print')}
          </button>
          <button onClick={downloadCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Download className="w-4 h-4" /> {t('common.myAssigned.exportCsv')}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 print:hidden">
        {['all', 'it', 'maintenance', 'suggestion'].map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tabKey ? 'border-primary-600 text-brand-text' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabKey === 'all'
              ? t('admin.requests.tab.all', { count: allItems.length })
              : tabKey === 'it'
                ? t('admin.requests.tab.it', { count: tickets.filter((x) => ticketKind(x) === 'it').length })
                : tabKey === 'maintenance'
                  ? t('admin.requests.tab.maintenance', { count: tickets.filter((x) => ticketKind(x) === 'maintenance').length })
                  : t('admin.requests.tab.suggestions', { count: suggestions.length })}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-4 print:hidden">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="col-span-2 md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder={t('admin.requests.filter.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">{t('common.myAssigned.allStatuses')}</option>
            {[...new Set(allItems.map((i) => i.status))].map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">{t('common.myAssigned.allPriorities')}</option>
            {['Low', 'Medium', 'High', 'Critical'].map((p) => (
              <option key={p} value={p}>{priorityLabel(p)}</option>
            ))}
          </select>
          <button
            onClick={() => setFilters({ search: '', status: '', priority: '' })}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            <FilterX className="w-4 h-4" /> {t('common.actions.clear')}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t('admin.requests.empty.title')} subtitle={t('common.myAssigned.empty.filteredSubtitle')} />
      ) : (
        <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.requests.table.number')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.labels.title')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.labels.requester')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.labels.type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.labels.category')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.labels.priority')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.labels.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.labels.date')}</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-gray-200">
                {filtered.map((item) => (
                  <tr key={`${item.kind}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={item.link} className="text-sm font-medium text-brand-text-strong hover:underline">
                        {item.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.requester}</td>
                    <td className="px-4 py-3">
                      <Badge color={item.kind === 'it' ? 'blue' : item.kind === 'maintenance' ? 'orange' : 'green'}>
                        {typeLabel(item.kind)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                    <td className="px-4 py-3">
                      {item.priority
                        ? <Badge color={priorityColor(item.priority)}>{priorityLabel(item.priority)}</Badge>
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={statusColor(item.status)}>{statusLabel(item.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(item.date)}</td>
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
