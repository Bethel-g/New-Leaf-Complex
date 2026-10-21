const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { scopeTicketQuery } = require('../utils/permissions');
const { getSettingsMap, toNum } = require('../utils/settings');

const router = express.Router();
router.use(authenticate);

// Status sets — the workflow statuses are stable (seeded once per type) and are
// matched by name for readability, exactly like the rest of the codebase.
const OPEN_STATUSES = [
  'New', 'Assigned', 'Submitted', // Submitted is a legacy maintenance status
  'Inspection', 'In Progress',
  'Waiting for Information', 'Waiting for Parts',
];
const RESOLVED_STATUSES = ['Resolved', 'Completed'];
const UNRESOLVED_EXCLUDED = ['Resolved', 'Completed', 'Closed'];

// Per-priority SLA used to flag overdue work. The values are configurable via
// system settings; these defaults reproduce the historical behaviour exactly.
const DEFAULT_SLA_DAYS = { Critical: 1, High: 3, Medium: 7, Low: 7, default: 7 };
const DAY_MS = 86400000;

function slaDays(priority, config) {
  const map = config || DEFAULT_SLA_DAYS;
  return map[priority] ?? map.default;
}

function slaConfigFromSettings(settings) {
  const medium = toNum(settings.sla_medium_days, 7);
  return {
    Critical: toNum(settings.sla_critical_hours, 24) / 24,
    High: toNum(settings.sla_high_days, 3),
    Medium: medium,
    Low: toNum(settings.sla_low_days, 7),
    default: medium,
  };
}

// ── Date window helpers (server-local time) ───────────────────────────────────
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday-first
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Parse the requested reporting window.
 * - `period=today|week|month` → a rolling window ending now.
 * - explicit `from`/`to` (YYYY-MM-DD) → custom range.
 * - nothing → full history (used by the test suite / legacy callers).
 * The window is applied to `created_at` for every metric so the dashboard stays
 * internally consistent within the selected period.
 */
