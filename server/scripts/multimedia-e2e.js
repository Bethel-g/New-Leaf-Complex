#!/usr/bin/env node
/**
 * End-to-end workflow test for the Multimedia (digital signage) module.
 *
 * It drives a complete "one simulated TV" flow against a running server:
 *
 *   register device → heartbeat → upload media → broadcast → device receives
 *   play command → fetch media file → stop → group target → schedule →
 *   offline handling → history / audit / commands → RBAC → cleanup
 *
 * The TV is simulated with the same HTTP calls a real player makes, so nothing
 * about the production code path is bypassed. The only direct database access
 * is used to (a) age a heartbeat so the device goes offline without waiting
 * for the real timeout and (b) remove the test rows afterwards.
 *
 * Usage
 *   node scripts/multimedia-e2e.js
 *   MM_API=http://localhost:5001 MM_EMAIL=admin@newleaf.com MM_PASSWORD=password123 node scripts/multimedia-e2e.js
 *
 * Exit code 0 = every step passed, 1 = at least one step failed.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const BASE = (process.env.MM_API || 'http://localhost:5001').replace(/\/$/, '');
const EMAIL = process.env.MM_EMAIL || 'admin@newleaf.com';
const PASSWORD = process.env.MM_PASSWORD || 'password123';
const STAMP = Date.now();

// 1x1 PNG used as the test slide
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const state = {
  token: null,
  deviceId: null,
  identifier: null,
  secret: null,
  mediaId: null,
  mediaFile: null,
  groupId: null,
  scheduleId: null,
  originalItStaffSetting: undefined,
};

let passed = 0;
let failed = 0;

function ok(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

async function http(method, urlPath, options = {}) {
  const { body, headers = {}, auth = true } = options;
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      ...(auth && state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(typeof body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body,
  });
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch (e) { /* keep raw text */ }
  return { status: res.status, data };
}

function heartbeat(identifier, secret) {
  const headers = {};
  if (identifier) headers['X-Device-Identifier'] = identifier;
  if (secret) headers['X-Device-Secret'] = secret;
  return http('POST', '/api/multimedia/devices/heartbeat', { body: '{}', headers, auth: false });
}

// ── 1. Authentication ────────────────────────────────────────────────────────
async function testLogin() {
  section('1. Authentication & capabilities');
  const res = await http('POST', '/api/auth/login', {
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    auth: false,
  });
  ok(`login as ${EMAIL}`, res.status === 200 && !!res.data.token, `status ${res.status}`);
  if (res.status !== 200 || !res.data.token) throw new Error('cannot continue without a session token');
  state.token = res.data.token;

  const caps = await http('GET', '/api/multimedia/capabilities');
  ok('capabilities endpoint responds', caps.status === 200, `status ${caps.status}`);
  ok('integration is the mock local player', caps.data.integration && caps.data.integration.id === 'mock-local-player');
  const manifest = (caps.data.supported_command_manifest || []);
  ok('manifest exposes play + stop only', manifest.includes('play') && manifest.includes('stop') && manifest.length === 2, manifest.join(','));
}

// ── 2. Device registration ───────────────────────────────────────────────────
async function testRegisterDevice() {
  section('2. Device registration');
  const res = await http('POST', '/api/multimedia/devices', {
    body: JSON.stringify({
      name: `E2E Test TV ${STAMP}`,
      device_type: 'tv',
      device_identifier: `nl-e2e-tv-${STAMP}`,
      manufacturer: 'Simulator',
      model: 'Virtual Q60',
      room: 'E2E Lab',
      connection_type: 'wifi',
    }),
  });
  ok('device registered', res.status === 201, `status ${res.status} ${JSON.stringify(res.data)}`);
  ok('identifier returned', !!res.data.device_identifier);
  ok('plaintext secret returned exactly once', !!res.data.device_secret);
  state.deviceId = res.data.id;
  state.identifier = res.data.device_identifier;
  state.secret = res.data.device_secret;

  const dup = await http('POST', '/api/multimedia/devices', {
    body: JSON.stringify({ name: 'Duplicate', device_identifier: state.identifier }),
  });
  ok('duplicate identifier rejected', dup.status === 400, `status ${dup.status}`);
}

