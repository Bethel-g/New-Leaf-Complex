/**
 * Regression-test helpers.
 *
 * Three concerns live here:
 *  1. `normalize()` — strip volatile values (ids, timestamps, secrets, random
 *     file names) so a JSON snapshot of a response is stable across runs.
 *  2. `shape()`     — the structural fingerprint of a payload: which keys exist,
 *     their types, and how many rows an array holds. Used for assertions that
 *     must survive a data change but fail on a contract change.
 *  3. small query/flow utilities shared by the three regression suites.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../../src/config/db.js';
import { request, loginAs, login, call, ROLES, DEFAULT_PASSWORD } from '../helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path of the shared uploads directory.
 * Mirrors src/services/collaboration.js: `path.resolve(__dirname, '..', '..', 'uploads')`
 * where __dirname is server/src/services → server/uploads.
 */
const UPLOADS_DIR = path.resolve(HERE, '..', '..', 'uploads');

// ── Normalization ──────────────────────────────────────────────────────────

const TIMESTAMP_KEY = /(_at|_date|_started_at|_ended_at|_run_at)$/;
const SECRET_KEY = /^(token|password|device_secret|device_secret_hash)$/;
const FILE_PATH_KEY = /^file_path$/;
const ID_KEY = /(^id$|_id$)/;

function scrubTimestamp(value) {
  if (typeof value !== 'string') return value;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.test(value)) return '<timestamp>';
  return value;
}

function scrubUuid(value) {
  if (typeof value !== 'string') return value;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(value)) return '<uuid>';
  return value;
}

/**
 * Deep-normalize a JSON value so it can be committed as a snapshot.
 * Id columns collapse to `<id>` (their exact value is not the contract),
 * timestamps and uuids become markers, and object keys are sorted so that key
 * ordering is not accidentally asserted.
 */
function normalize(value, key = '') {
  if (Array.isArray(value)) return value.map((v) => normalize(v, key));
  if (value === null || value === undefined) return null;

  if (typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) {
      if (SECRET_KEY.test(k)) {
        out[k] = value[k] === null ? null : '<secret>';
        continue;
      }
      if (FILE_PATH_KEY.test(k)) {
        out[k] = value[k] === null ? null : '<file>';
        continue;
      }
      out[k] = normalize(value[k], k);
    }
    return out;
  }

  if (TIMESTAMP_KEY.test(key)) return scrubUuid(scrubTimestamp(value));
  if (typeof value === 'number' && ID_KEY.test(key)) return '<id>';
  return scrubUuid(scrubTimestamp(value));
}

/** Like normalize(), but also collapses non-numeric id fields (uuid ids). */
function normalizeIds(value) {
  if (Array.isArray(value)) return value.map(normalizeIds);
  if (value === null || typeof value !== 'object') return value;
  const out = {};
  for (const k of Object.keys(value).sort()) {
    out[k] = ID_KEY.test(k) ? '<id>' : normalizeIds(value[k]);
  }
  return out;
}

// ── Structural shape ───────────────────────────────────────────────────────

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

/**
 * The structural fingerprint of a payload: keys (sorted) → type, plus array
 * lengths. Adding, removing, or renaming a response field changes this; so does
 * a row-count change on a reference-data endpoint, which is intentional.
 */
function shape(value, depth = 0) {
  if (Array.isArray(value)) {
    if (depth > 6) return 'array<deep>';
    const seen = value.slice(0, 3);
    const itemKeys = new Set();
    let item = 'empty';
    for (const it of seen) {
      if (it && typeof it === 'object' && !Array.isArray(it)) {
        Object.keys(it).forEach((k) => itemKeys.add(k));
      }
    }
    if (itemKeys.size) {
      item = `object(${typeOf(seen[0])} keys)`;
    } else {
      item = seen.length ? typeOf(seen[0]) : 'empty';
    }
    return { type: 'array', length: value.length, item, itemKeys: [...itemKeys].sort() };
  }
  if (value === null) return 'null';
  if (typeof value === 'object') {
    if (depth > 6) return 'object<deep>';
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = shape(value[k], depth + 1);
    return out;
  }
  return typeOf(value);
}

/** Sorted keys of an object payload. */
function keysOf(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value).sort()
    : [];
}

// ── Filesystem helpers ─────────────────────────────────────────────────────

function storedFilePath(filePath) {
  return path.join(UPLOADS_DIR, path.basename(filePath));
}

function fileExists(filePath) {
  return Boolean(filePath) && fs.existsSync(storedFilePath(filePath));
}

function readStoredFile(filePath) {
  const full = storedFilePath(filePath);
  return fs.existsSync(full) ? fs.readFileSync(full) : null;
}

/**
 * Files written by the tests in this file, so `cleanupUploads()` can remove
 * exactly those.
 *
 * The anchor is captured lazily on the first upload rather than at module
 * import: `test/setup.js` re-seeds before each file and the seed writes its own
 * placeholder PNGs into the same directory, so a snapshot taken at import time
 * would treat those as test litter and could delete the *next* file's seed
 * assets. Anchoring after the seed has run keeps the diff ours alone.
 *
 * Tracked by directory diff rather than by attachment row, because a file can
 * be written to disk and still fail to get a row (rejected validation, an
 * authorisation error after multer ran) — exactly the leak worth cleaning.
 */
let uploadAnchor = null;

function currentUploads() {
  return new Set(fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : []);
}

