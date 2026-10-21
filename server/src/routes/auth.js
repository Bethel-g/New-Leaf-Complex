const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const db = require('../config/db');
const config = require('../config');
const { authenticate, fetchUserById } = require('../middleware/auth');
const { validate } = require('../utils/validate');

const router = express.Router();

async function logActivity(userId, action, details, ip) {
  try {
    await db('activity_logs').insert({
      user_id: userId || null,
      action,
      entity_type: 'user',
      entity_id: userId || null,
      details,
      ip_address: ip || null,
    });
  } catch (e) {
    console.error('activity_log insert failed:', e.message);
  }
}

// ── In-memory login throttling (per email+IP) ──────────────────────────────
// Mitigates online brute-force / password guessing. Stateless & per-process;
// a restart resets counters, which is acceptable for this application.
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const FAILURES = new Map();

function attemptKey(email, ip) {
  return `${String(email).toLowerCase().trim()}|${ip}`;
}

function isLoginLocked(email, ip) {
  const rec = FAILURES.get(attemptKey(email, ip));
  return !!(rec && Date.now() - rec.first < LOCKOUT_WINDOW_MS && rec.count >= MAX_LOGIN_ATTEMPTS);
}

function recordLoginFailure(email, ip) {
  const key = attemptKey(email, ip);
  const now = Date.now();
  const rec = FAILURES.get(key);
  if (!rec || now - rec.first >= LOCKOUT_WINDOW_MS) {
    FAILURES.set(key, { count: 1, first: now });
  } else {
    rec.count += 1;
  }
  // Opportunistic cleanup so the map cannot grow unboundedly.
  if (FAILURES.size > 1000) {
    for (const [k, v] of FAILURES) {
      if (Date.now() - v.first >= LOCKOUT_WINDOW_MS) FAILURES.delete(k);
    }
  }
}

function clearLoginFailures(email, ip) {
  FAILURES.delete(attemptKey(email, ip));
}

router.post('/login',
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';

      if (isLoginLocked(email, ip)) {
        await logActivity(null, 'login_blocked', `Too many failed attempts for ${email}`, ip);
        return res.status(429).json({ message: 'Too many login attempts. Try again in 15 minutes.' });
      }

      const user = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .join('departments', 'users.department_id', 'departments.id')
        .where('users.email', email)
        .select('users.*', 'roles.name as role_name', 'departments.name as department_name')
        .first();

      if (!user) {
        recordLoginFailure(email, ip);
        await logActivity(null, 'login_failed', `Failed login attempt for ${email}: unknown email`, ip);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        recordLoginFailure(email, ip);
        await logActivity(null, 'login_failed', `Failed login attempt for ${email}: bad password`, ip);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.is_active) {
        recordLoginFailure(email, ip);
        await logActivity(user.id, 'login_failed', `Login attempt for deactivated account: ${email}`, ip);
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      clearLoginFailures(email, ip);

      const token = jwt.sign(
        { id: user.id, role: user.role_name },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn },
      );

      await logActivity(user.id, 'login', 'User logged in', ip);

      const { password: _, ...userData } = user;
      res.json({ token, user: userData });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  const ip = req.ip || req.connection?.remoteAddress || null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret);
      await logActivity(decoded.id, 'logout', 'User logged out', ip);
    } catch (e) {
      // Ignore invalid tokens on logout - clearing the client session is enough.
    }
  }
  res.json({ message: 'Logged out successfully' });
});

router.post('/change-password',
  authenticate,
  body('current_password').isLength({ min: 1 }).withMessage('Current password is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;

      const user = await db('users').where('id', req.user.id).first();
      if (!user) return res.status(404).json({ message: 'User not found' });

      const valid = await bcrypt.compare(current_password, user.password);
      if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

      const hashed = await bcrypt.hash(new_password, 10);
      await db('users').where('id', req.user.id).update({ password: hashed, updated_at: new Date() });

      await logActivity(user.id, 'password_changed', 'User changed their password', req.ip);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await fetchUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Self-service profile update. A user may change their own name, email and
 * phone; role, department and activation stay under system administration.
 */
router.put('/profile',
  authenticate,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('phone').optional({ values: 'null' }).trim().isLength({ max: 30 }).withMessage('Phone is too long'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      const updates = {};

      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone || null;
      if (email !== undefined) {
        const taken = await db('users').where('email', email).whereNot('id', req.user.id).first();
        if (taken) return res.status(400).json({ message: 'Email already in use' });
        updates.email = email;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No changes provided' });
      }

      await db('users').where('id', req.user.id).update({ ...updates, updated_at: new Date() });
      await logActivity(req.user.id, 'profile_updated', 'User updated their profile', req.ip);
      res.json(await fetchUserById(req.user.id));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

/**
 * Account/security summary for the profile page. Derived from the audit log so
 * it needs no extra columns on `users` (which would change the login payload).
 */
router.get('/me/security', authenticate, async (req, res) => {
  try {
    const lastLogin = await db('activity_logs')
      .where({ user_id: req.user.id, action: 'login' })
      .orderBy('created_at', 'desc')
      .first();

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const failedRow = await db('activity_logs')
      .where('action', 'login_failed')
      .where('created_at', '>=', since)
      .where('details', 'ilike', `%${req.user.email}%`)
      .count('id as c')
      .first();

    res.json({
      last_login_at: lastLogin ? lastLogin.created_at : null,
      last_login_ip: lastLogin ? lastLogin.ip_address : null,
      failed_attempts_30d: parseInt(failedRow.c, 10) || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;