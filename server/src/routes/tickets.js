const express = require('express');
const { body } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { generateTicketNumber, createNotification } = require('../utils/helpers');
const { validate } = require('../utils/validate');
const { createUploadMiddleware, uploadAttachments } = require('../services/collaboration');
const {
  ticketCollab: collab,
  buildTicketQuery,
  loadTicketPayload,
  replyToTicket,
} = require('../services/tasks');
const { fail } = require('../utils/httpError');
const { getSettingsMap, getSetting, toBool } = require('../utils/settings');
const {
  canManageTicket,
  canViewTicket,
  canAssign,
  canControlTicket,
  scopeTicketQuery,
} = require('../utils/permissions');

const router = express.Router();
router.use(authenticate);

const createUpload = createUploadMiddleware('attachments');

// Statuses that already carry a dedicated requester notification below, so the
// generic "your ticket moved" notification never duplicates them.
const STATUSES_WITH_OWN_NOTIFICATION = ['Resolved', 'Completed', 'Waiting for Information'];
// Progress statuses the requester is told about even though nobody is waiting
// on them (assignment notifications cover "Assigned").
const PROGRESS_STATUSES = ['In Progress', 'Inspection', 'Waiting for Parts', 'Closed'];

// GET all tickets (with filters)
router.get('/', async (req, res) => {
  try {
    const {
      type, status, priority, department, category, search, assigned_to, requester_id,
      location, date,
      page = 1, limit = 20,
    } = req.query;

    const safeLimit = Math.min(parseInt(limit, 10) || 20, 500);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);

    let query = scopeTicketQuery(buildTicketQuery(), req.user);

    if (type) query = query.where('tickets.type', type);
    if (status) query = query.where('statuses.name', status);
    if (priority) query = query.where('priorities.name', priority);
    if (department) query = query.where('departments.name', department);
    if (category) query = query.where('categories.name', category);
    if (assigned_to) query = query.where('tickets.assigned_to', assigned_to);
    if (requester_id) query = query.where('tickets.requester_id', requester_id);
    if (location) query = query.where('tickets.location', 'ilike', `%${location}%`);
    if (date) query = query.whereRaw('tickets.created_at::date = ?', [date]);
    if (search) {
      query = query.where(function () {
        this.where('tickets.ticket_number', 'ilike', `%${search}%`)
          .orWhere('tickets.title', 'ilike', `%${search}%`)
          .orWhere('requester.name', 'ilike', `%${search}%`);
      });
    }

    const countResult = await query.clone().clearSelect().count('tickets.id as total').first();
    const tickets = await query.orderBy('tickets.created_at', 'desc').limit(safeLimit).offset((safePage - 1) * safeLimit);

    res.json({ tickets, total: parseInt(countResult.total), page: safePage, limit: safeLimit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single ticket (full detail: comments, attachments, history, statuses)
router.get('/:id', async (req, res) => {
  try {
    res.json(await loadTicketPayload(req.params.id, req.user));
  } catch (error) {
    fail(res, error);
  }
});

// POST create ticket
router.post('/',
  createUpload,
  body('type').isIn(['it', 'maintenance']).withMessage('Type must be it or maintenance'),
  body('category_id').isInt({ min: 1 }).withMessage('A valid category is required'),
  body('title').trim().isLength({ min: 2, max: 255 }).withMessage('Title must be 2-255 characters'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { type, category_id, title, description, location, contact_info, equipment_name, priority } = req.body;

      const category = await db('categories').where('id', category_id).first();
      if (!category || category.type !== type) {
        if (Array.isArray(req.files)) {
          for (const f of req.files) { try { require('fs').unlinkSync(f.path); } catch (e) { /* best effort */ } }
        }
        return res.status(400).json({ message: 'Category must belong to the selected ticket type' });
      }

      const ticketNumber = await generateTicketNumber(type);
      const statusName = 'New';
      const status = await db('statuses').where({ name: statusName, type }).first();

      // Priorities are a fixed reference set. Rejecting unknown names here keeps
      // the priorities join (used by lists and the dashboard) valid — a ticket
      // with a NULL priority_id would be dropped by the inner joins elsewhere.
      const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
      const priorityName = priority || 'Medium';
      if (!VALID_PRIORITIES.includes(priorityName)) {
        if (Array.isArray(req.files)) {
          for (const f of req.files) { try { require('fs').unlinkSync(f.path); } catch (e) { /* best effort */ } }
        }
        return res.status(400).json({ message: 'Invalid priority' });
      }
      const priorityRecord = await db('priorities').where('name', priorityName).first();

      const [ticketRow] = await db('tickets')
        .insert({
          ticket_number: ticketNumber,
          type,
          requester_id: req.user.id,
          department_id: req.user.department_id,
          category_id,
          priority_id: priorityRecord?.id,
          status_id: status?.id,
          title,
          description,
          location,
          contact_info,
          equipment_name,
        })
        .returning('id');
      const ticketId = ticketRow.id;

      if (req.files && req.files.length > 0) {
        await collab.addAttachments(ticketId, req.files);
      }

      await collab.addHistory(ticketId, req.user.id, 'created', null, `Ticket created with status ${statusName}`);

      const supervisorRole = type === 'it' ? 'it_supervisor' : 'maintenance_supervisor';
      const supervisors = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .where('roles.name', supervisorRole)
        .select('users.id');

      for (const s of supervisors) {
        await createNotification(
          s.id,
          `New ${type.toUpperCase()} ticket: ${ticketNumber}`,
          `${ticketNumber} - ${title}`,
          { type: 'ticket', id: ticketId }
        );
      }

      // Optional alert when a critical request is raised (off unless enabled).
      if (priorityName === 'Critical' && toBool(await getSetting('notify_new_critical', 'false'), false)) {
        const admins = await db('users')
          .join('roles', 'users.role_id', 'roles.id')
          .whereIn('roles.name', ['admin', 'sys_admin'])
          .select('users.id');
        for (const a of admins) {
          await createNotification(
            a.id,
            `Critical ${type.toUpperCase()} ticket: ${ticketNumber}`,
            `${ticketNumber} - ${title}`,
            { type: 'ticket', id: ticketId }
          );
        }
      }

      res.status(201).json({ id: ticketId, ticket_number: ticketNumber });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// PUT update ticket (assign, prioritize, status, fields, resolution)
// Workflow (IT): New -> Assigned -> In Progress -> Waiting for Information -> Resolved -> Closed
router.put('/:id', async (req, res) => {
  try {
    const ticket = await db('tickets').where('id', req.params.id).first();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const role = req.user.role_name;
    const oldStatus = await db('statuses').where('id', ticket.status_id).first();
    const oldStatusName = oldStatus?.name || '';

    const isRequester = ticket.requester_id === req.user.id;
    const canManage = canManageTicket(ticket, req.user);
    const isTechnicianRole = role === 'it_staff' || role === 'maintenance_staff';

    if (!canManage && !isRequester) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { assigned_to, priority_id, status_id, title, description, location, resolution_note } = req.body;

    // Normalize the UI's "Unassigned" (empty string) to a real null so the FK
    // and notification logic below never see an empty-string assignee.
    const assignId = assigned_to === '' || assigned_to === null ? null : assigned_to;

    const hasControlFields = assignId !== undefined ||
      priority_id !== undefined ||
      title !== undefined || description !== undefined || location !== undefined;

    // Requesters who are not part of the managing team may NOT assign/prioritize/edit.
    if (!canManage && isRequester && hasControlFields) {
      return res.status(403).json({ message: 'Requesters can only confirm, reopen, or provide information on their own tickets' });
    }

    // Technicians may only update the status of a ticket assigned to them.
    if (canManage && isTechnicianRole && hasControlFields) {
      return res.status(403).json({ message: 'Technicians can only update the status of an assigned ticket' });
    }

    if (assignId !== undefined && !canAssign(role)) {
      return res.status(403).json({ message: 'Only supervisors and administrators can assign tickets' });
    }
    if (priority_id !== undefined && !canControlTicket(role)) {
      return res.status(403).json({ message: 'Only supervisors and administrators can change priority' });
    }
    if (priority_id !== undefined) {
      const prio = await db('priorities').where('id', priority_id).first();
      if (!prio) return res.status(400).json({ message: 'Invalid priority' });
    }

    // ── Reference-integrity validation (workflow rules applied via the API) ──
    // Statuses must belong to the ticket's workflow type (no cross-type status
    // injection, e.g. a maintenance status on an IT ticket).
    let targetStatus = null;
    if (status_id !== undefined) {
      targetStatus = await db('statuses').where('id', status_id).first();
      if (!targetStatus || targetStatus.type !== ticket.type) {
        return res.status(400).json({ message: 'Invalid status for this ticket type' });
      }
    }
    // Assignees must be an active member of the managing team (no assigning a
    // ticket to staff, the other team, or a deactivated account).
    if (assignId !== undefined && assignId !== null && assignId !== ticket.assigned_to) {
      const assignee = await db('users').where('id', assignId).first();
      if (!assignee || !assignee.is_active) {
        return res.status(400).json({ message: 'Assignee must be an active user' });
      }
      const assigneeRole = await db('roles').where('id', assignee.role_id).first();
      const allowedRoles = ticket.type === 'it'
        ? ['it_staff', 'it_supervisor']
        : ['maintenance_staff', 'maintenance_supervisor'];
      if (!allowedRoles.includes(assigneeRole?.name)) {
        return res.status(400).json({ message: 'Assignee must be a member of the managing team' });
      }
    }

    const updates = {};

    const settings = await getSettingsMap();
    const requireResolutionNotes = toBool(settings.require_resolution_notes, true);
    const allowRequesterClosure = toBool(settings.allow_requester_closure, true);

    // ── Requester status transitions ──────────────────────────────────────────
    // Confirm solved (Resolved/Completed -> Closed), not solved (-> In Progress),
    // reopen (Closed -> In Progress), or provide requested info (WFI -> In Progress).
    if (isRequester && status_id !== undefined) {
      const targetName = targetStatus?.name;
      const requesterTransitions = {
        Resolved: allowRequesterClosure ? ['Closed', 'In Progress'] : ['In Progress'],
        Completed: allowRequesterClosure ? ['Closed', 'In Progress'] : ['In Progress'],
        Closed: ['In Progress'],
        'Waiting for Information': ['In Progress'],
      };
      const allowed = (requesterTransitions[oldStatusName] || []).includes(targetName);
      if (!allowed) {
        return res.status(403).json({ message: 'Requesters can only confirm a resolved ticket, reopen a closed one, or provide information when asked' });
      }
    }

    // ── Technician workflow guard ───────────────────────────────────────────
    // Technicians can only move an assigned ticket forward through their
    // team's workflow. IT and maintenance use different status sets.
    if (canManage && isTechnicianRole && status_id !== undefined && status_id !== ticket.status_id) {
      const targetName = targetStatus?.name;
      const workflow = ticket.type === 'it'
        ? { from: ['New', 'Assigned', 'In Progress', 'Waiting for Information'], to: ['In Progress', 'Waiting for Information', 'Resolved'] }
        : { from: ['New', 'Assigned', 'Inspection', 'In Progress', 'Waiting for Parts'], to: ['Inspection', 'In Progress', 'Waiting for Parts', 'Completed'] };
      if (!workflow.from.includes(oldStatusName) || !workflow.to.includes(targetName)) {
        return res.status(403).json({ message: `Workflow does not allow moving from "${oldStatusName}" to "${targetName}"` });
      }
    }

    if (status_id !== undefined && status_id !== ticket.status_id) {
      const newStatusName = targetStatus?.name;
      const trimmedNote = typeof resolution_note === 'string' ? resolution_note.trim() : '';
      const isResolving = ['Resolved', 'Completed'].includes(newStatusName);
      const isReopening = newStatusName === 'In Progress' && ['Resolved', 'Completed', 'Closed'].includes(oldStatusName);
      const entity = { type: 'ticket', id: ticket.id };

      // Technicians must record a resolution description when resolving/completing a ticket.
      if (isResolving && isTechnicianRole && requireResolutionNotes && !trimmedNote) {
        return res.status(400).json({ message: 'A resolution description is required when resolving a ticket' });
      }

      updates.status_id = status_id;
      await collab.addHistory(req.params.id, req.user.id, 'status_changed', oldStatusName, newStatusName);

      if (isResolving) {
        if (trimmedNote) {
          updates.resolution_notes = trimmedNote;
          await collab.addHistory(req.params.id, req.user.id, 'resolved', null, trimmedNote);
        }
        updates.resolved_date = new Date();
        await createNotification(ticket.requester_id, `Ticket ${ticket.ticket_number} - ${newStatusName}`, `Your ${ticket.type.toUpperCase()} ticket has been marked as ${newStatusName}. Please confirm if the issue is resolved.`, entity);
      }

      if (isReopening) {
        updates.resolved_date = null;
        updates.closed_date = null;
        await collab.addHistory(req.params.id, req.user.id, 'reopened', oldStatusName, 'In Progress');
        const assignedUser = ticket.assigned_to;
        if (assignedUser) {
          await createNotification(assignedUser, `Ticket ${ticket.ticket_number} reopened`, 'The ticket has been moved back to In Progress.', entity);
        }
      }

      if (newStatusName === 'Closed') {
        updates.closed_date = new Date();
        await collab.addHistory(req.params.id, req.user.id, 'closed', oldStatusName, 'Closed');
      }

      if (newStatusName === 'Waiting for Information') {
        await createNotification(ticket.requester_id, `Ticket ${ticket.ticket_number} - Waiting for Information`, 'The team needs more information from you. Please add a comment to update the ticket.', entity);
      }

      if (newStatusName === 'In Progress' && oldStatusName === 'Waiting for Information') {
        const assignedUser = ticket.assigned_to;
        if (assignedUser) {
          await createNotification(assignedUser, `Ticket ${ticket.ticket_number} - information provided`, 'Additional information has been provided by the requester. Please continue working on the ticket.', entity);
        }
      }

      // Keep the requester following their own ticket: progress steps are
      // reported once, statuses with a dedicated message above are skipped.
      const requesterFollows = PROGRESS_STATUSES.includes(newStatusName) &&
        !STATUSES_WITH_OWN_NOTIFICATION.includes(newStatusName);
      if (requesterFollows && ticket.requester_id && ticket.requester_id !== req.user.id) {
        await createNotification(
          ticket.requester_id,
          `Ticket ${ticket.ticket_number} - ${newStatusName}`,
          `Your ${ticket.type.toUpperCase()} ticket is now ${newStatusName}.`,
          entity
        );
      }
    }

    if (assignId !== undefined && assignId !== ticket.assigned_to) {
      const assignStatus = await db('statuses').where({ name: 'Assigned', type: ticket.type }).first();
      if (assignStatus && assignStatus.id !== ticket.status_id) {
        updates.status_id = assignStatus.id;
        await collab.addHistory(req.params.id, req.user.id, 'status_changed', oldStatusName, assignStatus.name);
      }
      const oldAssignee = ticket.assigned_to ? await db('users').where('id', ticket.assigned_to).first() : null;
      const newAssignee = assignId ? await db('users').where('id', assignId).first() : null;
      updates.assigned_to = assignId;
      const action = oldAssignee ? 'reassigned' : 'assigned';
      await collab.addHistory(req.params.id, req.user.id, action, oldAssignee?.name || null, newAssignee?.name || null);
      const entity = { type: 'ticket', id: ticket.id };
      if (assignId) {
        await createNotification(assignId, 'Ticket assigned to you', `${ticket.ticket_number} has been assigned to you. Please review and take action.`, entity);
        if (ticket.requester_id !== req.user.id && ticket.requester_id !== assignId) {
          await createNotification(
            ticket.requester_id,
            `Ticket ${ticket.ticket_number} assigned`,
            newAssignee
              ? `${oldAssignee ? 'Reassigned' : 'Assigned'} to ${newAssignee.name}.`
              : 'The ticket no longer has an assignee.',
            entity
          );
        }
      }
    }

    if (priority_id !== undefined && priority_id !== ticket.priority_id) {
      const oldPriority = await db('priorities').where('id', ticket.priority_id).first();
      const newPriority = await db('priorities').where('id', priority_id).first();
      updates.priority_id = priority_id;
      await collab.addHistory(req.params.id, req.user.id, 'priority_changed', oldPriority?.name || null, newPriority?.name || null);
    }

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;

    await db('tickets').where('id', req.params.id).update({ ...updates, updated_at: new Date() });

    res.json({ message: 'Ticket updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add comment / reply
router.post('/:id/comments',
  body('comment').trim().isLength({ min: 1, max: 5000 }).withMessage('Comment is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const ticket = await db('tickets').where('id', req.params.id).first();
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      if (!canViewTicket(ticket, req.user)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const commentId = await replyToTicket(ticket, req.user, req.body.comment);

      res.status(201).json({ id: commentId });
    } catch (error) {
      fail(res, error);
    }
  });

// POST add work notes (internal - managing team only)
router.post('/:id/work-notes', async (req, res) => {
  try {
    const { notes, parts_used } = req.body;
    if (!notes || !String(notes).trim()) return res.status(400).json({ message: 'Notes are required' });
    if (typeof notes !== 'string' || notes.length > 5000) {
      return res.status(400).json({ message: 'Work notes must be at most 5000 characters' });
    }

    const ticket = await db('tickets').where('id', req.params.id).first();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canManageTicket(ticket, req.user)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const [noteRow] = await db('ticket_work_notes')
      .insert({ ticket_id: req.params.id, user_id: req.user.id, notes, parts_used })
      .returning('id');
    const noteId = noteRow.id;

    await collab.addHistory(req.params.id, req.user.id, 'work_notes_added', null, notes.substring(0, 100));

    res.status(201).json({ id: noteId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add attachment
// Authorization is checked BEFORE multer parses/stores the upload so files are
// never written to disk for unauthorized requests.
router.post('/:id/attachments',
  async (req, res, next) => {
    try {
      const ticket = await db('tickets').where('id', req.params.id).first();
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      const canUpload = canManageTicket(ticket, req.user) || ticket.requester_id === req.user.id;
      if (!canUpload) return res.status(403).json({ message: 'Insufficient permissions' });
      req._uploadTicket = ticket;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  uploadAttachments,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      await collab.addAttachments(req.params.id, req.files);
      await collab.addHistory(
        req.params.id,
        req.user.id,
        'attachment_added',
        null,
        req.files.map((f) => f.originalname).join(', ').substring(0, 200)
      );

      res.status(201).json({ message: 'Attachments uploaded' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// GET download attachment (authenticated - the ticket must be viewable)
router.get('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const ticket = await db('tickets').where('id', req.params.id).first();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!canViewTicket(ticket, req.user)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const attachment = await collab.getAttachment(req.params.id, req.params.attachmentId);
    collab.streamAttachment(res, attachment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE attachment (admins/managers or the requester who owns the ticket)
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const ticket = await db('tickets').where('id', req.params.id).first();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const canDelete = canManageTicket(ticket, req.user) || ticket.requester_id === req.user.id;
    if (!canDelete) return res.status(403).json({ message: 'Insufficient permissions' });

    const removed = await collab.removeAttachment(req.params.id, req.params.attachmentId);
    if (!removed) return res.status(404).json({ message: 'Attachment not found' });

    await collab.addHistory(req.params.id, req.user.id, 'attachment_removed', null, null);
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;