const fs = require('fs');
const { validationResult } = require('express-validator');

/**
 * Runs express-validator results. Sends a 400 and returns false on failure.
 * Any files already stored by multer are removed so validation failures do not
 * leave orphaned files on disk.
 */
function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (Array.isArray(req.files) && req.files.length) {
      for (const file of req.files) {
        try { fs.unlinkSync(file.path); } catch (e) { /* best effort */ }
      }
    }
    res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return false;
  }
  return true;
}

module.exports = { validate };