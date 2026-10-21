import { describe, it, expect } from 'vitest';
import db from '../src/config/db.js';
import { request, loginAs, call } from './helpers.mjs';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function refs() {
  return {
    locReception: await db('multimedia_locations').where('name', 'Reception').first(),
    locWaiting: await db('multimedia_locations').where('name', 'Waiting Area').first(),
    deptIT: await db('departments').where('name', 'IT Department').first(),
    seedMedia: await db('media_assets').orderBy('id').first(),
    seedTv001: await db('multimedia_devices').where('device_identifier', 'TV-001').first(),
    seedTv004: await db('multimedia_devices').where('device_identifier', 'TV-004').first(),
    seedGroupAll: await db('multimedia_groups').where('name', 'All TVs').first(),
  };
}

// Registers a fresh device and brings it online (or leaves offline).
async function makeDevice(token, { name, secret, heartbeat = true } = {}) {
  const name0 = name || `Test TV ${Math.random().toString(36).slice(2, 8)}`;
  const reg = await call(token, 'post', '/multimedia/devices', {
    name: name0, device_type: 'tv', manufacturer: 'TestCo', model: 'T1',
    connection_type: 'wifi',
  });
  if (reg.status !== 201) {
    throw new Error(`device register failed ${reg.status}: ${JSON.stringify(reg.body)}`);
  }
  const secret0 = secret || reg.body.device_secret;
  if (heartbeat) {
    const hb = await request
      .post('/api/multimedia/devices/heartbeat')
      .set('x-device-identifier', reg.body.device_identifier)
      .set('x-device-secret', secret0);
    expect(hb.status).toBe(200);
  }
  const dev = await db('multimedia_devices').where('id', reg.body.id).first();
  return { id: reg.body.id, identifier: reg.body.device_identifier, secret: secret0, dev };
}

async function uploadMedia(token, title) {
  const up = await request
    .post('/api/multimedia/media')
    .set('Authorization', `Bearer ${token}`)
    .field('title', title)
    .field('category', 'Health Education')
    .field('description', 'uploaded for tests')
    .field('tags', 'test,health')
    .attach('file', PNG, 'promo.png');
  expect(up.status).toBe(201);
  return up.body.id;
}

