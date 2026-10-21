/**
 * Centralized role-based permission rules for tickets and management actions.
 * Enforced on the backend in routes; the UI is only a convenience layer.
 */

const TEAM_BY_ROLE = {
  it_staff: 'it',
  it_supervisor: 'it',
  maintenance_staff: 'maintenance',
  maintenance_supervisor: 'maintenance',
};

const MANAGER_ROLES = ['it_supervisor', 'maintenance_supervisor', 'admin', 'sys_admin'];
const REVIEWER_ROLES = ['admin', 'sys_admin'];

function isTechnician(role) {
  return role === 'it_staff' || role === 'maintenance_staff';
}

function isSupervisor(role) {
  return role === 'it_supervisor' || role === 'maintenance_supervisor';
}

function isReviewer(role) {
  return REVIEWER_ROLES.includes(role);
}

function isSysAdmin(role) {
  return role === 'sys_admin';
}

function isAdmin(role) {
  return role === 'admin' || role === 'sys_admin';
}

/** Does this role match the ticket's team type (it / maintenance)? */
function teamMatches(role, type) {
  return TEAM_BY_ROLE[role] === type;
}

/**
 * Full operational control over a specific ticket (assign, priority, work notes...).
 * - Technicians: only tickets assigned to them, of their team type.
 * - Supervisors: their team type.
 * - Admin / sys_admin: anything.
 */
function canManageTicket(ticket, user) {
  const role = user.role_name;
  if (isAdmin(role)) return true;
  if (isSupervisor(role)) return teamMatches(role, ticket.type);
  if (isTechnician(role)) {
    return teamMatches(role, ticket.type) && ticket.assigned_to === user.id;
  }
  return false;
}

/** Who may see a ticket (list row or detail). */
function canViewTicket(ticket, user) {
  if (canManageTicket(ticket, user)) return true;
  return ticket.requester_id === user.id || ticket.assigned_to === user.id;
}

/** Only supervisors and admins may assign tickets. */
function canAssign(role) {
  return isSupervisor(role) || isAdmin(role);
}

/** Only supervisors and admins may change priority or edit ticket fields. */
function canControlTicket(role) {
  return isSupervisor(role) || isAdmin(role);
}

/** Can view a suggestion detail / comment on it: author, responsible staff or reviewer. */
function canViewSuggestion(suggestion, user) {
  if (isAdmin(user.role_name)) return true;
  return suggestion.user_id === user.id || suggestion.assigned_to === user.id;
}

/** May act on a suggestion as the person responsible for delivering it. */
function isSuggestionAssignee(suggestion, user) {
  return Boolean(suggestion.assigned_to) && suggestion.assigned_to === user.id;
}

/**
 * Apply a role's default queue visibility to a ticket query.
 * - staff:             own requests
 * - it/maintenance staff: tickets of their type assigned to them
 * - it/maintenance supervisor: their team's tickets
 * - admin / sys_admin: everything
 * Returns the (possibly modified) query builder.
 */
function scopeTicketQuery(query, user) {
  const role = user.role_name;
  if (role === 'staff') {
    return query.where('tickets.requester_id', user.id);
  }
  if (role === 'it_staff' || role === 'maintenance_staff') {
    return query.where('tickets.type', role === 'it_staff' ? 'it' : 'maintenance')
      .where('tickets.assigned_to', user.id);
  }
  if (role === 'it_supervisor') {
    return query.where('tickets.type', 'it');
  }
  if (role === 'maintenance_supervisor') {
    return query.where('tickets.type', 'maintenance');
  }
  return query;
}

/** Roles allowed to manage user accounts / departments / categories / roles / settings. */
function canManageSystem(role) {
  return isSysAdmin(role);
}

module.exports = {
  TEAM_BY_ROLE,
  MANAGER_ROLES,
  REVIEWER_ROLES,
  isTechnician,
  isSupervisor,
  isReviewer,
  isSysAdmin,
  isAdmin,
  teamMatches,
  canManageTicket,
  canViewTicket,
  canAssign,
  canControlTicket,
  canViewSuggestion,
  isSuggestionAssignee,
  canManageSystem,
  scopeTicketQuery,
};