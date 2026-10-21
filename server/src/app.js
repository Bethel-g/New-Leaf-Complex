const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');
require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ticketRoutes = require('./routes/tickets');
const suggestionRoutes = require('./routes/suggestions');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const multimediaRoutes = require('./routes/multimedia');

function createApp() {
  const app = express();

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security headers for every response (API JSON + authenticated downloads).
  // Content is authenticated user-specific data -> never store it in shared
  // browser/proxy caches, disable content-type sniffing and framing.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // NOTE: attachment files are served ONLY through authenticated download routes
  // (GET /api/tickets/:id/attachments/:attachmentId and
  //  GET /api/suggestions/:id/attachments/:attachmentId). The public static
  //  /uploads mount was removed so attached files are NEVER reachable without
  //  authorization.

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/suggestions', suggestionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/multimedia', multimediaRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  // Error handler: map collaboration/file-upload failures to client-facing 4xx.
  app.use((err, req, res, next) => {
    // Malformed JSON body is a client error, not a server fault.
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    if (err.isFileValidationError) {
      return res.status(400).json({ message: err.message });
    }
    if (err.name === 'MulterError' || (err.code && String(err.code).startsWith('LIMIT_'))) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large (max 10 MB)' });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Too many files (max 5)' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err.isFileError) {
      return res.status(400).json({ message: err.message });
    }
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
