const express = require('express');
const { body } = require('express-validator');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { generateSuggestionNumber, createNotification } = require('../utils/helpers');
const { validate } = require('../utils/validate');
const { createUploadMiddleware, uploadAttachments } = require('../services/collaboration');
const {
  suggestionCollab: collab,
  SUGGESTION_TRANSITIONS,
  allowedSuggestionStatuses,
  buildSuggestionQuery,
  loadSuggestionPayload,
  replyToSuggestion,
} = require('../services/tasks');
const { fail } = require('../utils/httpError');
const {
  canViewSuggestion,
  isSuggestionAssignee,
} = require('../utils/permissions');

const router = express.Router();
router.use(authenticate);

const createUpload = createUploadMiddleware('attachments');

function isAdminUser(role) {
  return ['admin', 'sys_admin'].includes(role);
}

// GET all suggestions (with filters)
router.get('/', async (req, res) => {
  try {
    const {
      status, search, department, assigned_department, assigned_to, date,
      page = 1, limit = 20,
    } = req.query;

    const safeLimit = Math.min(parseInt(limit, 10) || 20, 500);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);

    let query = buildSuggestionQuery();

    // Only admin/sys_admin may list other people's suggestions. Non-admins
    // (including technicians and supervisors) only see their own — consistent
    // with the detail view, so the list does not leak private data.
    if (!isAdminUser(req.user.role_name)) {
      query = query.where('suggestions.user_id', req.user.id);
    }

    if (status) query = query.where('statuses.name', status);
    if (department) query = query.where('departments.name', department);
    if (assigned_department) query = query.where('assigned_dept.name', assigned_department);
    if (assigned_to) query = query.where('suggestions.assigned_to', assigned_to);
    if (date) query = query.whereRaw('suggestions.created_at::date = ?', [date]);
    if (search) {
      query = query.where(function () {
        this.where('suggestions.suggestion_number', 'ilike', `%${search}%`)
          .orWhere('suggestions.title', 'ilike', `%${search}%`)
          .orWhere('users.name', 'ilike', `%${search}%`);
      });
    }

    const countResult = await query.clone().clearSelect().count('suggestions.id as total').first();
    const suggestions = await query.orderBy('suggestions.created_at', 'desc').limit(safeLimit).offset((safePage - 1) * safeLimit);

    res.json({ suggestions, total: parseInt(countResult.total), page: safePage, limit: safeLimit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single suggestion (detail with comments, history, attachments)
router.get('/:id', async (req, res) => {
  try {
    res.json(await loadSuggestionPayload(req.params.id, req.user));
  } catch (error) {
    fail(res, error);
  }
});

// POST create suggestion
router.post('/',
  createUpload,
  body('title').trim().isLength({ min: 2, max: 255 }).withMessage('Title must be 2-255 characters'),
  body('department_id').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid department'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { title, problem, proposed_solution, expected_benefit, department_id } = req.body;

      if (department_id !== undefined && department_id !== null) {
        const dept = await db('departments').where('id', department_id).first();
        if (!dept) return res.status(400).json({ message: 'Invalid department' });
      }

      const suggestionNumber = await generateSuggestionNumber();
      const status = await db('statuses').where({ name: 'Submitted', type: 'suggestion' }).first();

      const [suggestionRow] = await db('suggestions')
        .insert({
          suggestion_number: suggestionNumber,
          user_id: req.user.id,
          department_id: department_id || req.user.department_id,
          title,
          problem,
          proposed_solution,
          expected_benefit,
          status_id: status?.id,
        })
        .returning('id');
      const id = suggestionRow.id;

      if (req.files && req.files.length > 0) {
        await collab.addAttachments(id, req.files);
      }

      await collab.addHistory(id, req.user.id, 'created', null, `${suggestionNumber} created with status Submitted`);

      // Notify admins
      const admins = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .whereIn('roles.name', ['admin', 'sys_admin'])
        .select('users.id');

      for (const a of admins) {
        await createNotification(a.id, `New suggestion: ${suggestionNumber}`, title, { type: 'suggestion', id });
      }

      res.status(201).json({ id, suggestion_number: suggestionNumber });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// PUT update suggestion: admins drive the workflow, authors provide requested information
router.put('/:id',
  body('status_id').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid status'),
  body('assigned_department_id').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid department'),
  body('assigned_to').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid assignee'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const suggestion = await buildSuggestionQuery()
        .where('suggestions.id', req.params.id)
        .first();
      if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

      const { status_id, assigned_department_id, assigned_to } = req.body;
      const updates = { updated_at: new Date() };
      const entity = { type: 'suggestion', id: suggestion.id };

      if (!isAdminUser(req.user.role_name)) {
        // The author may only return an information-requested suggestion to
        // review; the responsible staff member may only drive their assigned
        // suggestion forward through delivery steps.
        const isAssignee = isSuggestionAssignee(suggestion, req.user);
        const isAuthor = suggestion.user_id === req.user.id;
        const forbidden = isAssignee && !isAuthor
          ? 'You can only move your assigned suggestion through its workflow'
          : 'You can only provide the requested information';

        if (!isAssignee && !isAuthor) {
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
        if (status_id === undefined || assigned_department_id !== undefined || assigned_to !== undefined) {
          return res.status(403).json({ message: forbidden });
        }
        const target = await db('statuses').where('id', status_id).first();
        const allowed = target && target.type === 'suggestion'
          ? allowedSuggestionStatuses(suggestion, req.user)
          : [];
        if (!target || !allowed.includes(target.name)) {
          return res.status(403).json({
            message: isAssignee && !isAuthor
              ? `You cannot move an assigned suggestion from "${suggestion.status_name}" to ${target?.name || 'that status'}`
              : 'You can only send a suggestion awaiting information back to Under Review',
          });
        }
        updates.status_id = target.id;
      } else {
        if (status_id !== undefined) {
          const target = await db('statuses').where('id', status_id).first();
          if (!target || target.type !== 'suggestion') {
            return res.status(400).json({ message: 'Invalid suggestion status' });
          }
          const allowed = SUGGESTION_TRANSITIONS[suggestion.status_name] || [];
          if (!allowed.includes(target.name)) {
            return res.status(400).json({ message: `Cannot move a suggestion from ${suggestion.status_name} to ${target.name}` });
          }
          updates.status_id = target.id;
        }
        if (assigned_department_id !== undefined) {
          updates.assigned_department_id = assigned_department_id === null ? null : assigned_department_id;
          if (assigned_department_id !== null) {
            const dept = await db('departments').where('id', assigned_department_id).first();
            if (!dept) return res.status(400).json({ message: 'Invalid department' });
          }
        }
        if (assigned_to !== undefined) {
          updates.assigned_to = assigned_to === null ? null : assigned_to;
          if (assigned_to !== null) {
            const assignee = await db('users').where('id', assigned_to).first();
            if (!assignee) return res.status(400).json({ message: 'Invalid assignee' });
            if (!assignee.is_active) return res.status(400).json({ message: 'Assignee must be an active user' });
          }
        }
      }

      await db('suggestions').where('id', suggestion.id).update(updates);

      if (status_id !== undefined) {
        const target = await db('statuses').where('id', updates.status_id).first();
        const provided = suggestion.status_name === 'Needs More Information' && target?.name === 'Under Review';
        await collab.addHistory(
          suggestion.id,
          req.user.id,
          provided ? 'information_provided' : 'status_changed',
          suggestion.status_name,
          target?.name
        );
        await createNotification(suggestion.user_id, `Suggestion ${suggestion.suggestion_number} updated`, `Status changed to ${target?.name}`, entity);
        // The staff member responsible for the suggestion follows its progress too.
        if (suggestion.assigned_to && suggestion.assigned_to !== req.user.id) {
          await createNotification(
            suggestion.assigned_to,
            `Suggestion ${suggestion.suggestion_number} updated`,
            `Status changed to ${target?.name}`,
            entity
          );
        }
      }

      if (assigned_department_id !== undefined) {
        const newDept = assigned_department_id === null ? null : (await db('departments').where('id', assigned_department_id).first())?.name;
        await collab.addHistory(
          suggestion.id,
          req.user.id,
          'assigned_department_changed',
          suggestion.assigned_department_name,
          newDept
        );
        await createNotification(
          suggestion.user_id,
          `Suggestion ${suggestion.suggestion_number} assigned`,
          newDept ? `Assigned to department: ${newDept}` : 'Assigned department cleared',
          entity
        );
      }

      if (assigned_to !== undefined) {
        const newAssignee = assigned_to === null ? null : (await db('users').where('id', assigned_to).first())?.name;
        await collab.addHistory(
          suggestion.id,
          req.user.id,
          'assigned_person_changed',
          suggestion.assignee_name,
          newAssignee
        );
        await createNotification(
          suggestion.user_id,
          `Suggestion ${suggestion.suggestion_number} assigned`,
          newAssignee ? `Responsible staff: ${newAssignee}` : 'Responsible staff cleared',
          entity
        );
        if (assigned_to !== null && assigned_to !== suggestion.user_id && assigned_to !== req.user.id) {
          await createNotification(assigned_to, `Suggestion ${suggestion.suggestion_number} assigned to you`, suggestion.title, entity);
        }
      }

      res.json({ message: 'Suggestion updated' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// POST add comment / reply (author, responsible staff or reviewer)
router.post('/:id/comments',
  body('comment').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { comment } = req.body;

      const suggestion = await db('suggestions').where('id', req.params.id).first();
      if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

      if (!canViewSuggestion(suggestion, req.user)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const commentId = await replyToSuggestion(suggestion, req.user, comment);

      res.status(201).json({ id: commentId });
    } catch (error) {
      fail(res, error);
    }
  });

// POST add attachment
// Authorization is checked BEFORE multer parses/stores the upload so files are
// never written to disk for unauthorized requests.
router.post('/:id/attachments',
  async (req, res, next) => {
    try {
      const suggestion = await db('suggestions').where('id', req.params.id).first();
      if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

      if (!canViewSuggestion(suggestion, req.user)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

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

// GET download attachment (authenticated - author, responsible staff or reviewer)
router.get('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const suggestion = await db('suggestions').where('id', req.params.id).first();
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    if (!canViewSuggestion(suggestion, req.user)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const attachment = await collab.getAttachment(req.params.id, req.params.attachmentId);
    collab.streamAttachment(res, attachment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE attachment (author or admin - the responsible staff member adds
// supporting documents but does not remove the submitter's own files)
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const suggestion = await db('suggestions').where('id', req.params.id).first();
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

    const isAdmin = isAdminUser(req.user.role_name);
    if (!isAdmin && suggestion.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

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