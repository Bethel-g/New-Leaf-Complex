/**
 * Multimedia Control & Digital Signage — core service.
 *
 * Hardware integration is abstracted behind `sendDeviceCommand`. The bundled
 * integration is `mock-local-player`: it acknowledges play/stop commands for
 * every device and reports "not supported" for everything else (power,
 * volume, mute, ...). No command is ever reported as successful unless the
 * integration actually supports it — unsupported capabilities are surfaced
 * to the UI, never faked.
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { createNotification } = require('../utils/helpers');

const VIEW_ROLES = ['it_staff', 'it_supervisor', 'admin', 'sys_admin'];
const MANAGE_ROLES = ['it_supervisor', 'admin', 'sys_admin'];

const INTEGRATION = {
  id: 'mock-local-player',
  name: 'Mock Local Player Integration',
  description: 'Local development integration that simulates a media player. Reports play/stop as supported; power, volume and mute are not supported and are never reported as success.',
  supported_commands: ['play', 'stop'],
  not_supported_hint: 'power,volume,mute,reboot,input_source',
};

const STATUS_OPTIONS = ['online', 'offline', 'playing', 'idle', 'error', 'disabled'];
const TARGET_TYPES = ['device', 'group', 'all'];
const REPEAT_TYPES = ['none', 'daily', 'weekly', 'specific_days'];

// ── Permissions ────────────────────────────────────────────────────────────────

const canViewMultimedia = (roleName) => VIEW_ROLES.includes(roleName);
const canManageMultimedia = (roleName) => MANAGE_ROLES.includes(roleName);

// ── Settings ──────────────────────────────────────────────────────────────────

async function getSettingNum(key, fallback) {
  const row = await db('system_settings').where('key', key).first();
  if (!row) return fallback;
  const n = parseInt(row.value, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function heartbeatTimeoutMinutes() {
  return getSettingNum('multimedia_heartbeat_timeout_minutes', 3);
}

async function deviceLimit() {
  return getSettingNum('multimedia_device_limit', 100);
}

async function itStaffCommandsAllowed() {
  const row = await db('system_settings').where('key', 'multimedia_allow_it_staff_commands').first();
  return row ? String(row.value).toLowerCase() === 'true' : false;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function isOnline(device, now, timeoutMinutes) {
  if (!device.last_heartbeat_at) return false;
  const cutoff = now.getTime() - timeoutMinutes * 60000;
  return new Date(device.last_heartbeat_at).getTime() >= cutoff;
}

async function audit(userId, action, entityType, entityId, details) {
  await db('multimedia_audit').insert({
    user_id: userId || null,
    action,
    entity_type: entityType || null,
    entity_id: entityId || null,
    details: details ? JSON.stringify(details) : null,
  });
}

async function recordHistory({ deviceId, mediaId, action, status, startedAt, triggeredBy, errorMessage }) {
  await db('playback_history').insert({
    device_id: deviceId,
    media_id: mediaId || null,
    action,
    status,
    started_at: startedAt || db.fn.now(),
    triggered_by: triggeredBy || null,
    error_message: errorMessage || null,
  });
}

// ── Mock hardware integration ─────────────────────────────────────────────────

function capabilitiesOf(device) {
  const type = (device.device_type || 'tv').toLowerCase();
  if (type === 'tv' || type === 'display' || type === 'media_player') {
    return INTEGRATION.supported_commands;
  }
  return [];
}

function sendDeviceCommand(device, command, params, now) {
  const supported = capabilitiesOf(device);
  if (!supported.includes(command)) {
    return {
      status: 'not_supported',
      ok: false,
      message: `Command "${command}" is not supported by the current player integration`,
    };
  }
  if (command === 'play') {
    return {
      status: 'succeeded',
      ok: true,
      message: `Mock player started playback of media ${params && params.media_id ? params.media_id : '(none)'} at ${now.toISOString()}`,
    };
  }
  if (command === 'stop') {
    return { status: 'succeeded', ok: true, message: `Mock player stopped playback at ${now.toISOString()}` };
  }
  return { status: 'not_supported', ok: false, message: `Command "${command}" is not supported` };
}

// ── Device status refresh ─────────────────────────────────────────────────────

/**
 * Recomputes each device status from its heartbeat while respecting stored
 * hints (playing devices stay "playing" while their heartbeat is fresh).
 * Transitions online -> offline are logged to playback history and a
 * notification is created for managers.
 */