// ── 3. Heartbeat contract ────────────────────────────────────────────────────
async function testHeartbeat() {
  section('3. Heartbeat contract');
  const res = await heartbeat(state.identifier, state.secret);
  ok('heartbeat accepted', res.status === 200 && res.data.ok === true, `status ${res.status}`);
  ok('device comes online', res.data.device && res.data.device.status === 'online', res.data.device && res.data.device.status);
  ok('supported commands advertised', Array.isArray(res.data.device.supported_commands) && res.data.device.supported_commands.includes('play'));
  ok('idle while nothing is assigned', res.data.command && res.data.command.action === 'idle');

  const noCreds = await http('POST', '/api/multimedia/devices/heartbeat', { body: '{}', auth: false });
  ok('missing credentials rejected (401)', noCreds.status === 401, `status ${noCreds.status}`);

  const badSecret = await heartbeat(state.identifier, 'nl-dev-wrongsecret');
  ok('wrong secret rejected (401)', badSecret.status === 401, `status ${badSecret.status}`);

  const unknown = await heartbeat(`nl-unknown-${STAMP}`, state.secret);
  ok('unknown identifier rejected (401)', unknown.status === 401, `status ${unknown.status}`);

  const list = await http('GET', '/api/multimedia/devices');
  const found = (list.data || []).find((d) => d.id === state.deviceId);
  ok('device listed with a heartbeat timestamp', !!found && !!found.last_heartbeat_at);
}