function parseRange(query) {
  const now = new Date();
  const custom = query.from || query.to;
  const period = query.period || (custom ? 'custom' : 'all');
  let from = null;
  let to = null;

  if (period === 'today') from = startOfDay(now);
  else if (period === 'week') from = startOfWeek(now);
  else if (period === 'month') from = startOfMonth(now);

  if (query.from) from = startOfDay(new Date(query.from));
  if (query.to) to = endOfDay(new Date(query.to));
  if (from && Number.isNaN(from.getTime())) from = null;
  if (to && Number.isNaN(to.getTime())) to = null;
  if (from && to && from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  return { period, from, to };
}

function applyRange(q, range, col) {
  let out = q;
  if (range.from) out = out.where(col, '>=', range.from);
  if (range.to) out = out.where(col, '<=', range.to);
  return out;
}

async function ticketCount(q) {
  const row = await q.clone().count('tickets.id as c').first();
  return parseInt(row.c, 10) || 0;
}

// Role-scoped ticket query joined against lookup tables, within the date window.
// `scopeTicketQuery` keeps the caller inside their allowed slice of the queue:
//   staff = own requests, technicians = own team + assigned,
//   supervisors = own team, admin/sys_admin = everything.
function scopedTicketQuery(user, range) {
  let q = db('tickets')
    .join('statuses', 'tickets.status_id', 'statuses.id')
    .join('priorities', 'tickets.priority_id', 'priorities.id')
    .join('departments', 'tickets.department_id', 'departments.id')
    .join('categories', 'tickets.category_id', 'categories.id')
    .leftJoin('users as requester', 'tickets.requester_id', 'requester.id')
    .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id');
  q = scopeTicketQuery(q, user);
  return applyRange(q, range, 'tickets.created_at');
}

const TICKET_ROW_SELECT = [
  'tickets.id', 'tickets.ticket_number', 'tickets.type', 'tickets.title',
  'tickets.description', 'tickets.location',
  'tickets.created_at', 'tickets.updated_at', 'tickets.resolved_date',
  'statuses.name as status_name',
  'priorities.name as priority_name',
  'departments.name as department_name',
  'categories.name as category_name',
  'requester.name as requester_name',
  'assignee.name as assignee_name',
];

router.get('/', async (req, res) => {
  try {
    const role = req.user.role_name;
    const userId = req.user.id;
    const isAdmin = role === 'admin' || role === 'sys_admin';
    const isTeamRole = ['it_staff', 'it_supervisor', 'maintenance_staff', 'maintenance_supervisor'].includes(role);

    const range = parseRange(req.query);
    const ticketQuery = scopedTicketQuery(req.user, range);
    const slaConfig = slaConfigFromSettings(await getSettingsMap());

    // ── Scoped headline totals ────────────────────────────────────────────────
    const totalTickets = await ticketCount(ticketQuery);
    const openTickets = await ticketCount(ticketQuery.clone().whereIn('statuses.name', OPEN_STATUSES));
    const inProgressTickets = await ticketCount(ticketQuery.clone().where('statuses.name', 'In Progress'));
    const resolvedTickets = await ticketCount(ticketQuery.clone().whereIn('statuses.name', RESOLVED_STATUSES));
    const closedTickets = await ticketCount(ticketQuery.clone().where('statuses.name', 'Closed'));
    const criticalTickets = await ticketCount(ticketQuery.clone().where('priorities.name', 'Critical'));
    const itCount = await ticketCount(ticketQuery.clone().where('tickets.type', 'it'));
    const mCount = await ticketCount(ticketQuery.clone().where('tickets.type', 'maintenance'));

    // ── Per-type status breakdowns (IT / maintenance pipelines) ─────────────
    const statusBreakdown = async (type, names) => {
      const rows = await ticketQuery.clone()
        .where('tickets.type', type)
        .select('statuses.name')
        .count('tickets.id as count')
        .groupBy('statuses.name');
      const counts = Object.fromEntries(rows.map((r) => [r.name, parseInt(r.count, 10)]));
      const out = {};
      for (const n of names) out[n] = counts[n] || 0;
      return out;
    };
    const itStatusCounts = await statusBreakdown('it', [
      'New', 'Assigned', 'In Progress', 'Waiting for Information', 'Resolved', 'Closed',
    ]);
    const mStatusCounts = await statusBreakdown('maintenance', [
      'New', 'Assigned', 'Inspection', 'In Progress', 'Waiting for Parts', 'Completed', 'Closed',
    ]);
    const itCritical = await ticketCount(ticketQuery.clone().where('tickets.type', 'it').where('priorities.name', 'Critical'));
    const mCritical = await ticketCount(ticketQuery.clone().where('tickets.type', 'maintenance').where('priorities.name', 'Critical'));

    // ── Overdue detection (unresolved work past its priority SLA) ───────────
    const overdueRows = (q) => q.clone()
      .whereNotIn('statuses.name', UNRESOLVED_EXCLUDED)
      .where((gb) => {
        gb.where((a) => a.where('priorities.name', 'Critical')
          .andWhere('tickets.created_at', '<', new Date(Date.now() - slaDays('Critical', slaConfig) * DAY_MS)));
        gb.orWhere((b) => b.where('priorities.name', 'High')
          .andWhere('tickets.created_at', '<', new Date(Date.now() - slaDays('High', slaConfig) * DAY_MS)));
        gb.orWhere((c) => c.whereNotIn('priorities.name', ['Critical', 'High'])
          .andWhere('tickets.created_at', '<', new Date(Date.now() - slaDays('default', slaConfig) * DAY_MS)));
      });

    const overdueByType = async (type) => {
      const scoped = ticketQuery.clone().where('tickets.type', type);
      const count = await ticketCount(overdueRows(scoped));
      const rows = await overdueRows(scoped)
        .select(TICKET_ROW_SELECT)
        .orderBy('tickets.created_at', 'asc')
        .limit(20);
      return { count, rows };
    };
    const itOverdueStat = await overdueByType('it');
    const mOverdueStat = await overdueByType('maintenance');
    const overdueCount = itOverdueStat.count + mOverdueStat.count;
    const overdueTickets = [...itOverdueStat.rows, ...mOverdueStat.rows]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // ── Breakdowns by department / category ──────────────────────────────────
    const byDepartment = await ticketQuery.clone()
      .select('departments.name')
      .count('tickets.id as count')
      .groupBy('departments.name')
      .orderBy('count', 'desc');

    const byCategory = await ticketQuery.clone()
      .select('categories.name')
      .count('tickets.id as count')
      .groupBy('categories.name')
      .orderBy('count', 'desc')
      .limit(10);

    const byCategoryIt = await ticketQuery.clone()
      .where('tickets.type', 'it')
      .select('categories.name')
      .count('tickets.id as count')
      .groupBy('categories.name')
      .orderBy('count', 'desc')
      .limit(10);

    const byCategoryMaint = await ticketQuery.clone()
      .where('tickets.type', 'maintenance')
      .select('categories.name')
      .count('tickets.id as count')
      .groupBy('categories.name')
      .orderBy('count', 'desc')
      .limit(10);

    // ── Average resolution time (Resolved / Completed with a known date) ────
    const avgRow = await ticketQuery.clone()
      .whereIn('statuses.name', RESOLVED_STATUSES)
      .whereNotNull('tickets.resolved_date')
      .avg({
        days: db.raw('ROUND((EXTRACT(EPOCH FROM (tickets.resolved_date - tickets.created_at)) / 86400.0)::numeric, 2)'),
      })
      .first();
    const avgResolutionTimeDays = avgRow && avgRow.days != null ? Number(avgRow.days) : 0;

    // ── Recent lists (scoped to the caller) ──────────────────────────────────
    const recentTickets = await ticketQuery.clone()
      .select(TICKET_ROW_SELECT)
      .orderBy('tickets.created_at', 'desc')
      .limit(10);

    const recentCompleted = await ticketQuery.clone()
      .whereIn('statuses.name', RESOLVED_STATUSES)
      .select(TICKET_ROW_SELECT)
      .orderBy('tickets.updated_at', 'desc')
      .limit(10);

    let myAssigned = [];
    if (isTeamRole) {
      myAssigned = await ticketQuery.clone()
        .where('tickets.assigned_to', userId)
        .whereNotIn('statuses.name', UNRESOLVED_EXCLUDED)
        .select(TICKET_ROW_SELECT)
        .orderBy('tickets.created_at', 'desc')
        .limit(10);
    }

    let unresolvedTickets = [];
    if (isAdmin || ['it_supervisor', 'maintenance_supervisor'].includes(role)) {
      unresolvedTickets = await ticketQuery.clone()
        .whereNotIn('statuses.name', UNRESOLVED_EXCLUDED)
        .select(TICKET_ROW_SELECT)
        .orderBy('tickets.created_at', 'asc')
        .limit(10);
    }

    // ── Suggestions (reviewers see all; everyone else only their own) ───────
    let suggestionQuery = db('suggestions')
      .join('statuses', 'suggestions.status_id', 'statuses.id')
      .join('departments', 'suggestions.department_id', 'departments.id');
    if (!isAdmin) {
      suggestionQuery = suggestionQuery.where('suggestions.user_id', userId);
    }
    suggestionQuery = applyRange(suggestionQuery, range, 'suggestions.created_at');

    const sCount = parseInt((await suggestionQuery.clone().count('suggestions.id as c').first()).c, 10) || 0;

    const mySuggestions = await suggestionQuery.clone()
      .where('suggestions.user_id', userId)
      .select(
        'suggestions.id', 'suggestions.suggestion_number', 'suggestions.title',
        'suggestions.created_at', 'suggestions.updated_at',
        'statuses.name as status_name',
        'departments.name as department_name',
      )
      .orderBy('suggestions.created_at', 'desc')
      .limit(20);

    // ── "My requests" lists for the staff dashboard (own data only) ─────────
    const MY_SELECT = [
      'tickets.id', 'tickets.ticket_number', 'tickets.type', 'tickets.title',
      'tickets.created_at', 'tickets.updated_at',
      'statuses.name as status_name',
      'priorities.name as priority_name',
      'categories.name as category_name',
      'requester.name as requester_name',
      'assignee.name as assignee_name',
    ];
    const myTicketQuery = applyRange(
      db('tickets')
        .join('statuses', 'tickets.status_id', 'statuses.id')
        .join('priorities', 'tickets.priority_id', 'priorities.id')
        .join('categories', 'tickets.category_id', 'categories.id')
        .leftJoin('users as requester', 'tickets.requester_id', 'requester.id')
        .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
        .where('tickets.requester_id', userId),
      range,
      'tickets.created_at',
    );

    const myOpenRequests = await myTicketQuery.clone()
      .whereIn('statuses.name', OPEN_STATUSES)
      .select(MY_SELECT)
      .orderBy('tickets.created_at', 'desc')
      .limit(20);

    const myResolvedRequests = await myTicketQuery.clone()
      .whereIn('statuses.name', RESOLVED_STATUSES)
      .select(MY_SELECT)
      .orderBy('tickets.updated_at', 'desc')
      .limit(20);

    const recentlyUpdated = await myTicketQuery.clone()
      .select(MY_SELECT)
      .orderBy('tickets.updated_at', 'desc')
      .limit(10);

    res.json({
      // Headline totals (role-scoped)
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      itCount,
      mCount,
      sCount,
      avgResolutionTimeDays,

      // IT team dashboard
      itStatusCounts,
      itCritical,
      itOverdue: itOverdueStat.count,
      itOverdueTickets: itOverdueStat.rows,
      byCategoryIt,

      // Maintenance team dashboard
      mStatusCounts,
      mCritical,
      mOverdue: mOverdueStat.count,
      mOverdueTickets: mOverdueStat.rows,
      byCategoryMaint,

      // All-ticket breakdowns + overdue
      byDepartment,
      byCategory,
      overdueCount,
      overdueTickets,

      // Staff dashboard
      myOpenRequests,
      myResolvedRequests,
      mySuggestions,
      recentlyUpdated,

      // Shared lists
      recentTickets,
      recentCompleted,
      myAssigned,
      unresolvedTickets,

      range,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;