/** Remove every file this test file uploaded. Call once per file: `afterAll(cleanupUploads)`. */
function cleanupUploads() {
  if (uploadAnchor === null) return;
  for (const name of currentUploads()) {
    if (uploadAnchor.has(name)) continue;
    try { fs.unlinkSync(path.join(UPLOADS_DIR, name)); } catch (e) { /* best effort */ }
  }
  uploadAnchor = null;
}

/**
 * Download an attachment as raw bytes.
 * Supertest's default parser turns a binary body into `{}`, so the response is
 * buffered and reassembled manually.
 */
function download(token, url) {
  const p = url.startsWith('/api') ? url : `/api${url}`;
  const req = request.get(p).set('Authorization', `Bearer ${token}`).buffer(true);
  return req.parse((res, callback) => {
    const chunks = [];
    res.on('data', (c) => chunks.push(Buffer.from(c)));
    res.on('end', () => callback(null, Buffer.concat(chunks)));
  });
}

// ── Flow helpers ───────────────────────────────────────────────────────────

/**
 * Multipart upload against an /api path with a bearer token. Async, so the
 * uploads directory can be anchored before the first file is written.
 */
async function attach(token, url, buffer, filename, contentType, field = 'files') {
  if (uploadAnchor === null) uploadAnchor = currentUploads();
  const p = url.startsWith('/api') ? url : `/api${url}`;
  return request.post(p)
    .set('Authorization', `Bearer ${token}`)
    .attach(field, buffer, { filename, contentType });
}

async function byName(table, name, type) {
  const q = db(table).where('name', name);
  if (type) q.andWhere('type', type);
  return q.first();
}

/** Seeded reference-data rows the regression suites assert against. */
async function refs() {
  return {
    itCat: await byName('categories', 'Computer', 'it'),
    mCat: await byName('categories', 'Plumbing', 'maintenance'),
    itNew: await byName('statuses', 'New', 'it'),
    itAssigned: await byName('statuses', 'Assigned', 'it'),
    itInProg: await byName('statuses', 'In Progress', 'it'),
    itWFI: await byName('statuses', 'Waiting for Information', 'it'),
    itResolved: await byName('statuses', 'Resolved', 'it'),
    itClosed: await byName('statuses', 'Closed', 'it'),
    mNew: await byName('statuses', 'New', 'maintenance'),
    mInspection: await byName('statuses', 'Inspection', 'maintenance'),
    mInProg: await byName('statuses', 'In Progress', 'maintenance'),
    mWFP: await byName('statuses', 'Waiting for Parts', 'maintenance'),
    mCompleted: await byName('statuses', 'Completed', 'maintenance'),
    mClosed: await byName('statuses', 'Closed', 'maintenance'),
    sSubmitted: await byName('statuses', 'Submitted', 'suggestion'),
    sUnderReview: await byName('statuses', 'Under Review', 'suggestion'),
    sAccepted: await byName('statuses', 'Accepted', 'suggestion'),
    sAssigned: await byName('statuses', 'Assigned', 'suggestion'),
    sImplementation: await byName('statuses', 'Implementation', 'suggestion'),
    sImplemented: await byName('statuses', 'Implemented', 'suggestion'),
    sClosed: await byName('statuses', 'Closed', 'suggestion'),
    sRejected: await byName('statuses', 'Rejected', 'suggestion'),
    sMoreInfo: await byName('statuses', 'Needs More Information', 'suggestion'),
    sAlreadyPlanned: await byName('statuses', 'Already Planned', 'suggestion'),
    sForwarded: await byName('statuses', 'Forwarded to Department', 'suggestion'),
    prioLow: await byName('priorities', 'Low'),
    prioMed: await byName('priorities', 'Medium'),
    prioHigh: await byName('priorities', 'High'),
    prioCritical: await byName('priorities', 'Critical'),
    deptNursing: await db('departments').where('name', 'Nursing').first(),
    deptRadiology: await db('departments').where('name', 'Radiology').first(),
    roleStaff: await db('roles').where('name', 'staff').first(),
    roleSysAdmin: await db('roles').where('name', 'sys_admin').first(),
    roleItStaff: await db('roles').where('name', 'it_staff').first(),
    roleItSupervisor: await db('roles').where('name', 'it_supervisor').first(),
    roleMtSupervisor: await db('roles').where('name', 'maintenance_supervisor').first(),
    userByEmail: (email) => db('users').where('email', email).first(),
    userByName: (name) => db('users').where('name', name).first(),
  };
}

/** Logins for every role the regression suites need, resolved once. */
async function actors() {
  const names = ['staff', 'it_staff', 'it_supervisor', 'maintenance_staff', 'maintenance_supervisor', 'admin', 'sys_admin'];
  const out = {};
  await Promise.all(names.map(async (r) => { out[r] = await loginAs(r); }));
  out.doctor = await login('omar.doctor@newleaf.com');
  out.labTech = await login('layla.lab@newleaf.com');
  return out;
}

/** Assert that a payload exposes exactly `expected` keys (catches field drift). */
function expectKeys(payload, expected) {
  const actual = keysOf(payload);
  const missing = expected.filter((k) => !actual.includes(k));
  const extra = actual.filter((k) => !expected.includes(k));
  return { actual, missing, extra };
}

export {
  UPLOADS_DIR,
  db, request, call, login, loginAs, ROLES, DEFAULT_PASSWORD, attach, download,
  normalize, normalizeIds, shape, keysOf, expectKeys,
  refs, actors, byName,
  storedFilePath, fileExists, readStoredFile, cleanupUploads,
};