// ── 4. Media library ─────────────────────────────────────────────────────────
async function testMedia() {
  section('4. Media library');
  const form = new FormData();
  form.append('title', `E2E Slide ${STAMP}`);
  form.append('category', 'General Information');
  form.append('description', 'Created by the multimedia e2e test');
  form.append('file', new Blob([PNG], { type: 'image/png' }), 'e2e-slide.png');

  const res = await fetch(`${BASE}/api/multimedia/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${state.token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  ok('media uploaded', res.status === 201, `status ${res.status}`);
  state.mediaId = data.id;

  const detail = await http('GET', `/api/multimedia/media/${state.mediaId}`);
  ok('uploaded media is active', detail.data.status === 'active', detail.data.status);
  state.mediaFile = detail.data.file_path;

  const draft = await http('POST', `/api/multimedia/media/${state.mediaId}/draft`);
  ok('media can be moved to draft', draft.status === 200, `status ${draft.status}`);
  const draftBroadcast = await http('POST', '/api/multimedia/broadcast', {
    body: JSON.stringify({ media_id: state.mediaId, target_type: 'device', target_id: state.deviceId }),
  });
  ok('draft media cannot be broadcast', draftBroadcast.status === 400, `status ${draftBroadcast.status}`);
  const activate = await http('POST', `/api/multimedia/media/${state.mediaId}/activate`);
  ok('media activated again', activate.status === 200, `status ${activate.status}`);
}

// ── 5. Broadcast to a single device ──────────────────────────────────────────
async function testBroadcast() {
  section('5. Broadcast to the simulated TV');
  const res = await http('POST', '/api/multimedia/broadcast', {
    body: JSON.stringify({ media_id: state.mediaId, target_type: 'device', target_id: state.deviceId, priority: 1 }),
  });
  ok('broadcast accepted', res.status === 201, `status ${res.status} ${JSON.stringify(res.data)}`);
  ok('one device targeted', res.data.devices_total === 1, String(res.data.devices_total));
  ok('one device reached', res.data.devices_success === 1, String(res.data.devices_success));
  ok('result marks the device as playing', res.data.results[0] && res.data.results[0].status === 'playing');

  const hb = await heartbeat(state.identifier, state.secret);
  ok('device is told to play', hb.data.command && hb.data.command.action === 'play', JSON.stringify(hb.data.command));
  ok('command carries the media id', hb.data.command && hb.data.command.media_id === state.mediaId);
  ok('command carries a file url', hb.data.command && hb.data.command.file_url === `/api/multimedia/media/${state.mediaId}/file`);

  const device = await http('GET', `/api/multimedia/devices/${state.deviceId}`);
  ok('device row shows playing + current media', device.data.status === 'playing' && device.data.current_media_id === state.mediaId);
  ok('device exposes its capabilities', Array.isArray(device.data.capabilities) && device.data.capabilities.includes('play'));
}

// ── 6. Media file delivery ───────────────────────────────────────────────────
async function testMediaFile() {
  section('6. Media file delivery');
  const res = await fetch(`${BASE}/api/multimedia/media/${state.mediaId}/file`, {
    headers: { Authorization: `Bearer ${state.token}` },
  });
  const buf = Buffer.from(await res.arrayBuffer());
  ok('file served to an authenticated user', res.status === 200, `status ${res.status}`);
  ok('file bytes delivered', buf.length === PNG.length, `${buf.length} bytes`);
  ok('content type is the uploaded mime type', (res.headers.get('content-type') || '').includes('image/png'));

  const anon = await fetch(`${BASE}/api/multimedia/media/${state.mediaId}/file`);
  ok('file is not public', anon.status === 401, `status ${anon.status}`);
}

// ── 7. Direct device commands ────────────────────────────────────────────────
async function testCommands() {
  section('7. Device commands');
  const play = await http('POST', `/api/multimedia/devices/${state.deviceId}/command`, {
    body: JSON.stringify({ command: 'play', media_id: state.mediaId }),
  });
  ok('play command executed', play.status === 200 && play.data.status === 'succeeded', JSON.stringify(play.data));

  const stop = await http('POST', `/api/multimedia/devices/${state.deviceId}/command`, {
    body: JSON.stringify({ command: 'stop' }),
  });
  ok('stop command executed', stop.status === 200 && stop.data.status === 'succeeded', JSON.stringify(stop.data));
  const afterStop = await http('GET', `/api/multimedia/devices/${state.deviceId}`);
  ok('device is idle after stop', afterStop.data.status === 'idle' && !afterStop.data.current_media_id);

  const power = await http('POST', `/api/multimedia/devices/${state.deviceId}/command`, {
    body: JSON.stringify({ command: 'power' }),
  });
  ok('unsupported command refused (400)', power.status === 400, `status ${power.status}`);
  ok('refusal names the reason', /not supported/i.test((power.data && power.data.message) || ''), (power.data && power.data.message) || '');

  const cmds = await http('GET', `/api/multimedia/devices/${state.deviceId}/commands`);
  const notSupported = (cmds.data || []).find((c) => c.command === 'power');
  ok('refused command is logged as not_supported', !!notSupported && notSupported.status === 'not_supported');
}

// ── 8. Group targeting ───────────────────────────────────────────────────────
async function testGroups() {
  section('8. Group targeting');
  const created = await http('POST', '/api/multimedia/groups', {
    body: JSON.stringify({ name: `E2E Group ${STAMP}`, description: 'e2e', device_ids: [state.deviceId] }),
  });
  ok('group created with the device', created.status === 201, `status ${created.status}`);
  state.groupId = created.data.id;

  const res = await http('POST', '/api/multimedia/broadcast', {
    body: JSON.stringify({ media_id: state.mediaId, target_type: 'group', target_id: state.groupId }),
  });
  ok('group broadcast reached the TV', res.status === 201 && res.data.devices_success === 1, JSON.stringify(res.data));

  const hb = await heartbeat(state.identifier, state.secret);
  ok('device received the group broadcast', hb.data.command && hb.data.command.action === 'play');

  const remove = await http('DELETE', `/api/multimedia/groups/${state.groupId}/devices/${state.deviceId}`);
  ok('device can be removed from the group', remove.status === 200, `status ${remove.status}`);
  const empty = await http('POST', '/api/multimedia/broadcast', {
    body: JSON.stringify({ media_id: state.mediaId, target_type: 'group', target_id: state.groupId }),
  });
  ok('broadcast to an empty group is refused', empty.status === 400, `status ${empty.status}`);
}

// ── 9. Schedules ─────────────────────────────────────────────────────────────
async function testSchedules() {
  section('9. Scheduled playback');
  await http('POST', '/api/multimedia/broadcast/stop', {
    body: JSON.stringify({ target_type: 'device', target_id: state.deviceId }),
  });

  const start = new Date(Date.now() - 60 * 1000).toISOString();
  const created = await http('POST', '/api/multimedia/schedules', {
    body: JSON.stringify({
      title: `E2E Schedule ${STAMP}`,
      media_id: state.mediaId,
      target_type: 'device',
      target_id: state.deviceId,
      start_at: start,
      repeat_type: 'none',
      priority: 2,
    }),
  });
  ok('schedule created', created.status === 201, `status ${created.status} ${JSON.stringify(created.data)}`);
  state.scheduleId = created.data.id;

  const processed = await http('POST', '/api/multimedia/schedules/process');
  ok('due schedules are processed on demand', processed.status === 200 && processed.data.processed >= 1, JSON.stringify(processed.data));

  const hb = await heartbeat(state.identifier, state.secret);
  ok('schedule started playback on the TV', hb.data.command && hb.data.command.action === 'play');

  const again = await http('POST', '/api/multimedia/schedules/process');
  ok('a one-off schedule does not run twice', again.data.processed === 0, JSON.stringify(again.data));

  const pause = await http('POST', `/api/multimedia/schedules/${state.scheduleId}/pause`);
  ok('schedule can be paused', pause.status === 200);
  const resume = await http('POST', `/api/multimedia/schedules/${state.scheduleId}/resume`);
  ok('schedule can be resumed', resume.status === 200);
}

// ── 10. Stop playback ────────────────────────────────────────────────────────
async function testStop() {
  section('10. Stop playback');
  const res = await http('POST', '/api/multimedia/broadcast/stop', {
    body: JSON.stringify({ target_type: 'device', target_id: state.deviceId }),
  });
  ok('stop accepted', res.status === 200, `status ${res.status}`);
  ok('device reported as stopped', res.data.results[0] && res.data.results[0].status === 'idle');
  const hb = await heartbeat(state.identifier, state.secret);
  ok('device has nothing to play', hb.data.command && hb.data.command.action === 'idle');
}

// ── 11. Offline behaviour ────────────────────────────────────────────────────
async function testOffline() {
  section('11. Offline device handling');
  // Age the heartbeat so the device is treated as offline (TV powered off).
  await db('multimedia_devices').where('id', state.deviceId).update({
    last_heartbeat_at: new Date(Date.now() - 30 * 60 * 1000),
  });

  const list = await http('GET', '/api/multimedia/devices');
  const device = (list.data || []).find((d) => d.id === state.deviceId);
  ok('stale heartbeat marks the device offline', device && device.status === 'offline', device && device.status);

  const broadcast = await http('POST', '/api/multimedia/broadcast', {
    body: JSON.stringify({ media_id: state.mediaId, target_type: 'device', target_id: state.deviceId }),
  });
  ok('broadcast reports the device as offline', broadcast.status === 201 && broadcast.data.devices_offline === 1, JSON.stringify(broadcast.data));
  ok('offline device is never reported as playing', broadcast.data.results[0] && broadcast.data.results[0].status === 'offline');

  const command = await http('POST', `/api/multimedia/devices/${state.deviceId}/command`, {
    body: JSON.stringify({ command: 'play' }),
  });
  ok('command to an offline device is refused', command.status === 400 && /offline/i.test(command.data.message || ''), `status ${command.status}`);

  const hb = await heartbeat(state.identifier, state.secret);
  ok('device comes back online on the next heartbeat', hb.status === 200 && hb.data.device.status === 'online', hb.data.device && hb.data.device.status);
}

// ── 12. History, audit, commands log ─────────────────────────────────────────
async function testRecords() {
  section('12. History, audit & command log');
  const history = await http('GET', `/api/multimedia/history?deviceId=${state.deviceId}`);
  ok('history returns rows for the device', history.status === 200 && history.data.total > 0, `total ${history.data && history.data.total}`);
  const actions = (history.data.items || []).map((h) => h.action);
  ok('broadcast is recorded in history', actions.includes('broadcast'), actions.join(','));
  ok('stop is recorded in history', actions.includes('stop'), actions.join(','));
  ok('heartbeat-offline transition is recorded', actions.includes('heartbeat_offline'), actions.join(','));

  const audit = await http('GET', '/api/multimedia/audit?limit=200');
  const auditActions = (audit.data.items || []).map((a) => a.action);
  ok('device registration is audited', auditActions.includes('device_register'));
  ok('broadcast is audited', auditActions.includes('broadcast'));
  ok('device command is audited', auditActions.some((a) => a.startsWith('device_command')));

  const commands = await http('GET', '/api/multimedia/commands');
  ok('command log lists device commands', commands.status === 200 && Array.isArray(commands.data) && commands.data.length > 0);

  const dashboard = await http('GET', '/api/multimedia/dashboard');
  ok('dashboard aggregates the module', dashboard.status === 200 && dashboard.data.totals && dashboard.data.totals.total >= 1);
}

// ── 13. RBAC ─────────────────────────────────────────────────────────────────
async function testRbac() {
  section('13. Role restrictions');
  const adminToken = state.token;

  const nurse = await http('POST', '/api/auth/login', {
    body: JSON.stringify({ email: 'fatima.nurse@newleaf.com', password: 'password123' }),
    auth: false,
  });
  ok('nurse can sign in', nurse.status === 200, `status ${nurse.status}`);
  if (nurse.status === 200) {
    state.token = nurse.data.token;
    const denied = await http('GET', '/api/multimedia/dashboard');
    ok('nurse is denied access to multimedia', denied.status === 403, `status ${denied.status}`);
  }

  const tech = await http('POST', '/api/auth/login', {
    body: JSON.stringify({ email: 'mike.tech@newleaf.com', password: 'password123' }),
    auth: false,
  });
  ok('it_staff can sign in', tech.status === 200, `status ${tech.status}`);
  if (tech.status !== 200) {
    state.token = adminToken;
    return;
  }

  // Remember the current setting so it can be restored exactly as it was.
  state.token = adminToken;
  const settingsRes = await http('GET', '/api/multimedia/settings');
  const row = (settingsRes.data || []).find((s) => s.key === 'multimedia_allow_it_staff_commands');
  state.originalItStaffSetting = row ? row.value : 'false';

  state.token = tech.data.token;
  const view = await http('GET', '/api/multimedia/devices');
  ok('it_staff can view devices', view.status === 200, `status ${view.status}`);

  // Switch off → it_staff must not be able to send commands.
  state.token = adminToken;
  await http('PUT', '/api/multimedia/settings/multimedia_allow_it_staff_commands', {
    body: JSON.stringify({ value: 'false' }),
  });
  state.token = tech.data.token;
  const refused = await http('POST', `/api/multimedia/devices/${state.deviceId}/command`, {
    body: JSON.stringify({ command: 'play', media_id: state.mediaId }),
  });
  ok('it_staff command refused while the setting is off', refused.status === 403, `status ${refused.status}`);

  // Switch on → the same command is allowed.
  state.token = adminToken;
  await http('PUT', '/api/multimedia/settings/multimedia_allow_it_staff_commands', {
    body: JSON.stringify({ value: 'true' }),
  });
  state.token = tech.data.token;
  const allowed = await http('POST', `/api/multimedia/devices/${state.deviceId}/command`, {
    body: JSON.stringify({ command: 'play', media_id: state.mediaId }),
  });
  ok('it_staff command allowed while the setting is on', allowed.status === 200, `status ${allowed.status}`);

  state.token = adminToken;
}

// ── 14. Disable / enable ─────────────────────────────────────────────────────
async function testDisable() {
  section('14. Disable & enable');
  const disable = await http('POST', `/api/multimedia/devices/${state.deviceId}/disable`);
  ok('device disabled', disable.status === 200, `status ${disable.status}`);
  const hb = await heartbeat(state.identifier, state.secret);
  ok('disabled device heartbeat rejected (403)', hb.status === 403, `status ${hb.status}`);
  const enable = await http('POST', `/api/multimedia/devices/${state.deviceId}/enable`);
  ok('device enabled again', enable.status === 200, `status ${enable.status}`);
  const hb2 = await heartbeat(state.identifier, state.secret);
  ok('heartbeat works after enabling', hb2.status === 200, `status ${hb2.status}`);
}

// ── Cleanup ──────────────────────────────────────────────────────────────────
async function cleanup() {
  section('Cleanup');
  try {
    if (state.originalItStaffSetting !== undefined) {
      await http('PUT', '/api/multimedia/settings/multimedia_allow_it_staff_commands', {
        body: JSON.stringify({ value: state.originalItStaffSetting }),
      });
      console.log(`  setting multimedia_allow_it_staff_commands restored to ${state.originalItStaffSetting}`);
    }
    if (state.scheduleId) await http('DELETE', `/api/multimedia/schedules/${state.scheduleId}`);
    if (state.groupId) await http('DELETE', `/api/multimedia/groups/${state.groupId}`);
    if (state.deviceId) {
      await http('DELETE', `/api/multimedia/devices/${state.deviceId}`);
      await db('playback_history').where('device_id', state.deviceId).del();
      await db('device_commands').where('device_id', state.deviceId).del();
      await db('playback_assignments').where('media_id', state.mediaId).del();
      await db('multimedia_group_devices').where('device_id', state.deviceId).del();
      await db('multimedia_devices').where('id', state.deviceId).del();
    }
    if (state.mediaId) {
      await db('playback_history').where('media_id', state.mediaId).del();
      await db('media_assets').where('id', state.mediaId).del();
    }
    if (state.mediaFile) {
      const file = path.join(__dirname, '..', 'uploads', path.basename(state.mediaFile));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    console.log('  test rows removed');
  } catch (error) {
    console.log(`  cleanup warning: ${error.message}`);
  }
}

async function main() {
  console.log(`Multimedia end-to-end test → ${BASE}`);
  const started = Date.now();
  try {
    await testLogin();
    await testRegisterDevice();
    await testHeartbeat();
    await testMedia();
    await testBroadcast();
    await testMediaFile();
    await testCommands();
    await testGroups();
    await testSchedules();
    await testStop();
    await testOffline();
    await testRecords();
    await testRbac();
    await testDisable();
  } catch (error) {
    failed += 1;
    console.log(`\n  ERROR ${error.message}`);
  } finally {
    await cleanup();
    await db.destroy();
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n${passed} passed, ${failed} failed (${seconds}s)`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main();
