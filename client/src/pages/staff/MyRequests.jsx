import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, MonitorCog, Wrench, Lightbulb, CheckCircle2, MessageCircle, UserCircle2, Bell,
} from 'lucide-react';
import api from '../../services/api';
import { Badge, statusColor, priorityColor } from '../../components/Badge';
import { formatDate, ticketKind } from '../../components/TicketTable';
import { EmptyState, LoadingSpinner } from '../../components/EmptyState';

// Where a request sits in its life, so staff can see at a glance what is still
// moving and what is waiting on them.
const STAGE_FILTERS = [
  { key: 'all', label: 'All stages' },
  { key: 'active', label: 'In progress' },
  { key: 'waiting', label: 'Waiting on me' },
  { key: 'done', label: 'Finished' },
];

const WAITING_STATUSES = ['Waiting for Information', 'Waiting for Parts', 'Needs More Information'];
const DONE_STATUSES = ['Resolved', 'Completed', 'Closed'];

export default function MyRequests({ initialTab = 'all' }) {
  const [tickets, setTickets] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [stage, setStage] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/tickets', { params: { limit: 200 } }),
      api.get('/suggestions'),
    ]).then(([t, s]) => {
      setTickets(t.data.tickets);
      setSuggestions(s.data.suggestions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const allItems = [
    ...tickets.map((t) => {
      const kind = ticketKind(t);
      return {
        type: 'ticket',
        kind,
        id: t.id,
        number: t.ticket_number,
        title: t.title,
        category: t.category_name,
        location: t.location,
        priority: t.priority_name,
        status: t.status_name,
        assignee: t.assignee_name,
        date: t.created_at,
        link: kind === 'it' ? `/it/tickets/${t.id}` : `/maintenance/tickets/${t.id}`,
      };
    }),
    ...suggestions.map((s) => ({
      type: 'suggestion',
      kind: 'suggestion',
      id: s.id,
      number: s.suggestion_number,
      title: s.title,
      category: 'Suggestion',
      location: null,
      priority: null,
      status: s.status_name,
      assignee: s.assignee_name,
      date: s.created_at,
      link: `/suggestions/${s.id}`,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const inStage = (item, key) => {
    if (key === 'all') return true;
    if (key === 'waiting') return WAITING_STATUSES.includes(item.status);
    if (key === 'done') return DONE_STATUSES.includes(item.status);
    return !WAITING_STATUSES.includes(item.status) && !DONE_STATUSES.includes(item.status);
  };

  const byKind = tab === 'all' ? allItems : allItems.filter((i) => i.kind === tab);
  const filtered = byKind.filter((i) => inStage(i, stage));
  const stageCount = (key) => byKind.filter((i) => inStage(i, key)).length;
  const needsConfirm = (item) => item.type === 'ticket' && ['Resolved', 'Completed'].includes(item.status);
  const needsInfo = (item) => item.type === 'suggestion' && item.status === 'Needs More Information';
  const pageTitle = { all: 'My Requests', it: 'My IT Requests', maintenance: 'My Maintenance Requests', suggestion: 'My Suggestions' }[tab];
  const pageSubtitle = tab === 'it'
    ? 'Your submitted IT support requests'
    : tab === 'maintenance'
      ? 'Your submitted maintenance requests'
      : tab === 'suggestion'
        ? 'Your submitted suggestions'
        : 'Track all your submitted requests';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{pageTitle}</h2>
          <p className="text-gray-500 text-sm">{pageSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/submit-it" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <MonitorCog className="w-4 h-4" /> IT
          </Link>
          <Link to="/submit-maintenance" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
            <Wrench className="w-4 h-4" /> Maintenance
          </Link>
          <Link to="/submit-suggestion" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Lightbulb className="w-4 h-4" /> Suggestion
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2 border-b border-gray-200 flex-1 min-w-[280px]" role="tablist" aria-label="Request types">
          {['all', 'it', 'maintenance', 'suggestion'].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'all' ? 'All' : t === 'it' ? 'IT Requests' : t === 'maintenance' ? 'Maintenance' : 'Suggestions'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by stage">
          {STAGE_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              aria-pressed={stage === s.key}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                stage === s.key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 text-gray-600 hover:border-primary-400'
              }`}
            >
              {s.label} ({stageCount(s.key)})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requests found"
          subtitle="Submit a new request to get started"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No.</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Handled By</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={item.link} className="text-sm font-medium text-primary-700 hover:underline">
                        {item.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.location || <span className="text-gray-300">-</span>}</td>
                    <td className="px-4 py-3">
                      {item.priority
                        ? <Badge color={priorityColor(item.priority)}>{item.priority}</Badge>
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={statusColor(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {item.assignee
                        ? <span className="inline-flex items-center gap-1.5"><UserCircle2 className="w-3.5 h-3.5 text-gray-400" /> {item.assignee}</span>
                        : <span className="text-gray-300">Not yet assigned</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {needsInfo(item) && (
                        <Link
                          to={item.link}
                          className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Provide info
                        </Link>
                      )}
                      {needsConfirm(item) && (
                        <Link
                          to={item.link}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {item.kind === 'maintenance' ? 'Confirm completion' : 'Confirm resolution'}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5" />
        Every assignment, reply and status change also arrives in your{' '}
        <Link to="/notifications" className="text-primary-600 hover:underline">notifications</Link>.
      </p>
    </div>
  );
}