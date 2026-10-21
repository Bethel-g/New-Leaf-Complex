const db = require('../config/db');

async function generateTicketNumber(type) {
  const prefix = { it: 'IT', maintenance: 'MT', suggestion: 'S' }[type];
  if (!prefix) throw new Error('Invalid ticket type');

  const last = await db('tickets')
    .where('type', type)
    .orderBy('id', 'desc')
    .first();

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.ticket_number.replace(prefix + '-', ''), 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

async function generateSuggestionNumber() {
  const last = await db('suggestions').orderBy('id', 'desc').first();
  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.suggestion_number.replace('S-', ''), 10);
    nextNum = lastNum + 1;
  }
  return `S-${String(nextNum).padStart(4, '0')}`;
}

async function addTicketHistory(ticketId, userId, action, oldValue, newValue) {
  await db('ticket_history').insert({
    ticket_id: ticketId,
    user_id: userId,
    action,
    old_value: oldValue || null,
    new_value: newValue || null,
  });
}

/**
 * Create a notification for one user.
 *
 * `entity` optionally links the notification to the task it is about:
 * `{ type: 'ticket', id: 12 }` or `{ type: 'suggestion', id: 3 }`. Linked
 * notifications open a detail view with the full task and allow replying
 * without hunting for the right page.
 */
async function createNotification(userId, title, message, entity = null) {
  const row = { user_id: userId, title, message };
  if (entity && entity.type && entity.id) {
    row.entity_type = entity.type;
    row.entity_id = entity.id;
  }
  await db('notifications').insert(row);
}

module.exports = { generateTicketNumber, generateSuggestionNumber, addTicketHistory, createNotification };