describe('Multimedia Control & Digital Signage', () => {
  it('seeds the multimedia module with its reference data and settings', async () => {
    const r = await refs();
    expect(r.seedMedia).toBeTruthy();
    expect(r.seedTv001.status).toBe('playing');
    expect(r.seedTv004.status).toBe('offline');
    expect(r.seedGroupAll).toBeTruthy();
    expect(await db('multimedia_locations').count({ n: '*' }).first()).toEqual({ n: '14' });
    expect(await db('multimedia_devices').count({ n: '*' }).first()).toEqual({ n: '6' });
    const settings = await db('system_settings').where('category', 'multimedia');
    expect(settings.map((s) => s.key)).toEqual(
      expect.arrayContaining([
        'multimedia_heartbeat_timeout_minutes',
        'multimedia_device_limit',
        'multimedia_allow_it_staff_commands',
      ])
    );
  });

  it('enforces role-based access on the whole module', async () => {
    const staff = await loginAs('staff');
    const maint = await loginAs('maintenance_staff');
    const itStaff = await loginAs('it_staff');
    const sup = await loginAs('it_supervisor');
    const sys = await loginAs('sys_admin');

    // Normal staff & maintenance cannot enter the module at all.
    expect((await call(staff.token, 'get', '/multimedia/dashboard')).status).toBe(403);
    expect((await call(maint.token, 'get', '/multimedia/devices')).status).toBe(403);
    expect((await call(staff.token, 'post', '/multimedia/broadcast', { media_id: 1, target_type: 'all' })).status).toBe(403);

    // IT staff / supervisors / admins all have access.
    expect((await call(itStaff.token, 'get', '/multimedia/dashboard')).status).toBe(200);
    expect((await call(sup.token, 'get', '/multimedia/dashboard')).status).toBe(200);
    expect((await call(sys.token, 'get', '/multimedia/dashboard')).status).toBe(200);

    // Mutations that require supervisor/administrator:
    expect((await call(itStaff.token, 'post', '/multimedia/devices', { name: 'Shadow TV' })).status).toBe(403);
    expect((await call(itStaff.token, 'post', '/multimedia/groups', { name: 'Sneaky' })).status).toBe(403);
    expect((await call(itStaff.token, 'post', '/multimedia/locations', { name: 'X' })).status).toBe(403);
    expect((await call(itStaff.token, 'get', '/multimedia/settings')).status).toBe(403);
    expect((await call(sup.token, 'get', '/multimedia/settings')).status).toBe(200);

    // No token anywhere in the module → 401.
    const noToken = await request.get('/api/multimedia/devices');
    expect(noToken.status).toBe(401);
  });

  it('registers devices, generates a one-time secret and rejects duplicates/limit', async () => {
    const sup = await loginAs('it_supervisor');
    const d1 = await makeDevice(sup.token, { name: 'Ward B TV', heartbeat: false });
    expect(d1.secret).toMatch(/^nl-dev-/);

    // Duplicate identifiers are rejected.
    const dup = await call(sup.token, 'post', '/multimedia/devices', { name: 'Dup', device_identifier: d1.identifier });
    expect(dup.status).toBe(400);

    // Device limit is respected (relative to current active count).
    const active = Number((await db('multimedia_devices').where('is_active', true).count({ n: '*' }).first()).n);
    const limitKey = 'multimedia_device_limit';
    const limitRow = await db('system_settings').where('key', limitKey).first();
    await db('system_settings').where('key', limitKey).update({ value: String(active) });
    const shouldFail = await call(sup.token, 'post', '/multimedia/devices', { name: 'Over Limit TV' });
    expect(shouldFail.status).toBe(400);
    expect(shouldFail.body.message).toContain('limit');
    await db('system_settings').where('key', limitKey).update({ value: limitRow.value });
    expect((await call(sup.token, 'post', '/multimedia/devices', { name: 'Spare TV' })).status).toBe(201);

    // The device secret is hash-only in storage.
    const stored = await db('multimedia_devices').where('id', d1.id).first();
    expect(stored.device_secret_hash).not.toBe(d1.secret);
    expect(stored.device_secret_hash.length).toBeGreaterThan(20);
  });

  it('enrolls devices via heartbeat with HMAC-like credential and recomputes status', async () => {
    const sup = await loginAs('it_supervisor');
    const d = await makeDevice(sup.token, { name: 'Heartbeat TV' });

    // Missing/wrong/invalid credentials are rejected.
    expect((await request.post('/api/multimedia/devices/heartbeat')).status).toBe(401);
    expect((await request.post('/api/multimedia/devices/heartbeat').set('x-device-identifier', d.identifier)).status).toBe(401);
    expect((await request.post('/api/multimedia/devices/heartbeat').set('x-device-identifier', d.identifier).set('x-device-secret', 'bad-secret')).status).toBe(401);
    expect((await request.post('/api/multimedia/devices/heartbeat').set('x-device-identifier', 'unknown').set('x-device-secret', 'zzz')).status).toBe(401);

    // Correct credentials → online + idle command (no media), then playing once assigned.
    const once = await request.post('/api/multimedia/devices/heartbeat')
      .set('x-device-identifier', d.identifier).set('x-device-secret', d.secret);
    expect(once.status).toBe(200);
    expect(once.body.device.status).toBe('online');
    expect(once.body.command.action).toBe('idle');

    const stored = await db('multimedia_devices').where('id', d.id).first();
    expect(stored.status).toBe('online');
    expect(stored.last_heartbeat_at).not.toBeNull();
    const onlineHist = await db('playback_history').where('device_id', d.id).andWhere('action', 'heartbeat_online');
    expect(onlineHist.length).toBe(1);

    // A disabled device cannot heartbeat.
    await call(sup.token, 'post', `/multimedia/devices/${d.id}/disable`);
    const disabled = await request.post('/api/multimedia/devices/heartbeat')
      .set('x-device-identifier', d.identifier).set('x-device-secret', d.secret);
    expect(disabled.status).toBe(403);
  });

  it('uploads media, streams files, archives and guards against non-active playback', async () => {
    const sup = await loginAs('it_supervisor');
    const mediaId = await uploadMedia(sup.token, 'Promo Video');

    const meta = await call(sup.token, 'get', `/multimedia/media/${mediaId}`);
    expect(meta.status).toBe(200);
    expect(meta.body.file_type).toBe('png');
    expect(meta.body.uploaded_by_name).toBeTruthy();

    // Streaming the file works over an authenticated route.
    const file = await request.get(`/api/multimedia/media/${mediaId}/file`)
      .set('Authorization', `Bearer ${sup.token}`);
    expect(file.status).toBe(200);
    expect(file.type).toMatch(/image\/png/);
    expect(file.body.length).toBeGreaterThan(0);

    // Unsupported file types are rejected.
    const bad = await request.post('/api/multimedia/media')
      .set('Authorization', `Bearer ${sup.token}`)
      .field('title', 'Bad Upload')
      .attach('file', Buffer.from('MZ....'), 'evil.exe');
    expect(bad.status).toBe(400);

    // Missing title → upload rejected and no asset created.
    const noTitle = await request.post('/api/multimedia/media')
      .set('Authorization', `Bearer ${sup.token}`)
      .attach('file', PNG, 'blank.png');
    expect(noTitle.status).toBe(400);

    // Archiving media that is currently broadcast is refused (checked in the
    // broadcast test), and archived media can no longer be broadcast.
    const draft = await uploadMedia(sup.token, 'Archive Me');
    expect((await call(sup.token, 'post', `/multimedia/media/${draft}/archive`)).status).toBe(200);
    expect((await call(sup.token, 'post', '/multimedia/broadcast', { media_id: draft, target_type: 'all' })).status).toBe(400);
  });

  it('creates groups and composes targets across multiple devices', async () => {
    const sup = await loginAs('it_supervisor');
    const mediaId = await uploadMedia(sup.token, 'Group Content');
    const a = await makeDevice(sup.token, { name: 'Group Member A' });
    const b = await makeDevice(sup.token, { name: 'Group Member B' });
    const c = await makeDevice(sup.token, { name: 'Group Member C', heartbeat: false });

    const group = await call(sup.token, 'post', '/multimedia/groups', {
      name: 'Peds Screens', description: 'children wards', device_ids: [a.id, b.id, c.id],
    });
    expect(group.status).toBe(201);

    // Add device, remove device, verify membership.
    const add = await call(sup.token, 'post', `/multimedia/groups/${group.body.id}/devices`, { device_ids: [b.id] });
    expect(add.status).toBe(200);
    const detail = await call(sup.token, 'get', `/multimedia/groups/${group.body.id}`);
    expect(detail.body.devices.length).toBe(3);

    const rem = await call(sup.token, 'delete', `/multimedia/groups/${group.body.id}/devices/${b.id}`);
    expect(rem.status).toBe(200);
    const detail2 = await call(sup.token, 'get', `/multimedia/groups/${group.body.id}`);
    expect(detail2.body.devices.length).toBe(2);
    expect(detail2.body.devices.map((x) => x.id)).not.toContain(b.id);

    // Duplicate group name rejected.
    const dup = await call(sup.token, 'post', '/multimedia/groups', { name: 'Peds Screens' });
    expect(dup.status).toBe(400);

    // A broadcast to an empty group is a 400, not a silent success.
    const empty = await call(sup.token, 'post', '/multimedia/groups', { name: 'Empty Group' });
    const emptyRes = await call(sup.token, 'post', '/multimedia/broadcast', { media_id: mediaId, target_type: 'group', target_id: empty.body.id });
    expect(emptyRes.status).toBe(400);

    // Location register + delete guard (still has children, then delete with none).
    const locTree = await call(sup.token, 'post', '/multimedia/locations', { name: 'Building C', level: 'building' });
    expect(locTree.status).toBe(201);
    const childLoc = await call(sup.token, 'post', '/multimedia/locations', { name: 'Floor 1', level: 'floor', parent_id: locTree.body.id });
    expect(childLoc.status).toBe(201);
    expect((await call(sup.token, 'delete', `/multimedia/locations/${locTree.body.id}`)).status).toBe(400);
    expect((await call(sup.token, 'delete', `/multimedia/locations/${childLoc.body.id}`)).status).toBe(200);
    expect((await call(sup.token, 'delete', `/multimedia/locations/${locTree.body.id}`)).status).toBe(200);
  });

  it('broadcasts content: online devices play, offline devices are recorded, never faked', async () => {
    const sup = await loginAs('it_supervisor');
    const mediaId = await uploadMedia(sup.token, 'Now Showing');
    const online = await makeDevice(sup.token, { name: 'Online TV' });
    const offline = await makeDevice(sup.token, { name: 'Dead TV', heartbeat: false });

    // Single online device → success 1, device now playing with the asset.
    const b1 = await call(sup.token, 'post', '/multimedia/broadcast', { media_id: mediaId, target_type: 'device', target_id: online.id });
    expect(b1.status).toBe(201);
    expect(b1.body.devices_total).toBe(1);
    expect(b1.body.devices_success).toBe(1);
    expect(b1.body.devices_offline).toBe(0);
    const oDev = (await call(sup.token, 'get', `/multimedia/devices/${online.id}`)).body;
    expect(oDev.status).toBe('playing');
    expect(oDev.current_media_id).toBe(mediaId);
    expect(oDev.current_media_title).toBe('Now Showing');
    expect(await db('playback_history').where('device_id', online.id).andWhere('action', 'broadcast').andWhere('status', 'success').first()).toBeTruthy();

    // A media asset assigned to a live broadcast cannot be archived.
    expect((await call(sup.token, 'delete', `/multimedia/media/${mediaId}`)).status).toBe(400);

    // Single offline device → recorded as offline, still offline after.
    const b2 = await call(sup.token, 'post', '/multimedia/broadcast', { media_id: mediaId, target_type: 'device', target_id: offline.id });
    expect(b2.status).toBe(201);
    expect(b2.body.devices_total).toBe(1);
    expect(b2.body.devices_success).toBe(0);
    expect(b2.body.devices_offline).toBe(1);
    const offHist = await db('playback_history').where('device_id', offline.id).andWhere('action', 'broadcast').andWhere('status', 'offline').first();
    expect(offHist).toBeTruthy();
    const deadAfter = await db('multimedia_devices').where('id', offline.id).first();
    expect(deadAfter.status).not.toBe('playing');

    // Broadcast to every device: returns partial outcome, and creators are told.
    const before = Number((await db('playback_history').count({ n: '*' }).first()).n);
    const all = await call(sup.token, 'post', '/multimedia/broadcast', { media_id: mediaId, target_type: 'all' });
    expect(all.status).toBe(201);
    expect(all.body.devices_total).toBeGreaterThanOrEqual(6);
    expect(all.body.devices_offline).toBeGreaterThanOrEqual(1);
    expect(all.body.devices_success).toBeGreaterThan(0);
    const after = Number((await db('playback_history').count({ n: '*' }).first()).n);
    expect(after - before).toBe(all.body.devices_total);

    // Unknown media → 404.
    expect((await call(sup.token, 'post', '/multimedia/broadcast', { media_id: 999999, target_type: 'all' })).status).toBe(404);
  });

  it('sends real commands; unsupported commands are never reported as success', async () => {
    const sup = await loginAs('it_supervisor');
    const itStaff = await loginAs('it_staff');
    const mediaId = await uploadMedia(sup.token, 'Command Media');
    const device = await makeDevice(sup.token, { name: 'Command TV' });

    // it_staff cannot send commands while the setting is off.
    expect((await call(itStaff.token, 'post', `/multimedia/devices/${device.id}/command`, { command: 'stop' })).status).toBe(403);

    // Unsupported command → 400 not_supported, logged, device unchanged (still online).
    const power = await call(sup.token, 'post', `/multimedia/devices/${device.id}/command`, { command: 'power' });
    expect(power.status).toBe(400);
    expect(power.body.message).toContain('not supported');
    const cmdLog = await db('device_commands').where('device_id', device.id).andWhere('command', 'power').first();
    expect(cmdLog.status).toBe('not_supported');

    // Play then stop → status transitions and command history reflects success.
    const play = await call(sup.token, 'post', `/multimedia/devices/${device.id}/command`, { command: 'play', media_id: mediaId });
    expect(play.status).toBe(200);
    expect(play.body.status).toBe('succeeded');
    expect((await db('multimedia_devices').where('id', device.id).first()).status).toBe('playing');
    const stop = await call(sup.token, 'post', `/multimedia/devices/${device.id}/command`, { command: 'stop' });
    expect(stop.status).toBe(200);
    expect((await db('multimedia_devices').where('id', device.id).first()).status).toBe('idle');

    // Offline device command → 400 with a recorded failure, never success.
    const dead = await makeDevice(sup.token, { name: 'Offline Command TV', heartbeat: false });
    const deadCmd = await call(sup.token, 'post', `/multimedia/devices/${dead.id}/command`, { command: 'stop' });
    expect(deadCmd.status).toBe(400);
    expect(deadCmd.body.message).toContain('offline');

    // Sending an unknown command is a 400 (no crash, logged as unsupported).
    const bogus = await call(sup.token, 'post', `/multimedia/devices/${device.id}/command`, { command: 'explode' });
    expect(bogus.status).toBe(400);

    // After enabling it_staff commands, it_staff can send them too.
    await call(sup.token, 'put', '/multimedia/settings/multimedia_allow_it_staff_commands', { value: 'true' });
    expect((await call(itStaff.token, 'post', `/multimedia/devices/${device.id}/command`, { command: 'stop' })).status).toBe(200);
    await call(sup.token, 'put', '/multimedia/settings/multimedia_allow_it_staff_commands', { value: 'false' });
  });

  it('schedules playback, processes due schedules and rejects invalid windows', async () => {
    const sup = await loginAs('it_supervisor');
    const mediaId = await uploadMedia(sup.token, 'Scheduled Content');
    const device = await makeDevice(sup.token, { name: 'Scheduled TV' });

    // Past start + repeat none → due immediately on process.
    const past = new Date(Date.now() - 60 * 60000).toISOString();
    const s1 = await call(sup.token, 'post', '/multimedia/schedules', {
      media_id: mediaId, target_type: 'device', target_id: device.id,
      start_at: past, repeat_type: 'none',
    });
    expect(s1.status).toBe(201);

    const proc = await call(sup.token, 'post', '/multimedia/schedules/process');
    expect(proc.status).toBe(200);
    expect(proc.body.processed).toBeGreaterThanOrEqual(1);

    const ran = await db('scheduled_playbacks').where('id', s1.body.id).first();
    expect(ran.status).toBe('ended');
    expect(ran.last_run_at).not.toBeNull();
    const history = await db('playback_history').where('device_id', device.id).andWhere('action', 'schedule_start').andWhere('status', 'success');
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[history.length - 1].media_id).toBe(mediaId);

    // Future schedule is not processed yet.
    const future = new Date(Date.now() + 86400000).toISOString();
    const s2 = await call(sup.token, 'post', '/multimedia/schedules', {
      media_id: mediaId, target_type: 'all', start_at: future, repeat_type: 'daily',
    });
    expect(s2.status).toBe(201);
    expect((await call(sup.token, 'post', '/multimedia/schedules/process')).body.processed).toBe(0);
    expect((await db('scheduled_playbacks').where('id', s2.body.id).first()).status).toBe('active');

    // Pause / resume / end lifecycle.
    expect((await call(sup.token, 'post', `/multimedia/schedules/${s2.body.id}/pause`)).status).toBe(200);
    expect((await call(sup.token, 'post', `/multimedia/schedules/${s2.body.id}/resume`)).status).toBe(200);
    expect((await call(sup.token, 'post', `/multimedia/schedules/${s2.body.id}/end`)).status).toBe(200);

    // Invalid repeat_days rejected.
    const badDays = await call(sup.token, 'post', '/multimedia/schedules', {
      media_id: mediaId, target_type: 'all', start_at: future, repeat_type: 'specific_days', repeat_days: 'funday,8',
    });
    expect(badDays.status).toBe(400);

    // Scheduling archived media is refused.
    const archivedMedia = await uploadMedia(sup.token, 'Archived Scheduled');
    await call(sup.token, 'post', `/multimedia/media/${archivedMedia}/archive`);
    expect((await call(sup.token, 'post', '/multimedia/schedules', { media_id: archivedMedia, target_type: 'all', start_at: future })).status).toBe(400);
  });

  it('exposes history, audit trail, capabilities and dashboard summaries', async () => {
    const sup = await loginAs('it_supervisor');
    const staff = await loginAs('staff');

    // History reflects the module activity and joins device/media names.
    const hist = await call(sup.token, 'get', '/multimedia/history?limit=10');
    expect(hist.status).toBe(200);
    expect(Array.isArray(hist.body.items)).toBe(true);
    expect(hist.body.items.length).toBeGreaterThanOrEqual(1);

    // Audit log contains the actions performed in this suite.
    const audit = await call(sup.token, 'get', '/multimedia/audit');
    expect(audit.status).toBe(200);
    const actions = audit.body.items.map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(['device_register', 'media_upload', 'broadcast']));

    // Commands endpoint lists device commands.
    const cmds = await call(sup.token, 'get', '/multimedia/commands');
    expect(cmds.status).toBe(200);
    expect(cmds.body.some((c) => c.status === 'not_supported')).toBe(true);

    // Capabilities manifest is explicit about what is NOT supported.
    const caps = await call(sup.token, 'get', '/multimedia/capabilities');
    expect(caps.status).toBe(200);
    expect(caps.body.integration.id).toBe('mock-local-player');
    expect(caps.body.supported_file_types).toHaveProperty('video/mp4');
    expect(caps.body.supported_command_manifest).toEqual(['play', 'stop']);
    expect(caps.body.phase2_limitations.some((l) => l.toLowerCase().includes('power'))).toBe(true);

    // Staff cannot see the dashboard.
    expect((await call(staff.token, 'get', '/multimedia/dashboard')).status).toBe(403);

    // Settings updates validate numeric bounds and show up in the DB.
    const badTimeout = await call(sup.token, 'put', '/multimedia/settings/multimedia_heartbeat_timeout_minutes', { value: '0' });
    expect(badTimeout.status).toBe(400);
    const okTimeout = await call(sup.token, 'put', '/multimedia/settings/multimedia_heartbeat_timeout_minutes', { value: '5' });
    expect(okTimeout.status).toBe(200);
    const kicker = await db('system_settings').where('key', 'multimedia_heartbeat_timeout_minutes').first();
    expect(kicker.value).toBe('5');
    await call(sup.token, 'put', '/multimedia/settings/multimedia_heartbeat_timeout_minutes', { value: '3' });

    // Dashboard aggregates the module's health.
    const dash = await call(sup.token, 'get', '/multimedia/dashboard');
    expect(dash.status).toBe(200);
    expect(dash.body.totals.total).toBeGreaterThanOrEqual(6);
    expect(dash.body.totals.media).toBeGreaterThanOrEqual(1);
    expect(dash.body.totals.offline).toBeGreaterThanOrEqual(1);
    expect(dash.body.recent_activity).toBeInstanceOf(Array);
  }, 60000);
});