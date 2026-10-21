const db = require('../config/db');

/**
 * System settings access.
 *
 * Settings are stored as strings in `system_settings`. These helpers read them
 * with sensible fallbacks so application behaviour keeps working on a database
 * where a key has not been created yet (the admin UI creates keys on demand).
 */

/** All settings as a plain `{ key: value }` map (one query). */
async function getSettingsMap() {
  const rows = await db('system_settings').select('key', 'value');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** A single setting value, or `fallback` when the row is missing/empty. */
async function getSetting(key, fallback = null) {
  const row = await db('system_settings').where('key', key).first();
  return row && row.value !== null && row.value !== undefined && row.value !== '' ? row.value : fallback;
}

/** Parse a boolean-ish setting value. */
function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

/** Parse a numeric setting value. */
function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = { getSettingsMap, getSetting, toBool, toNum };
