const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const mm = require('../services/multimediaDeviceService');

const router = express.Router();

// ── Device heartbeat ──────────────────────────────────────────────────────────
// Registered BEFORE the user-auth middleware: devices authenticate themselves
// with X-Device-Identifier + X-Device-Secret, not with a user bearer token.
router.post('/devices/heartbeat', async (req, res) => {
  try {
    const identifier = req.headers['x-device-identifier'];
    const secret = req.headers['x-device-secret'];
    if (!identifier || !secret) {
      return res.status(401).json({ message: 'Missing device credentials' });
    }
    const device = await db('multimedia_devices').where('device_identifier', identifier).first();
    if (!device) return res.status(401).json({ message: 'Unknown device identifier' });
    if (!device.is_active) return res.status(403).json({ message: 'Device is disabled' });
    const ok = await mm.verifySecret(secret, device.device_secret_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid device secret' });

    const now = new Date();
    const wasOffline = device.status === 'offline' || device.status === 'error';
    await db('multimedia_devices').where('id', device.id).update({
      last_heartbeat_at: now,
      status: device.status === 'disabled' ? device.status : (wasOffline || device.status === 'idle' ? 'online' : device.status),
      status_message: device.status === 'error' ? null : device.status_message,
      updated_at: now,
    });

    if (wasOffline) {
      await mm.recordHistory({ deviceId: device.id, mediaId: device.current_media_id, action: 'heartbeat_online', status: 'online', startedAt: now });
    }

    const media = device.current_media_id
      ? await db('media_assets').where('id', device.current_media_id).first()
      : null;

    res.json({
      ok: true,
      server_time: now.toISOString(),
      device: {
        id: device.id,
        name: device.name,
        status: wasOffline ? 'online' : device.status,
        supported_commands: mm.capabilitiesOf(device),
      },
      command: media ? { action: 'play', media_id: media.id, title: media.title, file_url: `/api/multimedia/media/${media.id}/file`, duration_seconds: media.duration_seconds } : { action: 'idle' },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.use(authenticate);

// ── Role gates ────────────────────────────────────────────────────────────────

const requireView = (req, res, next) => {
  if (!mm.canViewMultimedia(req.user.role_name)) {
    return res.status(403).json({ message: 'Access to Multimedia Management is restricted' });
  }
  next();
};

const requireManage = (req, res, next) => {
  if (!mm.canManageMultimedia(req.user.role_name)) {
    return res.status(403).json({ message: 'Insufficient permissions: this action requires a multimedia supervisor or administrator' });
  }
  next();
};

router.use(requireView);

// ── Upload handling ───────────────────────────────────────────────────────────

const MEDIA_MIME_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const type = MEDIA_MIME_TYPES[file.mimetype];
    if (!type || ![ext, file.mimetype.split('/')[0] === 'video' ? type : ext].includes(type)) {
      return cb(Object.assign(new Error(`File type not allowed. Supported types: ${Object.keys(MEDIA_MIME_TYPES).join(', ')}`), { isFileValidationError: true }));
    }
    cb(null, true);
  },
});

function uploadSingle(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File is too large (max 100 MB)' });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
}

// ── Capabilities (UI manifest) ────────────────────────────────────────────────

router.get('/capabilities', async (req, res) => {
  try {
    res.json({
      integration: mm.INTEGRATION,
      supported_command_manifest: mm.INTEGRATION.supported_commands,
      supported_file_types: MEDIA_MIME_TYPES,
      supported_statuses: mm.STATUS_OPTIONS,
      target_types: mm.TARGET_TYPES,
      repeat_types: mm.REPEAT_TYPES,
      phase2_limitations: [
        'Emergency broadcast scenarioses handled in a later phase',
        'Advanced device commands (power, volume, mute, reboot) are not supported by the current integration',
        'Remote power management is not implemented',
        'Analytics and reporting dashboard is out of scope for this phase',
      ],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    await mm.refreshDeviceStatuses();
    await mm.processDueSchedules();

    const [total, online, offline, playing, mediaCount, activeSchedules, todayHistory, groupCount, locationCount] = await Promise.all([
      db('multimedia_devices').count({ n: '*' }).first(),
      db('multimedia_devices').where({ status: 'online' }).orWhere({ status: 'playing' }).orWhere({ status: 'idle' }).count({ n: '*' }).first(),
      db('multimedia_devices').where({ status: 'offline' }).count({ n: '*' }).first(),
      db('multimedia_devices').where({ status: 'playing' }).count({ n: '*' }).first(),
      db('media_assets').where({ status: 'active' }).count({ n: '*' }).first(),
      db('scheduled_playbacks').where({ status: 'active' }).count({ n: '*' }).first(),
      db('playback_history').whereRaw('created_at >= ?', [new Date(new Date().setHours(0, 0, 0, 0))]).count({ n: '*' }).first(),
      db('multimedia_groups').where({ is_active: true }).count({ n: '*' }).first(),
      db('multimedia_locations').count({ n: '*' }).first(),
    ]);

    const recent = await db('playback_history')
      .leftJoin('multimedia_devices', 'playback_history.device_id', 'multimedia_devices.id')
      .leftJoin('media_assets', 'playback_history.media_id', 'media_assets.id')
      .leftJoin('users', 'playback_history.triggered_by', 'users.id')
      .select('playback_history.*', 'multimedia_devices.name as device_name', 'media_assets.title as media_title', 'users.name as triggered_by_name')
      .orderBy('playback_history.created_at', 'desc')
      .limit(8);

    const errorDevices = await db('multimedia_devices')
      .leftJoin('multimedia_locations', 'multimedia_devices.location_id', 'multimedia_locations.id')
      .where('multimedia_devices.is_active', true)
      .andWhere(function () {
        this.where('multimedia_devices.status', 'error').orWhere('multimedia_devices.status', 'offline');
      })
      .select('multimedia_devices.*', 'multimedia_locations.name as location_name')
      .orderBy('multimedia_devices.updated_at', 'desc').limit(5);

    res.json({
      totals: {
        total: Number(total.n),
        online: Number(online.n),
        offline: Number(offline.n),
        playing: Number(playing.n),
        media: Number(mediaCount.n),
        schedules: Number(activeSchedules.n),
        history_today: Number(todayHistory.n),
        groups: Number(groupCount.n),
        locations: Number(locationCount.n),
      },
      recent_activity: recent,
      needs_attention: errorDevices,
      integration: mm.INTEGRATION,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Devices ───────────────────────────────────────────────────────────────────

const DEVICE_SELECT = [
  'multimedia_devices.*',
  'multimedia_locations.name as location_name',
  'multimedia_locations.level as location_level',
  'departments.name as department_name',
  'media_assets.title as current_media_title',
];

router.get('/devices', async (req, res) => {
  try {
    await mm.refreshDeviceStatuses();
    const { status, locationId, query } = req.query;
    let q = db('multimedia_devices')
      .leftJoin('multimedia_locations', 'multimedia_devices.location_id', 'multimedia_locations.id')
      .leftJoin('departments', 'multimedia_devices.department_id', 'departments.id')
      .leftJoin('media_assets', 'multimedia_devices.current_media_id', 'media_assets.id')
      .select(DEVICE_SELECT)
      .orderBy('multimedia_devices.name');
    if (status && status !== 'all') q = q.where('multimedia_devices.status', status);
    if (locationId) q = q.where('multimedia_devices.location_id', locationId);
    if (query) {
      q = q.where(function () {
        this.where('multimedia_devices.name', 'ilike', `%${query}%`)
          .orWhere('multimedia_devices.device_identifier', 'ilike', `%${query}%`)
          .orWhere('multimedia_devices.room', 'ilike', `%${query}%`)
          .orWhere('multimedia_devices.manufacturer', 'ilike', `%${query}%`)
          .orWhere('multimedia_devices.model', 'ilike', `%${query}%`);
      });
    }
    const devices = await q;
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/devices',
  requireManage,
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Device name is required'),
  body('device_type').optional().isIn(['tv', 'display', 'media_player']).withMessage('Invalid device type'),
  body('device_identifier').optional().trim().isLength({ min: 1, max: 150 }).withMessage('Invalid device identifier'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const limit = await mm.deviceLimit();
      const activeCount = await db('multimedia_devices').where('is_active', true).count({ n: '*' }).first();
      if (Number(activeCount.n) >= limit) {
        return res.status(400).json({ message: `Device limit reached (${limit}). Escalate to disable or remove a device.` });
      }

      const {
        name, device_type = 'tv', manufacturer, model, location_id, department_id,
        floor, ward, room, ip_address, connection_type = 'wifi', player_identifier, device_identifier,
      } = req.body;

      const identifier = (device_identifier || '').trim() || `nl-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dev'}-${crypto.randomBytes(3).toString('hex')}`;
      const secret = mm.generateSecret();

      const [row] = await db('multimedia_devices').insert({
        name,
        device_identifier: identifier,
        device_type,
        manufacturer,
        model,
        location_id: location_id || null,
        department_id: department_id || null,
        floor,
        ward,
        room,
        ip_address,
        connection_type,
        player_identifier,
        device_secret_hash: await mm.hashSecret(secret),
        status: 'offline',
        is_active: true,
        created_by: req.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');

      await mm.audit(req.user.id, 'device_register', 'multimedia_device', row.id, { name, device_identifier: identifier });
      res.status(201).json({ id: row.id, device_identifier: identifier, device_secret: secret });
    } catch (error) {
      if (error.code === '23505' && String(error.message).includes('device_identifier')) {
        return res.status(400).json({ message: 'A device with this identifier already exists' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

router.post('/devices/heartbeat-check', async (req, res) => {
  try {
    const devices = await db('multimedia_devices').select('id', 'name', 'status', 'last_heartbeat_at');
    await mm.refreshDeviceStatuses(new Date());
    res.json({ checked: devices.length, devices });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/devices/:id', async (req, res) => {
  try {
    const device = await db('multimedia_devices')
      .leftJoin('multimedia_locations', 'multimedia_devices.location_id', 'multimedia_locations.id')
      .leftJoin('departments', 'multimedia_devices.department_id', 'departments.id')
      .leftJoin('media_assets', 'multimedia_devices.current_media_id', 'media_assets.id')
      .where('multimedia_devices.id', req.params.id)
      .select(DEVICE_SELECT)
      .first();
    if (!device) return res.status(404).json({ message: 'Device not found' });
    const groups = await db('multimedia_group_devices')
      .join('multimedia_groups', 'multimedia_group_devices.group_id', 'multimedia_groups.id')
      .where('multimedia_group_devices.device_id', req.params.id)
      .select('multimedia_groups.id', 'multimedia_groups.name');
    device.groups = groups;
    device.capabilities = mm.capabilitiesOf(device);
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/devices/:id',
  requireManage,
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const device = await db('multimedia_devices').where('id', req.params.id).first();
      if (!device) return res.status(404).json({ message: 'Device not found' });

      const {
        name, device_type, manufacturer, model, location_id, department_id,
        floor, ward, room, ip_address, connection_type, player_identifier, is_active,
      } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (device_type !== undefined) updates.device_type = device_type;
      if (manufacturer !== undefined) updates.manufacturer = manufacturer || null;
      if (model !== undefined) updates.model = model || null;
      if (location_id !== undefined) updates.location_id = location_id || null;
      if (department_id !== undefined) updates.department_id = department_id || null;
      if (floor !== undefined) updates.floor = floor || null;
      if (ward !== undefined) updates.ward = ward || null;
      if (room !== undefined) updates.room = room || null;
      if (ip_address !== undefined) updates.ip_address = ip_address || null;
      if (connection_type !== undefined) updates.connection_type = connection_type;
      if (player_identifier !== undefined) updates.player_identifier = player_identifier || null;
      if (is_active !== undefined) updates.is_active = Boolean(is_active);
      updates.updated_at = new Date();

      await db('multimedia_devices').where('id', req.params.id).update(updates);
      await mm.audit(req.user.id, 'device_update', 'multimedia_device', device.id, { updated_fields: Object.keys(updates).filter((k) => k !== 'updated_at') });

      let secret = null;
      if (req.body.regenerate_secret === true || req.body.regenerate_secret === 'true') {
        secret = mm.generateSecret();
        await db('multimedia_devices').where('id', req.params.id).update({ device_secret_hash: await mm.hashSecret(secret) });
        await mm.audit(req.user.id, 'device_secret_regenerated', 'multimedia_device', device.id, {});
      }

      res.json({ message: 'Device updated', device_secret: secret });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.post('/devices/:id/enable', requireManage, async (req, res) => {
  try {
    const device = await db('multimedia_devices').where('id', req.params.id).first();
    if (!device) return res.status(404).json({ message: 'Device not found' });
    await db('multimedia_devices').where('id', req.params.id).update({ is_active: true, updated_at: new Date() });
    await mm.audit(req.user.id, 'device_enable', 'multimedia_device', device.id, {});
    res.json({ message: 'Device enabled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/devices/:id/disable', requireManage, async (req, res) => {
  try {
    const device = await db('multimedia_devices').where('id', req.params.id).first();
    if (!device) return res.status(404).json({ message: 'Device not found' });
    await db('multimedia_devices').where('id', req.params.id).update({ is_active: false, status: 'disabled', updated_at: new Date() });
    await mm.audit(req.user.id, 'device_disable', 'multimedia_device', device.id, {});
    res.json({ message: 'Device disabled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/devices/:id', requireManage, async (req, res) => {
  try {
    const device = await db('multimedia_devices').where('id', req.params.id).first();
    if (!device) return res.status(404).json({ message: 'Device not found' });
    await db('multimedia_devices').where('id', req.params.id).update({ is_active: false, status: 'disabled', updated_at: new Date() });
    await mm.audit(req.user.id, 'device_remove', 'multimedia_device', device.id, { name: device.name });
    res.json({ message: 'Device removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/devices/:id/command',
  async (req, res) => {
    try {
      const device = await db('multimedia_devices').where('id', req.params.id).first();
      if (!device) return res.status(404).json({ message: 'Device not found' });
      if (!device.is_active) return res.status(400).json({ message: 'Device is disabled' });
      if (req.user.role_name === 'it_staff' && !(await mm.itStaffCommandsAllowed())) {
        return res.status(403).json({ message: 'Sending device commands requires supervisor privileges (multimedia_allow_it_staff_commands is off)' });
      }

      const command = (req.body.command || '').toLowerCase();
      if (!['play', 'stop'].includes(command) || !mm.capabilitiesOf(device).includes(command)) {
        const [row] = await db('device_commands').insert({
          device_id: device.id, command, status: 'not_supported', requested_by: req.user.id, requested_at: new Date(), error_message: 'Command is not supported by the current player integration', created_at: new Date(), updated_at: new Date(),
        }).returning('id');
        await mm.audit(req.user.id, 'device_command_not_supported', 'multimedia_device', device.id, { command });
        return res.status(400).json({ message: `Command "${command}" is not supported by this device`, command_id: row.id });
      }

      const now = new Date();
      const timeout = await mm.heartbeatTimeoutMinutes();
      const online = mm.isOnline(device, now, timeout);
      if (!online) {
        const [row] = await db('device_commands').insert({
          device_id: device.id, command, status: 'failed', requested_by: req.user.id, requested_at: now, error_message: 'Device offline', created_at: now, updated_at: now,
        }).returning('id');
        await mm.recordHistory({ deviceId: device.id, mediaId: device.current_media_id, action: command, status: 'offline', startedAt: now, triggeredBy: req.user.id, errorMessage: 'Device offline' });
        await mm.audit(req.user.id, 'device_command_failed', 'multimedia_device', device.id, { command });
        return res.status(400).json({ message: 'Device is offline; command not sent', command_id: row.id });
      }

      const result = mm.sendDeviceCommand(device, command, { media_id: req.body.media_id || device.current_media_id }, now);
      const [row] = await db('device_commands').insert({
        device_id: device.id, command, parameters: req.body.media_id ? JSON.stringify({ media_id: req.body.media_id }) : null, status: result.status, requested_by: req.user.id, requested_at: now, executed_at: now, error_message: result.ok ? null : result.message, created_at: now, updated_at: now,
      }).returning('id');

      if (command === 'play' && result.ok) {
        await db('multimedia_devices').where('id', device.id).update({
          status: 'playing', current_media_id: req.body.media_id || device.current_media_id, current_media_started_at: now, updated_at: now,
        });
      } else if (command === 'stop' && result.ok) {
        await db('multimedia_devices').where('id', device.id).update({
          status: 'idle', current_media_id: null, current_media_started_at: null, updated_at: now,
        });
      }
      await mm.recordHistory({ deviceId: device.id, mediaId: req.body.media_id || device.current_media_id, action: command, status: result.ok ? 'success' : 'failed', startedAt: now, triggeredBy: req.user.id, errorMessage: result.ok ? null : result.message });
      await mm.audit(req.user.id, 'device_command', 'multimedia_device', device.id, { command, result: result.status });

      res.json({ message: result.message, status: result.status, command_id: row.id });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.get('/devices/:id/commands', async (req, res) => {
  try {
    const commands = await db('device_commands')
      .leftJoin('users', 'device_commands.requested_by', 'users.id')
      .where('device_commands.device_id', req.params.id)
      .select('device_commands.*', 'users.name as requested_by_name')
      .orderBy('device_commands.created_at', 'desc')
      .limit(50);
    res.json(commands);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Groups ────────────────────────────────────────────────────────────────────

router.get('/groups', async (req, res) => {
  try {
    const groupCounts = await db('multimedia_groups')
      .leftJoin('multimedia_group_devices', 'multimedia_groups.id', 'multimedia_group_devices.group_id')
      .leftJoin('multimedia_devices', 'multimedia_group_devices.device_id', 'multimedia_devices.id')
      .select('multimedia_groups.*')
      .countDistinct('multimedia_group_devices.device_id as device_count')
      .count({ active_count: db.raw('CASE WHEN multimedia_devices.is_active THEN 1 END') })
      .groupBy('multimedia_groups.id')
      .orderBy('multimedia_groups.name');
    res.json(groupCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/groups',
  requireManage,
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Group name is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { name, description, device_ids } = req.body;
      const [row] = await db('multimedia_groups').insert({ name, description, is_active: true, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('id');
      if (Array.isArray(device_ids) && device_ids.length) {
        const existingCount = await db('multimedia_devices').whereIn('id', device_ids).count({ n: '*' }).first();
        if (Number(existingCount.n) !== device_ids.length) {
          await db('multimedia_groups').where('id', row.id).del();
          return res.status(400).json({ message: 'One or more device ids are invalid' });
        }
        await db('multimedia_group_devices').insert(device_ids.map((device_id) => ({ group_id: row.id, device_id })));
      }
      await mm.audit(req.user.id, 'group_create', 'multimedia_group', row.id, { name });
      res.status(201).json({ id: row.id });
    } catch (error) {
      if (error.code === '23505') return res.status(400).json({ message: 'Group name already exists' });
      res.status(500).json({ message: 'Server error' });
    }
  });

router.get('/groups/:id', async (req, res) => {
  try {
    const group = await db('multimedia_groups').where('id', req.params.id).first();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const devices = await db('multimedia_group_devices')
      .join('multimedia_devices', 'multimedia_group_devices.device_id', 'multimedia_devices.id')
      .leftJoin('multimedia_locations', 'multimedia_devices.location_id', 'multimedia_locations.id')
      .select('multimedia_devices.*', 'multimedia_locations.name as location_name')
      .where('multimedia_group_devices.group_id', req.params.id);
    group.devices = devices;
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/groups/:id',
  requireManage,
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Group name is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const group = await db('multimedia_groups').where('id', req.params.id).first();
      if (!group) return res.status(404).json({ message: 'Group not found' });
      const { name, description, is_active } = req.body;
      await db('multimedia_groups').where('id', req.params.id).update({
        name, description: description || null, is_active: is_active !== undefined ? Boolean(is_active) : group.is_active, updated_at: new Date(),
      });
      await mm.audit(req.user.id, 'group_update', 'multimedia_group', group.id, { name });
      res.json({ message: 'Group updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.post('/groups/:id/devices', requireManage, async (req, res) => {
  try {
    const { device_ids } = req.body;
    if (!Array.isArray(device_ids) || !device_ids.length) {
      return res.status(400).json({ message: 'device_ids is required' });
    }
    const group = await db('multimedia_groups').where('id', req.params.id).first();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const existingCount = await db('multimedia_devices').whereIn('id', device_ids).count({ n: '*' }).first();
    if (Number(existingCount.n) !== device_ids.length) return res.status(400).json({ message: 'One or more device ids are invalid' });

    const members = await db('multimedia_group_devices').where('group_id', req.params.id).select('device_id');
    const currentIds = members.map((m) => m.device_id);
    const toAdd = device_ids.filter((id) => !currentIds.includes(Number(id)));
    if (toAdd.length) {
      await db('multimedia_group_devices').insert(toAdd.map((device_id) => ({ group_id: req.params.id, device_id })));
    }
    await mm.audit(req.user.id, 'group_add_devices', 'multimedia_group', group.id, { added: toAdd });
    res.json({ message: `Group updated`, added: toAdd.length, ignored_already_member: device_ids.length - toAdd.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/groups/:id/devices/:deviceId', requireManage, async (req, res) => {
  try {
    const group = await db('multimedia_groups').where('id', req.params.id).first();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const removed = await db('multimedia_group_devices').where({ group_id: req.params.id, device_id: req.params.deviceId }).del();
    await mm.audit(req.user.id, 'group_remove_device', 'multimedia_group', group.id, { device_id: req.params.deviceId });
    res.json({ message: removed ? 'Device removed from group' : 'Device was not in the group' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/groups/:id', requireManage, async (req, res) => {
  try {
    const group = await db('multimedia_groups').where('id', req.params.id).first();
    if (!group) return res.status(404).json({ message: 'Group not found' });
    await db('multimedia_group_devices').where('group_id', req.params.id).del();
    await db('multimedia_groups').where('id', req.params.id).del();
    await mm.audit(req.user.id, 'group_delete', 'multimedia_group', group.id, { name: group.name });
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Locations ────────────────────────────────────────────────────────────────

router.get('/locations', async (req, res) => {
  try {
    const counts = await db('multimedia_locations')
      .leftJoin('multimedia_devices', 'multimedia_locations.id', 'multimedia_devices.location_id')
      .select('multimedia_locations.*')
      .count('multimedia_devices.id as device_count')
      .groupBy('multimedia_locations.id')
      .orderBy('multimedia_locations.name');
    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/locations',
  requireManage,
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Location name is required'),
  body('level').optional().isIn(['campus', 'building', 'floor', 'ward', 'location', 'room']).withMessage('Invalid level'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const { name, level = 'location', parent_id, description } = req.body;
      if (parent_id) {
        const parent = await db('multimedia_locations').where('id', parent_id).first();
        if (!parent) return res.status(400).json({ message: 'Parent location not found' });
      }
      const [row] = await db('multimedia_locations').insert({ name, level, parent_id: parent_id || null, description, created_at: new Date(), updated_at: new Date() }).returning('id');
      await mm.audit(req.user.id, 'location_create', 'multimedia_location', row.id, { name, level, parent_id: parent_id || null });
      res.status(201).json({ id: row.id });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/locations/:id',
  requireManage,
  body('name').trim().isLength({ min: 1, max: 150 }).withMessage('Location name is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const loc = await db('multimedia_locations').where('id', req.params.id).first();
      if (!loc) return res.status(404).json({ message: 'Location not found' });
      if (req.body.parent_id && Number(req.body.parent_id) === Number(req.params.id)) {
        return res.status(400).json({ message: 'A location cannot be its own parent' });
      }
      const { name, level, parent_id, description } = req.body;
      await db('multimedia_locations').where('id', req.params.id).update({
        name, level: level || loc.level, parent_id: parent_id !== undefined ? (parent_id || null) : loc.parent_id, description: description !== undefined ? description : loc.description, updated_at: new Date(),
      });
      await mm.audit(req.user.id, 'location_update', 'multimedia_location', loc.id, { name });
      res.json({ message: 'Location updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.delete('/locations/:id', requireManage, async (req, res) => {
  try {
    const loc = await db('multimedia_locations').where('id', req.params.id).first();
    if (!loc) return res.status(404).json({ message: 'Location not found' });
    const children = await db('multimedia_locations').where('parent_id', req.params.id).count({ n: '*' }).first();
    if (Number(children.n) > 0) return res.status(400).json({ message: 'Cannot delete a location that still has child locations' });
    const devices = await db('multimedia_devices').where('location_id', req.params.id).count({ n: '*' }).first();
    if (Number(devices.n) > 0) return res.status(400).json({ message: 'Cannot delete a location that still has devices' });
    await db('multimedia_locations').where('id', req.params.id).del();
    await mm.audit(req.user.id, 'location_delete', 'multimedia_location', loc.id, { name: loc.name });
    res.json({ message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Media library ─────────────────────────────────────────────────────────────

router.get('/media/categories', async (req, res) => {
  try {
    const rows = await db('media_assets').distinct('category').orderBy('category');
    res.json(rows.map((r) => r.category));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/media', async (req, res) => {
  try {
    const { status, category, query, limit = 50, offset = 0 } = req.query;
    const base = db('media_assets').leftJoin('users', 'media_assets.uploaded_by', 'users.id');
    if (status && status !== 'all') base.where('media_assets.status', status);
    if (category) base.where('media_assets.category', category);
    if (query) {
      base.where(function () {
        this.where('media_assets.title', 'ilike', `%${query}%`)
          .orWhere('media_assets.tags', 'ilike', `%${query}%`)
          .orWhere('media_assets.description', 'ilike', `%${query}%`);
      });
    }
    const [items, count] = await Promise.all([
      base.clone().clearSelect().select('media_assets.*', 'users.name as uploaded_by_name')
        .orderBy('media_assets.created_at', 'desc')
        .limit(parseInt(limit, 10) || 50).offset(parseInt(offset, 10) || 0),
      base.clone().clearSelect().clearOrder().count({ n: '*' }).first(),
    ]);
    res.json({ items, total: Number(count.n), limit: parseInt(limit, 10) || 50, offset: parseInt(offset, 10) || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/media/:id', async (req, res) => {
  try {
    const media = await db('media_assets')
      .leftJoin('users', 'media_assets.uploaded_by', 'users.id')
      .where('media_assets.id', req.params.id)
      .select('media_assets.*', 'users.name as uploaded_by_name')
      .first();
    if (!media) return res.status(404).json({ message: 'Media not found' });
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/media/:id/file', async (req, res) => {
  try {
    const media = await db('media_assets').where('id', req.params.id).first();
    if (!media || !media.file_path) return res.status(404).json({ message: 'Media file not found' });
    const filePath = path.join(uploadsDir, path.basename(media.file_path));
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Media file not found' });
    res.setHeader('Content-Type', media.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(media.file_name || 'media.' + media.file_type)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/media',
  requireView,
  uploadSingle('file'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  (req, res, next) => {
    if (req.file && !validate(req, res)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return;
    }
    if (!req.file) return res.status(400).json({ message: 'A media file is required (png, jpg, webp, mp4, webm)' });
    next();
  },
  async (req, res) => {
    try {
      const file = req.file;
      const ext = path.extname(file.originalname).toLowerCase().slice(1);
      const { title, description, category = 'General Information', tags } = req.body;
      const [row] = await db('media_assets').insert({
        title,
        description: description || null,
        category,
        file_name: file.originalname,
        file_path: file.filename,
        file_type: ext,
        mime_type: file.mimetype,
        file_size: file.size,
        tags: tags || null,
        status: 'active',
        uploaded_by: req.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');
      await mm.audit(req.user.id, 'media_upload', 'media_asset', row.id, { title, category, file_type: ext });
      res.status(201).json({ id: row.id, title });
    } catch (error) {
      if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/media/:id',
  uploadSingle('file'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Invalid title'),
  (req, res, next) => {
    if (req.file && !validate(req, res)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return;
    }
    next();
  },
  async (req, res) => {
    try {
      const media = await db('media_assets').where('id', req.params.id).first();
      if (!media) { if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} } return res.status(404).json({ message: 'Media not found' }); }

      const { title, description, category, tags } = req.body;
      const updates = { updated_at: new Date() };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description || null;
      if (category !== undefined) updates.category = category;
      if (tags !== undefined) updates.tags = tags || null;
      if (req.file) {
        updates.file_name = req.file.originalname;
        updates.file_path = req.file.filename;
        updates.file_type = path.extname(req.file.originalname).toLowerCase().slice(1);
        updates.mime_type = req.file.mimetype;
        updates.file_size = req.file.size;
        if (media.file_path && media.file_path !== req.file.filename) {
          const oldPath = path.join(uploadsDir, path.basename(media.file_path));
          try { fs.unlinkSync(oldPath); } catch (e) {}
        }
      }
      await db('media_assets').where('id', req.params.id).update(updates);
      await mm.audit(req.user.id, 'media_update', 'media_asset', media.id, { updated_fields: Object.keys(updates).filter((k) => k !== 'updated_at') });
      res.json({ message: 'Media updated' });
    } catch (error) {
      if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
      res.status(500).json({ message: 'Server error' });
    }
  });

router.post('/media/:id/activate', requireManage, async (req, res) => {
  try {
    const media = await db('media_assets').where('id', req.params.id).first();
    if (!media) return res.status(404).json({ message: 'Media not found' });
    await db('media_assets').where('id', req.params.id).update({ status: 'active', updated_at: new Date() });
    await mm.audit(req.user.id, 'media_activate', 'media_asset', media.id, {});
    res.json({ message: 'Media activated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/media/:id/archive', requireManage, async (req, res) => {
  try {
    const media = await db('media_assets').where('id', req.params.id).first();
    if (!media) return res.status(404).json({ message: 'Media not found' });
    await db('media_assets').where('id', req.params.id).update({ status: 'archived', updated_at: new Date() });
    await mm.audit(req.user.id, 'media_archive', 'media_asset', media.id, {});
    res.json({ message: 'Media archived' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/media/:id/draft', requireManage, async (req, res) => {
  try {
    const media = await db('media_assets').where('id', req.params.id).first();
    if (!media) return res.status(404).json({ message: 'Media not found' });
    await db('media_assets').where('id', req.params.id).update({ status: 'draft', updated_at: new Date() });
    await mm.audit(req.user.id, 'media_draft', 'media_asset', media.id, {});
    res.json({ message: 'Media moved to draft' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/media/:id', requireManage, async (req, res) => {
  try {
    const media = await db('media_assets').where('id', req.params.id).first();
    if (!media) return res.status(404).json({ message: 'Media not found' });
    const inUse = await db('playback_assignments').where('media_id', req.params.id).andWhere('status', 'active').first();
    if (inUse) return res.status(400).json({ message: 'Media is currently playing; stop broadcasts first' });
    await db('media_assets').where('id', req.params.id).update({ status: 'archived', updated_at: new Date() });
    await mm.audit(req.user.id, 'media_delete', 'media_asset', media.id, { title: media.title });
    res.json({ message: 'Media archived (kept for history and file integrity)' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Broadcast ────────────────────────────────────────────────────────────────

router.post('/broadcast/stop',
  body('target_type').isIn(mm.TARGET_TYPES).withMessage('Invalid target type'),
  body('target_id').optional().isInt({ min: 1 }).withMessage('Invalid target id'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const result = await mm.stopPlayback({ targetType: req.body.target_type, targetId: req.body.target_id, createdBy: req.user.id });
      res.json(result);
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ message: error.message });
    }
  });

router.post('/broadcast',
  body('media_id').isInt({ min: 1 }).withMessage('media_id is required'),
  body('target_type').isIn(mm.TARGET_TYPES).withMessage('Invalid target type'),
  body('target_id').optional().isInt({ min: 1 }).withMessage('Invalid target id'),
  body('priority').optional().isInt({ min: 0, max: 2 }).withMessage('Priority must be 0-2'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const result = await mm.performBroadcast({
        mediaId: req.body.media_id,
        targetType: req.body.target_type,
        targetId: req.body.target_id,
        createdBy: req.user.id,
        priority: req.body.priority || 0,
      });
      res.status(201).json(result);
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ message: error.message });
    }
  });

// ── Schedules ────────────────────────────────────────────────────────────────

router.get('/schedules', async (req, res) => {
  try {
    const schedules = await db('scheduled_playbacks')
      .leftJoin('media_assets', 'scheduled_playbacks.media_id', 'media_assets.id')
      .leftJoin('users', 'scheduled_playbacks.created_by', 'users.id')
      .leftJoin('multimedia_devices as td', function () {
        this.on('scheduled_playbacks.target_type', '=', db.raw("'device'")).andOn('td.id', '=', 'scheduled_playbacks.target_id');
      })
      .leftJoin('multimedia_groups as tg', function () {
        this.on('scheduled_playbacks.target_type', '=', db.raw("'group'")).andOn('tg.id', '=', 'scheduled_playbacks.target_id');
      })
      .select(
        'scheduled_playbacks.*',
        'media_assets.title as media_title',
        'users.name as created_by_name',
        'td.name as target_device_name',
        'tg.name as target_group_name'
      )
      .orderBy('scheduled_playbacks.start_at', 'desc');
    const withSummary = schedules.map((s) => ({
      ...s,
      target_summary:
        s.target_type === 'device' ? (s.target_device_name || 'device') :
        s.target_type === 'group' ? (s.target_group_name || 'group') : 'All devices',
    }));
    res.json(withSummary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/schedules',
  body('media_id').isInt({ min: 1 }).withMessage('media_id is required'),
  body('target_type').isIn(mm.TARGET_TYPES).withMessage('Invalid target type'),
  body('target_id').optional().isInt({ min: 1 }).withMessage('Invalid target id'),
  body('start_at').isISO8601().withMessage('Start time is required (ISO date)'),
  body('end_at').optional().isISO8601().withMessage('Invalid end time'),
  body('repeat_type').optional().isIn(mm.REPEAT_TYPES).withMessage('Invalid repeat type'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const media = await db('media_assets').where('id', req.body.media_id).first();
      if (!media) return res.status(404).json({ message: 'Media not found' });
      if (media.status !== 'active') return res.status(400).json({ message: 'Only active media can be scheduled' });

      const { media_id, target_type, target_id, start_at, end_at, repeat_type = 'none', repeat_days, priority = 0, title } = req.body;
      if (repeat_type === 'specific_days' && !(repeat_days && repeat_days.every ? true : /^[0-6](,[0-6])*$/.test(repeat_days || ''))) {
        return res.status(400).json({ message: 'repeat_days must be comma-separated weekdays 0-6 (0=Sunday)' });
      }

      const [row] = await db('scheduled_playbacks').insert({
        title: title ? String(title).trim().slice(0, 200) || null : null,
        media_id,
        target_type,
        target_id: target_type === 'all' ? null : (target_id || null),
        start_at: new Date(start_at),
        end_at: end_at ? new Date(end_at) : null,
        repeat_type,
        repeat_days: repeat_type === 'specific_days' ? (Array.isArray(repeat_days) ? repeat_days.join(',') : String(repeat_days)) : null,
        priority,
        status: 'active',
        created_by: req.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');
      await mm.audit(req.user.id, 'schedule_create', 'scheduled_playback', row.id, { media_id, target_type, target_id: target_id || null, repeat_type });
      res.status(201).json({ id: row.id });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.put('/schedules/:id',
  body('status').optional().isIn(['active', 'paused', 'ended']).withMessage('Invalid status'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const schedule = await db('scheduled_playbacks').where('id', req.params.id).first();
      if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
      const { media_id, start_at, end_at, repeat_type, repeat_days, priority, status } = req.body;
      const updates = { updated_at: new Date() };
      if (media_id !== undefined) updates.media_id = media_id;
      if (start_at !== undefined) updates.start_at = new Date(start_at);
      if (end_at !== undefined) updates.end_at = end_at ? new Date(end_at) : null;
      if (repeat_type !== undefined) updates.repeat_type = repeat_type;
      if (repeat_days !== undefined) updates.repeat_days = Array.isArray(repeat_days) ? repeat_days.join(',') : repeat_days;
      if (priority !== undefined) updates.priority = priority;
      if (status !== undefined) updates.status = status;
      await db('scheduled_playbacks').where('id', req.params.id).update(updates);
      await mm.audit(req.user.id, 'schedule_update', 'scheduled_playback', schedule.id, { updated_fields: Object.keys(updates).filter((k) => k !== 'updated_at') });
      res.json({ message: 'Schedule updated' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

router.post('/schedules/:id/pause', async (req, res) => {
  try {
    const schedule = await db('scheduled_playbacks').where('id', req.params.id).first();
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    await db('scheduled_playbacks').where('id', req.params.id).update({ status: 'paused', updated_at: new Date() });
    await mm.audit(req.user.id, 'schedule_pause', 'scheduled_playback', schedule.id, {});
    res.json({ message: 'Schedule paused' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/schedules/:id/resume', async (req, res) => {
  try {
    const schedule = await db('scheduled_playbacks').where('id', req.params.id).first();
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    await db('scheduled_playbacks').where('id', req.params.id).update({ status: 'active', updated_at: new Date() });
    await mm.audit(req.user.id, 'schedule_resume', 'scheduled_playback', schedule.id, {});
    res.json({ message: 'Schedule resumed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/schedules/:id/end', async (req, res) => {
  try {
    const schedule = await db('scheduled_playbacks').where('id', req.params.id).first();
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    await db('scheduled_playbacks').where('id', req.params.id).update({ status: 'ended', updated_at: new Date() });
    await mm.audit(req.user.id, 'schedule_end', 'scheduled_playback', schedule.id, {});
    res.json({ message: 'Schedule ended' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/schedules/:id', async (req, res) => {
  try {
    const schedule = await db('scheduled_playbacks').where('id', req.params.id).first();
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    await db('scheduled_playbacks').where('id', req.params.id).del();
    await mm.audit(req.user.id, 'schedule_delete', 'scheduled_playback', schedule.id, {});
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/schedules/process', async (req, res) => {
  try {
    const processed = await mm.processDueSchedules(new Date());
    res.json({ processed, message: `${processed} due schedule(s) processed` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── History, commands, audit ──────────────────────────────────────────────────

router.get('/history', async (req, res) => {
  try {
    const { deviceId, mediaId, action, status, limit = 50, offset = 0 } = req.query;
    const base = db('playback_history')
      .leftJoin('multimedia_devices', 'playback_history.device_id', 'multimedia_devices.id')
      .leftJoin('media_assets', 'playback_history.media_id', 'media_assets.id')
      .leftJoin('users', 'playback_history.triggered_by', 'users.id');
    if (deviceId) base.where('playback_history.device_id', deviceId);
    if (mediaId) base.where('playback_history.media_id', mediaId);
    if (action) base.where('playback_history.action', action);
    if (status) base.where('playback_history.status', status);
    const [items, count] = await Promise.all([
      base.clone().clearSelect()
        .select('playback_history.*', 'multimedia_devices.name as device_name', 'media_assets.title as media_title', 'users.name as triggered_by_name')
        .orderBy('playback_history.created_at', 'desc')
        .limit(parseInt(limit, 10) || 50).offset(parseInt(offset, 10) || 0),
      base.clone().clearSelect().clearOrder().count({ n: '*' }).first(),
    ]);
    res.json({ items, total: Number(count.n), limit: parseInt(limit, 10) || 50, offset: parseInt(offset, 10) || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/commands', async (req, res) => {
  try {
    const commands = await db('device_commands')
      .leftJoin('multimedia_devices', 'device_commands.device_id', 'multimedia_devices.id')
      .leftJoin('users', 'device_commands.requested_by', 'users.id')
      .select('device_commands.*', 'multimedia_devices.name as device_name', 'users.name as requested_by_name')
      .orderBy('device_commands.created_at', 'desc')
      .limit(200);
    res.json(commands);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/commands/:id/redeliver', requireManage, async (req, res) => {
  try {
    const row = await db('device_commands').where('id', req.params.id).first();
    if (!row) return res.status(404).json({ message: 'Command not found' });
    const device = await db('multimedia_devices').where('id', row.device_id).first();
    if (!device) return res.status(404).json({ message: 'Device not found' });
    if (!device.is_active) return res.status(400).json({ message: 'Device is disabled' });

    const command = row.command;
    const supported = mm.capabilitiesOf(device);
    if (!supported.includes(command)) {
      await db('device_commands').where('id', row.id).update({
        status: 'not_supported',
        error_message: 'Command is not supported by the current player integration',
        updated_at: new Date(),
      });
      await mm.audit(req.user.id, 'device_command_not_supported', 'multimedia_device', device.id, { command });
      return res.status(400).json({ message: `Command "${command}" is not supported by this device` });
    }

    const now = new Date();
    const timeout = await mm.heartbeatTimeoutMinutes();
    let params = null;
    if (row.parameters) {
      try { params = JSON.parse(row.parameters); } catch (e) { params = null; }
    }
    const mediaId = (params && params.media_id) || device.current_media_id;
    if (!mm.isOnline(device, now, timeout)) {
      await db('device_commands').where('id', row.id).update({
        status: 'failed',
        error_message: 'Device offline',
        updated_at: now,
      });
      await mm.recordHistory({ deviceId: device.id, mediaId, action: command, status: 'offline', startedAt: now, triggeredBy: req.user.id, errorMessage: 'Device offline' });
      await mm.audit(req.user.id, 'device_command_failed', 'multimedia_device', device.id, { command });
      return res.status(400).json({ message: 'Device is offline; command not sent' });
    }

    const result = mm.sendDeviceCommand(device, command, params, now);
    const updates = {
      status: result.ok ? 'succeeded' : 'failed',
      executed_at: result.ok ? now : row.executed_at,
      error_message: result.ok ? null : result.message,
      updated_at: now,
    };
    await db('device_commands').where('id', row.id).update(updates);

    if (command === 'play' && result.ok) {
      await db('multimedia_devices').where('id', device.id).update({
        status: 'playing', current_media_id: mediaId, current_media_started_at: now, updated_at: now,
      });
    } else if (command === 'stop' && result.ok) {
      await db('multimedia_devices').where('id', device.id).update({
        status: 'idle', current_media_id: null, current_media_started_at: null, updated_at: now,
      });
    }
    await mm.recordHistory({ deviceId: device.id, mediaId, action: command, status: result.ok ? 'success' : 'failed', startedAt: now, triggeredBy: req.user.id, errorMessage: result.ok ? null : result.message });
    await mm.audit(req.user.id, 'device_command_redelivered', 'multimedia_device', device.id, { command, result: result.status });
    res.json({ message: result.message, status: result.status, command_id: row.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/audit', async (req, res) => {
  try {
    const { limit = 100, offset = 0, entityType } = req.query;
    const base = db('multimedia_audit').leftJoin('users', 'multimedia_audit.user_id', 'users.id');
    if (entityType) base.where('multimedia_audit.entity_type', entityType);
    const [items, count] = await Promise.all([
      base.clone().clearSelect().select('multimedia_audit.*', 'users.name as user_name')
        .orderBy('multimedia_audit.created_at', 'desc')
        .limit(parseInt(limit, 10) || 100).offset(parseInt(offset, 10) || 0),
      base.clone().clearSelect().clearOrder().count({ n: '*' }).first(),
    ]);
    res.json({ items, total: Number(count.n) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Settings ──────────────────────────────────────────────────────────────────

router.get('/settings', requireManage, async (req, res) => {
  try {
    const settings = await db('system_settings').where('category', 'multimedia').orderBy('key');
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/settings/:key',
  requireManage,
  body('value').exists({ values: 'falsy' }).withMessage('value is required'),
  (req, res, next) => { if (validate(req, res)) next(); },
  async (req, res) => {
    try {
      const allowed = ['multimedia_heartbeat_timeout_minutes', 'multimedia_device_limit', 'multimedia_allow_it_staff_commands'];
      if (!allowed.includes(req.params.key)) return res.status(400).json({ message: 'Unknown multimedia setting' });
      const setting = await db('system_settings').where('key', req.params.key).first();
      if (!setting) return res.status(404).json({ message: 'Setting not found' });

      let value = String(req.body.value).trim();
      if (req.params.key === 'multimedia_heartbeat_timeout_minutes') {
        const n = parseInt(value, 10);
        if (!Number.isFinite(n) || n < 1 || n > 1440) return res.status(400).json({ message: 'Heartbeat timeout must be between 1 and 1440 minutes' });
        value = String(n);
      } else if (req.params.key === 'multimedia_device_limit') {
        const n = parseInt(value, 10);
        if (!Number.isFinite(n) || n < 1 || n > 100000) return res.status(400).json({ message: 'Device limit must be between 1 and 100000' });
        value = String(n);
      } else {
        if (!['true', 'false'].includes(value.toLowerCase())) return res.status(400).json({ message: 'Value must be true or false' });
        value = value.toLowerCase();
      }

      await db('system_settings').where('key', req.params.key).update({ value, updated_at: new Date() });
      await mm.audit(req.user.id, 'setting_update', 'system_setting', null, { key: req.params.key, value });
      res.json({ message: 'Setting updated', key: req.params.key, value });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;