async function refreshDeviceStatuses(now) {
  now = now || new Date();
  const timeout = await heartbeatTimeoutMinutes();
  const devices = await db('multimedia_devices').where('is_active', true);
  const managerIds = await managerUserIds();

  for (const device of devices) {
    const online = isOnline(device, now, timeout);
    if (!online && device.status !== 'offline' && device.status !== 'error') {
      await db('multimedia_devices').where('id', device.id).update({
        status: 'offline',
        status_message: `No heartbeat for over ${timeout} minutes`,
        updated_at: now,
      });
      await recordHistory({
        deviceId: device.id,
        mediaId: device.current_media_id,
        action: 'heartbeat_offline',
        status: 'offline',
        startedAt: now,
        errorMessage: 'Device heartbeat timed out',
      });
      await notifyManagers(managerIds, 'Multimedia device offline', `${device.name} went offline (no heartbeat for over ${timeout} minutes).`);
    } else if (online && device.status === 'offline') {
      await db('multimedia_devices').where('id', device.id).update({
        status: 'online',
        status_message: null,
        updated_at: now,
      });
      await recordHistory({ deviceId: device.id, mediaId: device.current_media_id, action: 'heartbeat_online', status: 'online', startedAt: now, triggeredBy: null });
    }
  }
}

async function managerUserIds() {
  const rows = await db('users')
    .join('roles', 'users.role_id', 'roles.id')
    .whereIn('roles.name', MANAGE_ROLES)
    .where('users.is_active', true)
    .select('users.id');
  return rows.map((r) => r.id);
}

async function notifyManagers(managerIds, title, message) {
  for (const id of managerIds) {
    await createNotification(id, title, message);
  }
}

// ── Target resolution ─────────────────────────────────────────────────────────

async function resolveTargetDeviceIds(targetType, targetId, opts = {}) {
  opts.onlyActive = opts.onlyActive === undefined ? true : opts.onlyActive;
  let query = db('multimedia_devices');
  if (opts.onlyActive) query = query.where('is_active', true);

  switch (targetType) {
    case 'device': {
      if (!targetId) throw new Error('target_id is required for a device target');
      query = query.where('id', targetId);
      break;
    }
    case 'group': {
      if (!targetId) throw new Error('target_id is required for a group target');
      query = query
        .join('multimedia_group_devices', 'multimedia_devices.id', 'multimedia_group_devices.device_id')
        .where('multimedia_group_devices.group_id', targetId);
      break;
    }
    case 'all':
      break;
    default:
      throw new Error(`Unknown target_type "${targetType}"`);
  }
  return query.select('multimedia_devices.*');
}

// ── Broadcast / stop ──────────────────────────────────────────────────────────

/**
 * Sends a media asset to every resolved (active) device. Online devices get a
 * play command and are marked as playing; offline/error devices are recorded
 * as such and are NEVER reported as playing. Returns an assignment summary.
 */
