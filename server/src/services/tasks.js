/**
 * Shared task layer for tickets and suggestions.
 *
 * Both resources are "tasks": they carry a description, a submitter, a status,
 * an optional assignee, attachments, comments and a history timeline. This
 * module owns the pieces that must behave identically no matter where a user
 * meets a task — the dedicated detail page, the staff tracking list, or a
 * notification:
 *
 *  - the detail payloads (task + comments + attachments + history + statuses)
 *  - who is allowed to see them
 *  - adding a reply (comment + history entry + counterpart notification)
 *
 * Routes stay thin: they validate request-shaped input and delegate here.
 */
const db = require('../config/db');
const { createNotification } = require('../utils/helpers');
const { HttpError } = require('../utils/httpError');
const {
  canManageTicket,
  canViewTicket,
  canViewSuggestion,
  isSuggestionAssignee,
} = require('../utils/permissions');
const { createCollaboration } = require('./collaboration');

const ticketCollab = createCollaboration({
  idField: 'ticket_id',
  commentsTable: 'ticket_comments',
  historyTable: 'ticket_history',
  attachmentsTable: 'ticket_attachments',
});

const suggestionCollab = createCollaboration({
  idField: 'suggestion_id',
  commentsTable: 'suggestion_comments',
  historyTable: 'suggestion_history',
  attachmentsTable: 'suggestion_attachments',
});

// Comment limits mirror the per-resource validation the routes apply.
const MAX_COMMENT_LENGTH = { ticket: 5000, suggestion: 2000 };

// Suggestion & Improvement pipeline:
// SUBMITTED -> UNDER REVIEW -> ACCEPTED -> ASSIGNED -> IMPLEMENTATION -> IMPLEMENTED -> CLOSED
// plus REJECTED and NEEDS_MORE_INFORMATION as branching states.
const SUGGESTION_TRANSITIONS = {
  Submitted: ['Under Review', 'Rejected', 'Needs More Information', 'Already Planned', 'Forwarded to Department'],
  'Under Review': ['Accepted', 'Rejected', 'Needs More Information', 'Already Planned', 'Forwarded to Department'],
  Accepted: ['Assigned', 'Rejected', 'Needs More Information'],
  Assigned: ['Implementation', 'Accepted'],
  Implementation: ['Implemented', 'Assigned'],
  Implemented: ['Closed', 'Implementation'],
  'Needs More Information': ['Under Review'],
  Rejected: ['Closed'],
  'Already Planned': ['Closed'],
  'Forwarded to Department': ['Assigned', 'Closed'],
  Closed: [],
};

// The staff member responsible for a suggestion may only drive it forward
// through the delivery steps. Review decisions (accept / reject / request
// information) stay with the review team.
const SUGGESTION_ASSIGNEE_TRANSITIONS = {
  Assigned: ['Implementation'],
  Implementation: ['Implemented', 'Assigned'],
};

// Base selects shared by list/detail (decoration resolved in separate queries).
const BASE_TICKET_SELECT = [
  'tickets.*',
  'requester.name as requester_name',
  'departments.name as department_name',
  'categories.name as category_name',
  'priorities.name as priority_name',
  'priorities.level as priority_level',
  'statuses.name as status_name',
  'assignee.name as assignee_name',
];

const BASE_SUGGESTION_SELECT = [
  'suggestions.*',
  'users.name as user_name',
  'departments.name as department_name',
  'statuses.name as status_name',
  'assigned_dept.name as assigned_department_name',
  'assignee.name as assignee_name',
];

function buildTicketQuery() {
  return db('tickets')
    .join('users as requester', 'tickets.requester_id', 'requester.id')
    .join('departments', 'tickets.department_id', 'departments.id')
    .join('categories', 'tickets.category_id', 'categories.id')
    .join('priorities', 'tickets.priority_id', 'priorities.id')
    .join('statuses', 'tickets.status_id', 'statuses.id')
    .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
    .select(BASE_TICKET_SELECT);
}

function buildSuggestionQuery() {
  return db('suggestions')
    .join('users', 'suggestions.user_id', 'users.id')
    .join('departments', 'suggestions.department_id', 'departments.id')
    .join('statuses', 'suggestions.status_id', 'statuses.id')
    .leftJoin('departments as assigned_dept', 'suggestions.assigned_department_id', 'assigned_dept.id')
    .leftJoin('users as assignee', 'suggestions.assigned_to', 'assignee.id')
    .select(BASE_SUGGESTION_SELECT);
}

/** Suggestion statuses available to the given actor from the current status. */
function allowedSuggestionStatuses(suggestion, user) {
  const role = user.role_name;
  if (role === 'admin' || role === 'sys_admin') {
    return SUGGESTION_TRANSITIONS[suggestion.status_name] || [];
  }
  if (isSuggestionAssignee(suggestion, user)) {
    return SUGGESTION_ASSIGNEE_TRANSITIONS[suggestion.status_name] || [];
  }
  // The author may only return an information-requested suggestion to review.
  if (suggestion.user_id === user.id && suggestion.status_name === 'Needs More Information') {
    return ['Under Review'];
  }
  return [];
}

