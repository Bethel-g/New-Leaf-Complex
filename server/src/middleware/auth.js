const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/db');

const USER_COLUMNS = [
  'users.id',
  'users.name',
  'users.employee_id',
  'users.email',
  'users.phone',
  'users.department_id',
  'users.role_id',
  'users.is_active',
  'roles.name as role_name',
  'roles.description as role_description',
  'departments.name as department_name',
];

function fetchUserById(id) {
  return db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .join('departments', 'users.department_id', 'departments.id')
    .where('users.id', id)
    .select(USER_COLUMNS)
    .first();
}

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await fetchUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, fetchUserById, USER_COLUMNS };