async function performBroadcast({ mediaId, targetType, targetId, createdBy, priority = 0, source = 'broadcast' }) {
  const now = new Date();
  const timeout = await heartbeatTimeoutMinutes();

  const media = await db('media_assets').where('id', mediaId).first();
  if (!media) throw Object.assign(new Error('Media asset not found'), { statusCode: 404 });
  if (media.status !== 'active') throw Object.assign(new Error('Only active media assets can be broadcast'), { statusCode: 400 });

  const devices = await resolveTargetDeviceIds(targetType, targetId);
  if (!devices.length) {
    throw Object.assign(new Error('No active devices match the selected target'), { statusCode: 400 });
  }

  let success = 0;
  let offline = 0;
  const results = [];

  for (const device of devices) {
    const online = isOnline(device, now, timeout);
    if (!online) {
      offline += 1;
      results.push({ device_id: device.id, name: device.name, status: 'offline', media_id: mediaId });
      await recordHistory({ deviceId: device.id, mediaId, action: 'broadcast', status: 'offline', startedAt: now, triggeredBy: createdBy, errorMessage: 'Device offline at broadcast time' });
      continue;
    }
    const result = sendDeviceCommand(device, 'play', { media_id: mediaId }, now);
    if (result.ok) {
      success += 1;
      results.push({ device_id: device.id, name: device.name, status: 'playing', media_id: mediaId });
      await db('multimedia_devices').where('id', device.id).update({
        status: 'playing',
        current_media_id: mediaId,
        current_media_started_at: now,
        status_message: null,
        updated_at: now,
      });
      await recordHistory({ deviceId: device.id, mediaId, action: source, status: 'success', startedAt: now, triggeredBy: createdBy });
    } else {
      offline += 1;
      results.push({ device_id: device.id, name: device.name, status: 'failed', media_id: mediaId, message: result.message });
      await recordHistory({ deviceId: device.id, mediaId, action: source, status: 'failed', startedAt: now, triggeredBy: createdBy, errorMessage: result.message });
    }
  }

  const [assignment] = await db('playback_assignments').insert({
    media_id: mediaId,
    target_type: targetType,
    target_id: targetType === 'all' ? null : targetId,
    priority,
    status: 'active',
    devices_total: devices.length,
    devices_success: success,
    devices_offline: offline,
    started_at: now,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  }).returning('id');

  await audit(createdBy, 'broadcast', 'playback_assignment', assignment.id, { source, target_type: targetType, target_id: targetId, media_id: mediaId, total: devices.length, success, offline });

  if (offline > 0) {
    const adminIds = await managerUserIds();
    const base = adminIds.includes(createdBy) ? [createdBy] : [createdBy, ...adminIds].filter((v, i, a) => a.indexOf(v) === i);
    for (const uid of base) {
      await createNotification(uid, 'Multimedia playback issue', `Broadcast of "${media.title}" reached ${success}/${devices.length} devices; ${offline} device(s) were offline.`);
    }
  }

  return {
    assignment_id: assignment.id,
    media_id: mediaId,
    target_type: targetType,
    target_id: targetId || null,
    devices_total: devices.length,
    devices_success: success,
    devices_offline: offline,
    results,
  };
}

/**
 * Stops playback on the resolved devices. Offline devices are recorded as such.
 */
async function stopPlayback({ targetType, targetId, createdBy, source = 'stop' }) {
  const now = new Date();
  const timeout = await heartbeatTimeoutMinutes();

  const devices = await resolveTargetDeviceIds(targetType, targetId);
  if (!devices.length) {
    throw Object.assign(new Error('No active devices match the selected target'), { statusCode: 400 });
  }

  let success = 0;
  let offline = 0;
  const results = [];

  for (const device of devices) {
    const online = isOnline(device, now, timeout);
    if (!online) {
      offline += 1;
      results.push({ device_id: device.id, name: device.name, status: 'offline' });
      await recordHistory({ deviceId: device.id, mediaId: device.current_media_id, action: source, status: 'offline', startedAt: now, triggeredBy: createdBy, errorMessage: 'Device offline at stop time' });
      continue;
    }
    const result = sendDeviceCommand(device, 'stop', null, now);
    if (result.ok) {
      success += 1;
      results.push({ device_id: device.id, name: device.name, status: 'idle' });
      await db('multimedia_devices').where('id', device.id).update({
        status: 'idle',
        current_media_id: null,
        current_media_started_at: null,
        updated_at: now,
      });
      await recordHistory({ deviceId: device.id, mediaId: device.current_media_id, action: source, status: 'success', startedAt: now, triggeredBy: createdBy });
    } else {
      offline += 1;
      results.push({ device_id: device.id, name: device.name, status: 'failed', message: result.message });
      await recordHistory({ deviceId: device.id, mediaId: device.current_media_id, action: source, status: 'failed', startedAt: now, triggeredBy: createdBy, errorMessage: result.message });
    }
  }

  await audit(createdBy, 'stop', 'multimedia', targetType === 'all' ? null : targetId, { source, target_type: targetType, target_id: targetId, total: devices.length, success, offline });

  return { target_type: targetType, target_id: targetId || null, devices_total: devices.length, devices_success: success, devices_offline: offline, results };
}