function assertComment(comment, kind) {
  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    throw new HttpError(400, 'Comment is required');
  }
  if (comment.length > MAX_COMMENT_LENGTH[kind]) {
    // The suggestion endpoint has always reported both problems with the same
    // message, so the notification reply keeps that wording too.
    throw new HttpError(400, kind === 'ticket'
      ? `Comment must be at most ${MAX_COMMENT_LENGTH.ticket} characters`
      : 'Comment is required');
  }
}

/**
 * Full ticket detail for someone allowed to see it.
 * Work notes stay internal to the managing team.
 */
async function loadTicketPayload(ticketId, user) {
  const ticket = await buildTicketQuery()
    .where('tickets.id', ticketId)
    .select([...BASE_TICKET_SELECT,
      'requester.email as requester_email', 'requester.phone as requester_phone'])
    .first();

  if (!ticket) throw new HttpError(404, 'Ticket not found');
  if (!canViewTicket(ticket, user)) throw new HttpError(403, 'Insufficient permissions');

  const [comments, attachments, history, statuses] = await Promise.all([
    ticketCollab.listComments(ticket.id),
    ticketCollab.listAttachments(ticket.id),
    ticketCollab.listHistory(ticket.id),
    db('statuses').where('type', ticket.type).orderBy('sort_order'),
  ]);

  const workNotes = canManageTicket(ticket, user)
    ? await db('ticket_work_notes')
      .join('users', 'ticket_work_notes.user_id', 'users.id')
      .where('ticket_work_notes.ticket_id', ticket.id)
      .select('ticket_work_notes.*', 'users.name as user_name')
      .orderBy('ticket_work_notes.created_at', 'asc')
    : [];

  return { ticket, comments, attachments, history, statuses, workNotes };
}

/** Full suggestion detail for the author, the responsible staff member or a reviewer. */
async function loadSuggestionPayload(suggestionId, user) {
  const suggestion = await buildSuggestionQuery()
    .where('suggestions.id', suggestionId)
    .select([...BASE_SUGGESTION_SELECT, 'users.email as user_email'])
    .first();

  if (!suggestion) throw new HttpError(404, 'Suggestion not found');
  if (!canViewSuggestion(suggestion, user)) throw new HttpError(403, 'Insufficient permissions');

  const [comments, attachments, history, statuses] = await Promise.all([
    suggestionCollab.listComments(suggestion.id),
    suggestionCollab.listAttachments(suggestion.id),
    suggestionCollab.listHistory(suggestion.id),
    db('statuses').where('type', 'suggestion').orderBy('sort_order'),
  ]);

  // The workflow this particular viewer may apply, so every surface offers the
  // same choices the server will accept.
  const detail = { ...suggestion, allowed_statuses: allowedSuggestionStatuses(suggestion, user) };

  return { suggestion: detail, comments, attachments, history, statuses };
}

/**
 * Record a reply on a ticket: comment + history entry + a notification for the
 * other party, so the conversation is visible from both sides.
 */
async function replyToTicket(ticket, user, comment) {
  assertComment(comment, 'ticket');

  const commentId = await ticketCollab.addComment(ticket.id, user.id, comment);
  await ticketCollab.addHistory(ticket.id, user.id, 'comment_added', null, comment.substring(0, 100));

  const notifyUser = user.id === ticket.requester_id ? ticket.assigned_to : ticket.requester_id;
  if (notifyUser) {
    await createNotification(
      notifyUser,
      `New comment on ${ticket.ticket_number}`,
      comment.substring(0, 100),
      { type: 'ticket', id: ticket.id }
    );
  }

  return commentId;
}

/** Record a reply on a suggestion and notify everyone waiting on it. */
async function replyToSuggestion(suggestion, user, comment) {
  assertComment(comment, 'suggestion');

  const commentId = await suggestionCollab.addComment(suggestion.id, user.id, comment);
  await suggestionCollab.addHistory(suggestion.id, user.id, 'comment_added', null, comment.substring(0, 100));

  const entity = { type: 'suggestion', id: suggestion.id };
  const summary = comment.substring(0, 100);
  const recipients = new Set();

  if (suggestion.user_id && suggestion.user_id !== user.id) {
    recipients.add(suggestion.user_id);
  } else {
    // The author replied: the review team and the responsible staff member both
    // need to see it.
    const reviewers = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .whereIn('roles.name', ['admin', 'sys_admin'])
      .select('users.id');
    for (const r of reviewers) recipients.add(r.id);
    if (suggestion.assigned_to && suggestion.assigned_to !== user.id) {
      recipients.add(suggestion.assigned_to);
    }
  }

  for (const userId of recipients) {
    await createNotification(userId, `New comment on ${suggestion.suggestion_number}`, summary, entity);
  }

  return commentId;
}

module.exports = {
  ticketCollab,
  suggestionCollab,
  MAX_COMMENT_LENGTH,
  SUGGESTION_TRANSITIONS,
  SUGGESTION_ASSIGNEE_TRANSITIONS,
  BASE_TICKET_SELECT,
  BASE_SUGGESTION_SELECT,
  buildTicketQuery,
  buildSuggestionQuery,
  allowedSuggestionStatuses,
  loadTicketPayload,
  loadSuggestionPayload,
  replyToTicket,
  replyToSuggestion,
};
