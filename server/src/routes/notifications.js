const express = require('express');
const { body } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { HttpError, fail } = require('../utils/httpError');
const {
  loadTicketPayload,
  loadSuggestionPayload,
  replyToTicket,
  replyToSuggestion,
} = require('../services/tasks');

const router = express.Router();
router.use(authenticate);

const TICKET = 'ticket';
const SUGGESTION = 'suggestion';

// ── Per-user notification preferences ────────────────────────────────────────
// Category is derived from the linked entity type. Rows with no entity are
// system messages. Defaults keep every category on, so behaviour is unchanged
// until a user opts out.
const DEFAULT_PREFS = { tickets: true, suggestions: true, system: true };

function categoryOf(entityType) {
  if (entityType === TICKET) return 'tickets';
  if (entityType === SUGGESTION) return 'suggestions';
  return 'system';
}

async function getPrefs(userId) {
  const row = await db('user_preferences').where('user_id', userId).first();
  return { ...DEFAULT_PREFS, ...(row?.notification_prefs || {}) };
}

/** Restrict a notifications query to the categories the user has enabled. */
function applyPrefFilter(query, prefs) {
  const types = [];
  if (prefs.tickets) types.push(TICKET);
  if (prefs.suggestions) types.push(SUGGESTION);
  const includeSystem = !!prefs.system;
  if (types.length === 2 && includeSystem) return query;

  return query.where(function () {
    if (types.length) this.whereIn('entity_type', types);
    if (includeSystem) {
      if (types.length) this.orWhereNull('entity_type');
      else this.whereNull('entity_type');
    }
    if (types.length === 0 && !includeSystem) this.whereRaw('1 = 0');
  });
}

/**
 * A notification is addressed to exactly one user. Loading it is therefore also
 * the authorization check: nobody can read or answer someone else's notification
 * even when they can see the task it refers to.
 */
async function ownedNotification(req) {
  const notification = await db('notifications')
    .where({ id: req.params.id, user_id: req.user.id })
    .first();
  if (!notification) throw new HttpError(404, 'Notification not found');
  return notification;
}

/**
 * The task behind a notification. Reuses the task detail service, so the same
 * permission rules apply as on the task's own page: a notification never widens
 * what its recipient can see.
 */
async function notificationTask(notification, user) {
  if (!notification.entity_type || !notification.entity_id) return null;
  try {
    if (notification.entity_type === TICKET) {
      return await loadTicketPayload(notification.entity_id, user);
    }
    if (notification.entity_type === SUGGESTION) {
      return await loadSuggestionPayload(notification.entity_id, user);
    }
  } catch {
    // The task was deleted, or the recipient may no longer view it. The
    // notification itself stays readable either way.
    return null;
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const prefs = await getPrefs(req.user.id);
    let query = db('notifications').where('user_id', req.user.id);
    query = applyPrefFilter(query, prefs);
    const notifications = await query.orderBy('created_at', 'desc').limit(50);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const prefs = await getPrefs(req.user.id);
    let query = db('notifications').where({ user_id: req.user.id, is_read: false });
    query = applyPrefFilter(query, prefs);
    const result = await query.count('id as count').first();
    res.json({ count: parseInt(result.count) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    const prefs = await getPrefs(req.user.id);
    let query = db('notifications').where({ user_id: req.user.id, is_read: false });
    query = applyPrefFilter(query, prefs);
    await query.update({ is_read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Notification preferences (must precede the /:id route) ───────────────────
router.get('/preferences', async (req, res) => {
  try {
    res.json(await getPrefs(req.user.id));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/preferences', async (req, res) => {
  try {
    const current = await getPrefs(req.user.id);
    const incoming = req.body || {};
    const clean = {};
    for (const key of Object.keys(DEFAULT_PREFS)) {
      clean[key] = incoming[key] === undefined ? !!current[key] : !!incoming[key];
    }
    await db('user_preferences')
      .insert({ user_id: req.user.id, notification_prefs: clean, updated_at: new Date() })
      .onConflict('user_id')
      .merge({ notification_prefs: clean, updated_at: new Date() });
    res.json(clean);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Notification detail: the notification itself plus everything about the task it
 * refers to — description, submitter, submitted date, priority, status,
 * assignment, attachments, comments and the full history timeline — so the
 * recipient can act without leaving the page.
 */
router.get('/:id', async (req, res) => {
  try {
    const notification = await ownedNotification(req);
    const task = await notificationTask(notification, req.user);
    res.json({ notification, task });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * Reply from the notification detail page. The reply is recorded as a comment
 * on the task, added to its history and notified to the other party, so it is
 * visible from the task page and from the other user's notifications too.
 */
router.post('/:id/reply',
  body('comment').trim().isLength({ min: 1, max: 5000 }).withMessage('Comment is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const notification = await ownedNotification(req);
      const { comment } = req.body;

      if (!notification.entity_type || !notification.entity_id) {
        throw new HttpError(400, 'This notification is not linked to a request or suggestion');
      }

      let commentId;
      if (notification.entity_type === TICKET) {
        const ticket = await db('tickets').where('id', notification.entity_id).first();
        if (!ticket) throw new HttpError(404, 'Ticket not found');
        commentId = await replyToTicket(ticket, req.user, comment);
      } else if (notification.entity_type === SUGGESTION) {
        const suggestion = await db('suggestions').where('id', notification.entity_id).first();
        if (!suggestion) throw new HttpError(404, 'Suggestion not found');
        commentId = await replyToSuggestion(suggestion, req.user, comment);
      } else {
        throw new HttpError(400, 'This notification is not linked to a request or suggestion');
      }

      res.status(201).json({ id: commentId });
    } catch (error) {
      fail(res, error);
    }
  });

router.put('/:id/read', async (req, res) => {
  try {
    // Ownership-checked: users may only mark their own notifications as read.
    const updated = await db('notifications')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({ is_read: true });
    if (!updated) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
