const express = require('express');
const { body } = require('express-validator');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../utils/validate');

const router = express.Router();
router.use(authenticate);

// ──────────────────────────────────────────────────────────────────────────────
// Reference data — readable by any authenticated user (forms, filters)
// ──────────────────────────────────────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    let query = db('categories');
    if (type) query = query.where('type', type);
    const categories = await query.orderBy('type').orderBy('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/priorities', async (req, res) => {
  try {
    const priorities = await db('priorities').orderBy('level');
    res.json(priorities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/statuses', async (req, res) => {
  try {
    const { type } = req.query;
    let query = db('statuses');
    if (type) query = query.where('type', type);
    const statuses = await query.orderBy('sort_order');
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Non-sensitive branding settings any signed-in user may read (header, reports).
const PUBLIC_SETTING_KEYS = [
  'system_name', 'hospital_name', 'hospital_address', 'hospital_phone', 'hospital_email',
];

router.get('/public-settings', async (req, res) => {
  try {
    const rows = await db('system_settings')
      .whereIn('key', PUBLIC_SETTING_KEYS)
      .select('key', 'value');
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Management lists — admin + sys_admin (read-only for hospital admin)
// ──────────────────────────────────────────────────────────────────────────────

router.get('/departments', authorize('admin', 'sys_admin'), async (req, res) => {
  try {
    const departments = await db('departments').orderBy('name');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/roles', authorize('sys_admin'), async (req, res) => {
  try {
    const roles = await db('roles').orderBy('name');
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/activity-logs', authorize('sys_admin'), async (req, res) => {
  try {
    const { action, user, search, from, to, limit } = req.query;
    const safeLimit = Math.min(parseInt(limit, 10) || 100, 500);

    let query = db('activity_logs')
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .select('activity_logs.*', 'users.name as user_name');

    if (action) query = query.where('activity_logs.action', action);
    if (user) query = query.where('users.name', 'ilike', `%${user}%`);
    if (search) {
      query = query.where(function () {
        this.where('activity_logs.details', 'ilike', `%${search}%`)
          .orWhere('activity_logs.entity_type', 'ilike', `%${search}%`)
          .orWhere('activity_logs.action', 'ilike', `%${search}%`);
      });
    }
    if (from && !Number.isNaN(new Date(from).getTime())) {
      query = query.where('activity_logs.created_at', '>=', new Date(from));
    }
    if (to && !Number.isNaN(new Date(to).getTime())) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query = query.where('activity_logs.created_at', '<=', end);
    }

    const logs = await query.orderBy('activity_logs.created_at', 'desc').limit(safeLimit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Compact recent-activity feed for the administration dashboard. Hospital
 * administrators may see this summary; the full audit log stays sys_admin only.
 */
router.get('/recent-activity', authorize('admin', 'sys_admin'), async (req, res) => {
  try {
    const logs = await db('activity_logs')
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .select(
        'activity_logs.id',
        'activity_logs.action',
        'activity_logs.entity_type',
        'activity_logs.entity_id',
        'activity_logs.details',
        'activity_logs.created_at',
        'users.name as user_name',
      )
      .orderBy('activity_logs.created_at', 'desc')
      .limit(8);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Department management — sys_admin only (mutations)
// ──────────────────────────────────────────────────────────────────────────────

router.post('/departments',
  authorize('sys_admin'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const [deptRow] = await db('departments').insert({ name, description }).returning('id');
      res.status(201).json({ id: deptRow.id });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/departments/:id',
  authorize('sys_admin'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const existing = await db('departments').where('id', req.params.id).first();
      if (!existing) return res.status(404).json({ message: 'Department not found' });

      const { name, description } = req.body;
      await db('departments').where('id', req.params.id).update({ name, description });
      res.json({ message: 'Department updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.delete('/departments/:id', authorize('sys_admin'), async (req, res) => {
  try {
    const existing = await db('departments').where('id', req.params.id).first();
    if (!existing) return res.status(404).json({ message: 'Department not found' });

    const deptId = req.params.id;
    const inUse = await db('users').where('department_id', deptId).first();
    if (inUse) return res.status(400).json({ message: 'Cannot delete a department in use' });
    await db('departments').where('id', deptId).del();
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Category management — sys_admin only (mutations)
// ──────────────────────────────────────────────────────────────────────────────

router.post('/categories',
  authorize('sys_admin'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  body('type').isIn(['it', 'maintenance']).withMessage('Type must be it or maintenance'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { name, type, description } = req.body;
      const [catRow] = await db('categories').insert({ name, type, description }).returning('id');
      res.status(201).json({ id: catRow.id });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/categories/:id',
  authorize('sys_admin'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  body('type').isIn(['it', 'maintenance']).withMessage('Type must be it or maintenance'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const existing = await db('categories').where('id', req.params.id).first();
      if (!existing) return res.status(404).json({ message: 'Category not found' });

      const { name, type, description } = req.body;
      await db('categories').where('id', req.params.id).update({ name, type, description });
      res.json({ message: 'Category updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.delete('/categories/:id', authorize('sys_admin'), async (req, res) => {
  try {
    const existing = await db('categories').where('id', req.params.id).first();
    if (!existing) return res.status(404).json({ message: 'Category not found' });

    const inUse = await db('tickets').where('category_id', req.params.id).first();
    if (inUse) return res.status(400).json({ message: 'Cannot delete a category in use' });
    await db('categories').where('id', req.params.id).del();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Role management — sys_admin only
// ──────────────────────────────────────────────────────────────────────────────

router.post('/roles',
  authorize('sys_admin'),
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Name is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const existing = await db('roles').where('name', name).first();
      if (existing) return res.status(400).json({ message: 'Role already exists' });
      const [row] = await db('roles').insert({ name, description }).returning('id');
      res.status(201).json({ id: row.id });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/roles/:id',
  authorize('sys_admin'),
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Name is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const existing = await db('roles').where('id', req.params.id).first();
      if (!existing) return res.status(404).json({ message: 'Role not found' });

      const { name, description } = req.body;
      await db('roles').where('id', req.params.id).update({ name, description });
      res.json({ message: 'Role updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.delete('/roles/:id', authorize('sys_admin'), async (req, res) => {
  try {
    const existing = await db('roles').where('id', req.params.id).first();
    if (!existing) return res.status(404).json({ message: 'Role not found' });

    const inUse = await db('users').where('role_id', req.params.id).first();
    if (inUse) return res.status(400).json({ message: 'Cannot delete a role assigned to users' });
    await db('roles').where('id', req.params.id).del();
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// System settings — sys_admin only
// ──────────────────────────────────────────────────────────────────────────────

router.get('/settings', authorize('sys_admin'), async (req, res) => {
  try {
    const settings = await db('system_settings').orderBy('category').orderBy('key');
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/settings',
  authorize('sys_admin'),
  body('key').trim().isLength({ min: 1, max: 100 }).withMessage('Key is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { key, value, category, description } = req.body;
      const existing = await db('system_settings').where('key', key).first();
      if (existing) return res.status(400).json({ message: 'Key already exists' });
      const [row] = await db('system_settings').insert({ key, value, category, description }).returning('id');
      res.status(201).json({ id: row.id, key });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/settings/:key',
  authorize('sys_admin'),
  body('value').exists().withMessage('Value is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { value, description, category } = req.body;
      const setting = await db('system_settings').where('key', req.params.key).first();
      if (!setting) return res.status(404).json({ message: 'Setting not found' });

      const updates = { value };
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      await db('system_settings').where('key', req.params.key).update({ ...updates, updated_at: new Date() });
      res.json({ message: 'Setting updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.delete('/settings/:key', authorize('sys_admin'), async (req, res) => {
  try {
    const setting = await db('system_settings').where('key', req.params.key).first();
    if (!setting) return res.status(404).json({ message: 'Setting not found' });
    if (setting.is_protected) return res.status(400).json({ message: 'Cannot delete a protected setting' });
    await db('system_settings').where('key', req.params.key).del();
    res.json({ message: 'Setting deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;