// ── Scheduling ────────────────────────────────────────────────────────────────

function weekdayOf(date) {
  return String(date.getDay()); // 0 = Sunday
}

function isScheduleDue(schedule, now) {
  const start = new Date(schedule.start_at);
  if (now.getTime() < start.getTime()) return false;
  if (schedule.repeat_type === 'none') {
    return !schedule.last_run_at;
  }
  if (!schedule.last_run_at) return true;
  const lastRun = new Date(schedule.last_run_at);
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  switch (schedule.repeat_type) {
    case 'daily':
      return startOfDay(now) > startOfDay(lastRun);
    case 'weekly':
      return startOfDay(now) - startOfDay(lastRun) >= 7 * 86400000;
    case 'specific_days':
      return weekdayOf(now) !== weekdayOf(lastRun) && String(schedule.repeat_days || '').split(',').includes(weekdayOf(now));
    default:
      return false;
  }
}

/**
 * Runs every due schedule. Honest limitation: schedules are processed when
 * the system is asked to (on dashboard/history reads and via an explicit
 * "run due schedules" action), not by a persistent background scheduler.
 */
async function processDueSchedules(now) {
  now = now || new Date();
  const due = await db('scheduled_playbacks')
    .where('status', 'active')
    .andWhere('start_at', '<=', now)
    .andWhere(function () {
      this.whereNull('end_at').orWhere('end_at', '>', now);
    });

  let processed = 0;
  for (const schedule of due) {
    if (!isScheduleDue(schedule, now)) continue;
    try {
      await performBroadcast({
        mediaId: schedule.media_id,
        targetType: schedule.target_type,
        targetId: schedule.target_id,
        createdBy: schedule.created_by,
        priority: schedule.priority,
        source: 'schedule_start',
      });
    } catch (error) {
      await recordHistory({
        deviceId: null,
        mediaId: schedule.media_id,
        action: 'schedule_start',
        status: 'failed',
        startedAt: now,
        triggeredBy: schedule.created_by,
        errorMessage: error.message,
      });
    }
    const updates = { last_run_at: now, updated_at: now };
    if (schedule.repeat_type === 'none') updates.status = 'ended';
    await db('scheduled_playbacks').where('id', schedule.id).update(updates);
    processed += 1;
  }
  await audit(null, 'process_due_schedules', 'scheduled_playback', null, { processed });
  return processed;
}

// ── Device secrets ────────────────────────────────────────────────────────────

function generateSecret() {
  const crypto = require('crypto');
  return `nl-dev-${crypto.randomBytes(12).toString('hex')}`;
}

async function hashSecret(secret) {
  return bcrypt.hash(secret, 10);
}

function verifySecret(secret, hash) {
  return bcrypt.compare(secret, hash);
}

module.exports = {
  VIEW_ROLES,
  MANAGE_ROLES,
  INTEGRATION,
  STATUS_OPTIONS,
  TARGET_TYPES,
  REPEAT_TYPES,
  canViewMultimedia,
  canManageMultimedia,
  getSettingNum,
  heartbeatTimeoutMinutes,
  deviceLimit,
  itStaffCommandsAllowed,
  isOnline,
  audit,
  recordHistory,
  capabilitiesOf,
  sendDeviceCommand,
  refreshDeviceStatuses,
  resolveTargetDeviceIds,
  performBroadcast,
  stopPlayback,
  processDueSchedules,
  generateSecret,
  hashSecret,
  verifySecret,
  managerUserIds,
  notifyManagers,
};