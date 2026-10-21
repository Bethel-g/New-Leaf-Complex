#!/usr/bin/env node
/**
 * Display (TV) simulator for the New Leaf digital-signage module.
 *
 * A real player polls the server with
 *   POST /api/multimedia/devices/heartbeat
 *   headers: X-Device-Identifier: <device_identifier>
 *            X-Device-Secret:    <device_secret>
 * and the server answers with the command the player should execute
 * ({ action: 'play', media_id, file_url, ... } or { action: 'idle' }).
 *
 * This script mimics that player so the whole signage workflow can be
 * exercised without physical hardware.
 *
 * Usage
 *   node scripts/simulate-device.js --identifier TV-001 --secret nl-dev-xxxx
 *   node scripts/simulate-device.js --identifier TV-001 --secret nl-dev-xxxx --interval 20
 *   node scripts/simulate-device.js --identifier TV-001 --secret nl-dev-xxxx --token <jwt>
 *   node scripts/simulate-device.js --identifier TV-001 --secret nl-dev-xxxx --offline-after 60
 *
 * Options
 *   --identifier <id>     device_identifier as registered in the system
 *   --secret <secret>     device_secret (shown once, at registration time)
 *   --interval <sec>      heartbeat interval in seconds (default 30)
 *   --server <url>        API base URL (default http://localhost:5001)
 *   --token <jwt>         optional user JWT — when given, the simulator also
 *                         downloads the media file it was told to play (the
 *                         file endpoint sits behind the *user* auth middleware,
 *                         the device credentials are not accepted there)
 *   --offline-after <sec> stop heartbeating after N seconds (TV powered off)
 *   --once                send a single heartbeat and exit
 */
'use strict';

const args = parseArgs(process.argv.slice(2));

const BASE = (args.server || process.env.MM_API || 'http://localhost:5001').replace(/\/$/, '');
const IDENTIFIER = args.identifier;
const SECRET = args.secret;
const INTERVAL = Math.max(5, parseInt(args.interval || '30', 10));
const TOKEN = args.token || null;
const OFFLINE_AFTER = args['offline-after'] ? parseInt(args['offline-after'], 10) : null;

if (!IDENTIFIER || !SECRET) {
  console.error('Usage: node scripts/simulate-device.js --identifier <id> --secret <secret> [--interval 30] [--token <jwt>]');
  process.exit(1);
}

let running = true;
let lastMediaId = null;
let offline = false;

process.on('SIGINT', () => { running = false; console.log('\n[player] stopped'); });
process.on('SIGTERM', () => { running = false; });

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i += 1; }
  }
  return out;
}

async function heartbeat() {
  const res = await fetch(`${BASE}/api/multimedia/devices/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Identifier': IDENTIFIER,
      'X-Device-Secret': SECRET,
    },
    body: JSON.stringify({}),
  });

  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch (e) { /* keep raw */ }

  if (res.status === 401) {
    console.error(`[player] 401 ${body && body.message ? body.message : 'unauthorised'} — check the identifier/secret pair`);
  } else if (res.status === 403) {
    console.error(`[player] 403 ${body && body.message ? body.message : 'forbidden'} — the device is disabled`);
  } else if (!res.ok) {
    console.error(`[player] ${res.status} ${text.slice(0, 200)}`);
    return;
  }

  if (!body || !body.device) return;

  const cmd = body.command || { action: 'idle' };
  const stamp = new Date().toISOString().slice(11, 19);

  if (cmd.action === 'play') {
    const changed = cmd.media_id !== lastMediaId;
    lastMediaId = cmd.media_id;
    console.log(`[${stamp}] status=${body.device.status}  [PLAY]  "${cmd.title || cmd.media_id}"  media_id=${cmd.media_id}  ${cmd.duration_seconds ? cmd.duration_seconds + 's' : ''}`);
    console.log(`          file_url=${cmd.file_url}`);
    if (changed && TOKEN) await download(cmd.file_url, cmd.title);
  } else {
    if (lastMediaId !== null) console.log(`[${stamp}] status=${body.device.status}  [STOP] idle`);
    else console.log(`[${stamp}] status=${body.device.status}  idle`);
    lastMediaId = null;
  }
}

async function download(fileUrl, title) {
  try {
    const res = await fetch(`${BASE}${fileUrl}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!res.ok) {
      console.log(`          (media download failed: ${res.status})`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`          downloaded "${title}" — ${buf.length} bytes, ${res.headers.get('content-type')}`);
  } catch (error) {
    console.log(`          (media download failed: ${error.message})`);
  }
}

async function main() {
  console.log(`[player] ${IDENTIFIER} -> ${BASE}/api/multimedia/devices/heartbeat (every ${INTERVAL}s)`);
  console.log(`[player] supported commands come back from the server; unsupported ones are never faked`);

  const startedAt = Date.now();
  let first = true;

  while (running) {
    if (OFFLINE_AFTER !== null && !offline && Date.now() - startedAt >= OFFLINE_AFTER * 1000) {
      offline = true;
      console.log(`[player] simulating power-off — no more heartbeats`);
      continue;
    }
    if (offline) {
      await sleep(1000);
      continue;
    }

    try {
      await heartbeat();
    } catch (error) {
      console.error(`[player] heartbeat error: ${error.message}`);
    }

    if (args.once) break;
    first = false;
    await sleep(INTERVAL * 1000);
  }
  if (first) console.log('[player] done');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
