const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../utils/validate');

const router = express.Router();
router.use(authenticate);

router.get('/',
  authorize('sys_admin'),
  async (req, res) => {
    try {
      const users = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .join('departments', 'users.department_id', 'departments.id')
        .select(
          'users.id', 'users.name', 'users.email', 'users.employee_id',
          'users.phone', 'users.is_active',
          'roles.name as role_name', 'departments.name as department_name',
          'users.created_at',
        )
        .orderBy('users.name');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.get('/technicians',
  authorize('it_supervisor', 'maintenance_supervisor', 'admin', 'sys_admin'),
  async (req, res) => {
    try {
      const { type } = req.query;
      const roleFilter = type === 'it'
        ? ['it_staff', 'it_supervisor']
        : ['maintenance_staff', 'maintenance_supervisor'];

      const technicians = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .join('departments', 'users.department_id', 'departments.id')
        .whereIn('roles.name', roleFilter)
        .andWhere('users.is_active', true)
        .select('users.id', 'users.name', 'users.employee_id', 'departments.name as department_name')
        .orderBy('users.name');
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.get('/staff',
  authorize('admin', 'sys_admin'),
  async (req, res) => {
    try {
      const staffMembers = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .join('departments', 'users.department_id', 'departments.id')
        .where('roles.name', 'staff')
        .andWhere('users.is_active', true)
        .select('users.id', 'users.name', 'users.employee_id', 'departments.name as department_name')
        .orderBy('users.name');
      res.json(staffMembers);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.post('/',
  authorize('sys_admin'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('department_id').isInt({ min: 1 }).withMessage('Department is required'),
  body('role_id').isInt({ min: 1 }).withMessage('Role is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { name, email, password, employee_id, phone, department_id, role_id } = req.body;

      const existing = await db('users').where('email', email).first();
      if (existing) return res.status(400).json({ message: 'Email already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const [userRow] = await db('users')
        .insert({ name, email, password: hashedPassword, employee_id, phone, department_id, role_id })
        .returning('id');

      res.status(201).json({ message: 'User created', id: userRow.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/:id',
  authorize('sys_admin'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be non-empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('department_id').optional().isInt({ min: 1 }).withMessage('Invalid department'),
  body('role_id').optional().isInt({ min: 1 }).withMessage('Invalid role'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const existing = await db('users').where('id', req.params.id).first();
      if (!existing) return res.status(404).json({ message: 'User not found' });

      const { name, email, employee_id, phone, department_id, role_id, is_active } = req.body;
      await db('users').where('id', req.params.id).update({
        name, email, employee_id, phone, department_id, role_id, is_active,
      });
      res.json({ message: 'User updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/:id/password',
  authorize('sys_admin'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const existing = await db('users').where('id', req.params.id).first();
      if (!existing) return res.status(404).json({ message: 'User not found' });

      const { password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      await db('users').where('id', req.params.id).update({ password: hashedPassword });
      res.json({ message: 'Password updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.delete('/:id',
  authorize('sys_admin'),
  async (req, res) => {
    try {
      if (parseInt(req.params.id, 10) === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
      }

      const target = await db('users').where('id', req.params.id).first();
      if (!target) return res.status(404).json({ message: 'User not found' });

      const { isSysAdmin } = require('../utils/permissions');
      const targetRole = await db('roles').where('id', target.role_id).first();
      if (isSysAdmin(targetRole?.name)) {
        const sysAdmins = await db('users')
          .join('roles', 'users.role_id', 'roles.id')
          .where('roles.name', 'sys_admin')
          .count('users.id as c')
          .first();
        if (parseInt(sysAdmins.c, 10) <= 1) {
          return res.status(400).json({ message: 'Cannot delete the last system administrator' });
        }
      }

      await db('users').where('id', req.params.id).del();
      res.json({ message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;