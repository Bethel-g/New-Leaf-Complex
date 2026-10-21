/**
 * Shared collaboration layer for tickets and suggestions: comments, history and
 * attachments. Single source of truth so IT tickets, Maintenance tickets and
 * Suggestions do not duplicate this logic.
 *
 * Attachments are hardened:
 * - Only safe file types accepted (images / PDF / Office docs / text).
 * - Executable files (by extension and by content type) are rejected.
 * - Maximum size and file-count enforced.
 * - Files are renamed to random safe names; original names kept in metadata only.
 * - Files are streamed through authenticated routes (never served statically).
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

// ── Attachment security rules ──────────────────────────────────────────
// NOTE: SVG files are NOT accepted. SVG can carry embedded scripts and, when
// opened directly (e.g. a blob previewed in a new tab), executes in the
// application origin — a stored-XSS vector. Image formats are restricted to
// raster formats that cannot execute script.
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods',
  'txt', 'rtf', 'csv', 'md',
]);

// Content types that reveal an executable even when the extension is benign.
const BLOCKED_MIME_FRAGMENTS = [
  'application/x-msdownload',
  'application/x-dosexec',
  'application/x-msdos-program',
  'application/x-ms-installer',
  'application/vnd.microsoft.portable-executable',
  'application/x-executable',
  'application/x-sh',
  'application/x-csh',
  'application/x-bat',
  'application/java-archive',
  'text/x-script',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
];

const INLINE_TYPES = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf']);

function normalizeExt(originalname) {
  if (!originalname || typeof originalname !== 'string') return '';
  return path.extname(originalname).toLowerCase().replace(/^\./, '');
}

function isValidFile(file) {
  if (!file || !file.originalname) return false;
  const ext = normalizeExt(file.originalname);
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (file.mimetype) {
    const mime = file.mimetype.toLowerCase();
    if (BLOCKED_MIME_FRAGMENTS.some((fragment) => mime.includes(fragment))) return false;
  }
  return true;
}

function safeFileName(file) {
  return `${uuidv4()}.${normalizeExt(file.originalname)}`;
}

// ── Shared upload middleware with validation ───────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, safeFileName(file)),
});

function fileFilter(req, file, cb) {
  if (isValidFile(file)) return cb(null, true);
  const err = new Error('File type not allowed. Allowed: images, PDF, Office documents and text files. Executable files are blocked.');
  err.isFileValidationError = true;
  cb(err);
}

function createUploadMiddleware(fieldName = 'files', maxFiles = MAX_FILES) {
  return multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, files: maxFiles } }).array(fieldName, maxFiles);
}

const uploadAttachments = createUploadMiddleware('files');

// ── Collaboration factory (comments / history / attachments) ───────────
function createCollaboration({ idField, commentsTable, historyTable, attachmentsTable }) {
  return {
    // Comments
    listComments(parentId) {
      return db(commentsTable)
        .join('users', `${commentsTable}.user_id`, 'users.id')
        .where(`${commentsTable}.${idField}`, parentId)
        .select(`${commentsTable}.*`, 'users.name as user_name')
        .orderBy(`${commentsTable}.created_at`, 'asc');
    },
    async addComment(parentId, userId, comment) {
      const [row] = await db(commentsTable)
        .insert({ [idField]: parentId, user_id: userId, comment })
        .returning('id');
      return row.id;
    },

    // History
    listHistory(parentId) {
      return db(historyTable)
        .join('users', `${historyTable}.user_id`, 'users.id')
        .where(`${historyTable}.${idField}`, parentId)
        .select(`${historyTable}.*`, 'users.name as user_name')
        .orderBy(`${historyTable}.created_at`, 'asc');
    },
    addHistory(parentId, userId, action, oldValue = null, newValue = null) {
      return db(historyTable).insert({
        [idField]: parentId,
        user_id: userId,
        action,
        old_value: oldValue,
        new_value: newValue,
      });
    },

    // Attachments
    listAttachments(parentId) {
      return db(attachmentsTable).where(idField, parentId).orderBy('created_at', 'asc');
    },
    async addAttachments(parentId, files) {
      for (const file of files) {
        await db(attachmentsTable).insert({
          [idField]: parentId,
          file_name: file.originalname,
          file_path: file.filename,
        });
      }
    },
    getAttachment(parentId, attachmentId) {
      return db(attachmentsTable).where(idField, parentId).andWhere('id', attachmentId).first();
    },
    async removeAttachment(parentId, attachmentId) {
      const attachment = await db(attachmentsTable).where(idField, parentId).andWhere('id', attachmentId).first();
      if (!attachment) return false;
      await db(attachmentsTable).where('id', attachment.id).del();
      const fullPath = path.join(UPLOADS_DIR, attachment.file_path);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { /* best effort */ }
      }
      return true;
    },
    streamAttachment(res, attachment) {
      if (!attachment) {
        res.status(404).json({ message: 'Attachment not found' });
        return;
      }
      const fullPath = path.join(UPLOADS_DIR, attachment.file_path);
      if (!fs.existsSync(fullPath)) {
        res.status(404).json({ message: 'Attachment file not found' });
        return;
      }
      const disposition = INLINE_TYPES.has(normalizeExt(attachment.file_name)) ? 'inline' : 'attachment';
      // Authenticated content must never be cached by a shared browser/proxy.
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename*=UTF-8''${encodeURIComponent(attachment.file_name)}`
      );
      res.sendFile(fullPath);
    },
  };
}

module.exports = {
  UPLOADS_DIR,
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_EXTENSIONS,
  isValidFile,
  safeFileName,
  createUploadMiddleware,
  uploadAttachments,
  createCollaboration,
  normalizeExt,
};