# Testing — New Leaf Ops System

The backend is verified with **Vitest + Supertest** API-level integration tests. Tests boot the
real Express app against a dedicated PostgreSQL database (`newleaf_test`) and exercise every
route end-to-end through HTTP, including auth, RBAC, workflow transitions, notifications, file
uploads, filters/pagination and security guards.

## How to run

```bash
cd server

npm run test:setup     # rebuild the test DB: rollback all → migrate → seed (test env)
npm test               # vitest run — all suites (functional + regression)
# npm run test:watch   # interactive mode

npm run test:regression           # only the regression layer
npm run test:regression:update    # re-record its snapshots after an intentional change
```

Per-file run (while developing a suite):

```bash
npx vitest run test/workflows.test.js
```

## Prerequisites

- PostgreSQL running locally and a `newleaf_test` database that exists (see README).
- `server/.env` with the `TEST_DB_NAME` (defaults to `newleaf_test`).
- `vitest.config.mjs` disables file parallelism and each file re-migrates/re-seeds via
  `test/setup.js`, so suites are order-independent and standalone.

## Functional suites (6 files, 47 tests)

| Suite | File | What it covers |
| --- | --- | --- |
| Auth | `test/auth.test.js` | Login for every seeded role, wrong password, unknown email, deactivated account, validation, logout idempotency, `/me`, missing/tampered/deactivated tokens, password-change rules |
| RBAC | `test/rbac.test.js` | Full permission matrix across roles (tickets, suggestions, dashboard, notifications, users, admin/system endpoints), 401/403 on protected routes, admin vs sys_admin boundaries |
| Dashboard | `test/dashboard.test.js` | Role-scoped dashboard stats computed against known seeded records; requires authentication |
| Security | `test/security.test.js` | Cross-team assignment, cross-type status, deactivated assignees, category-type mismatch, suggestions list scoping/IDOR, upload authz-before-write + executable/SVG/MIME spoof rejection, credential/contact leakage in lists, SQL-injection + stored-XSS payloads, brute-force lockout, 404s for nonexistent records |
| Workflows | `test/workflows.test.js` | End-to-end IT and maintenance ticket lifecycles (create → assign → work → resolve → reopen → WFI → close) with notifications and history, full suggestion pipeline (review → acceptance → assignment → implementation → close), dashboard-vs-DB equivalence, list pagination/filters (status, priority, type, department, category, location, date, search, assignee, requester), input-validation guards, oversized/dangerous upload rejection without orphaned rows |
| Multimedia | `test/multimedia.test.js` | Digital Signage module end-to-end: device register (secret shown once, hashed at rest), heartbeat auth via `X-Device-Identifier`/`X-Device-Secret`, broadcast to single/group/all targets with honest offline handling, schedule create + on-demand run + idempotent rerun, media upload/stream/archive, RBAC (view vs manage vs it_staff command gate), audit log + notification side effects, device enable/disable, device-limit enforcement |

## Regression layer (`test/regression/`, 3 files, 154 tests)

A second, self-contained layer whose job is to *notice* change rather than to assert a desired
product. Run it with `npm run test:regression`.

| Suite | File | What it covers |
| --- | --- | --- |
| Characterization | `regression/characterization.test.js` | Current behavior of every module, including rough edges that are not bugs to be fixed silently: duplicate department/category names returning 500, `/users/technicians` defaulting an unknown `type` to maintenance, idempotent notification reads, the unreachable last-sys_admin guard, delete-route status codes and error message wording |
| Contract | `regression/contract.test.js` | Response *shapes* as snapshots: key sets and value types per endpoint, error envelopes, upload MIME/extension rules, dashboard envelope per role, multimedia list envelopes, device-secret hashing. Values that legitimately vary (ids, timestamps, tokens, file paths, uuids) are normalized away; 76 snapshots in `regression/__snapshots__/contract.test.js.snap` |
| Invariants | `regression/invariants.test.js` | Properties of the *database*, not of any response: FK orphan scans across all 15 ticketed tables, ticket/suggestion numbering sequences, ticket history chain continuity vs. current status, notification fan-out per action, attachment row↔file consistency, cascade-delete outcomes, dashboard totals vs. direct SQL counts, and role scoping (list and dashboard) per role |

Two distinctions matter when a regression test fails:

- **Characterization / contract** failing means *behavior changed*. Decide deliberately whether the
  change is intended; if it is, re-record with `npm run test:regression:update` and note why in
  the commit.
- **Invariant** failing means *data is inconsistent* — a real bug, not a contract change. Fix the
  route or the migration; never relax the assertion.

### Deliberately pinned rough edges

The invariant suite pins three current inconsistencies. They are documented in comments at each
test, and each is a trap for anyone assuming the two views agree:

1. **Orphaned tickets are invisible in the list but counted by the dashboard.** `tickets.requester_id`
   is `ON DELETE SET NULL`, but `tickets.js` INNER JOINs the requester while `dashboard.js` LEFT
   JOINs it. After a requester is deleted the dashboard total is higher than the list total.
2. **Deleting a ticket in the database cascades attachment rows but not files.** There is no
   `DELETE /api/tickets/:id` endpoint, so this is currently unreachable through the API.
3. **The "last system administrator" guard in `users.js` is unreachable** — the route requires a
   sys_admin and the self-delete check runs before the guard.

### Upload litter

Every regression file calls `cleanupUploads()` in `afterAll`, so a regression run leaves only the
seed's own placeholder PNGs behind (two per file, from
`src/database/seeds/001_initial_data.js`) — 8 files for a 3-file run, constant across runs.

Cleanup anchors on the *first upload of the file*, not on module import. This matters: `setup.js`
re-seeds before each file, and the seed writes into the same directory, so a snapshot taken at
import time would classify the seed's PNGs as litter and delete the next file's assets. The anchor
is also a directory diff rather than a list of attachment rows, because a file can be written to
disk and still fail to get a row — a rejected validation after multer ran, for instance — which is
precisely the leak worth cleaning.

The pre-existing functional suites (`security`, `workflows`, `multimedia`) still add a handful of
files per run; a full `npm test` grows the directory by roughly 30. `server/uploads/*` is
git-ignored, so none of it reaches the repository. To reset by hand:

```bash
# Windows PowerShell — only safe while no dev server is running
Remove-Item C:\Projects\New-Leaf\server\uploads\* -Force
```

### Regression helpers (`test/regression/helpers.mjs`)

```js
import { db, call, loginAs, refs, actors, attach, download,
          normalize, shape, fileExists, storedFilePath } from './helpers.mjs';

normalize(payload)   // ids/timestamps/secrets/paths → markers, keys sorted  (snapshot values)
shape(payload)       // keys + types + array lengths only                     (structural snapshot)
refs()               // seeded reference rows (statuses, categories, roles…) by name
actors()             // logins for every role, keyed by role name
attach(token, url, buffer, name, type)  // multipart upload (async)
download(token, url)                     // raw bytes back (supertest needs a custom parser)
cleanupUploads()                         // delete files this file uploaded; call in afterAll
```

Note `actors()` returns keys named after roles (`it_supervisor`, not `itSup`), and uploaded files
live in `server/uploads/`, not the repo-root `uploads/`.

## Test helpers (`test/helpers.mjs`)

```js
import { login, loginAs, call, request, ROLES, DEFAULT_PASSWORD } from './helpers.mjs';

const staff = await loginAs('staff');            // logs in fatima.nurse@newleaf.com
const res  = await call(staff.token, 'post', '/tickets', { ... });   // JSON request, /api auto-prefixed
const up   = request.post('/api/tickets/1/attachments')               // raw supertest (multipart etc.)
              .set('Authorization', `Bearer ${staff.token}`)
              .attach('files', buffer, { filename: 'x.txt', contentType: 'text/plain' });
```

Seeded emails are in `ROLES`; every account uses `DEFAULT_PASSWORD` (`password123`).
`db` (`import db from '../src/config/db.js'`) gives direct SQL access for fixtures/assertions.

- **Uploads:** attachment tests write into `server/uploads/`. Regression files clean up
  automatically via `cleanupUploads()`; in the functional suites, remove anything you add by hand.

## Conventions

- Each test file gets a freshly seeded DB (identical reference data) via `test/setup.js`.
- Prefer API-level assertions; use direct `db` queries only to build fixtures or verify side
  effects (notifications, history, attachment rows).
- When a test inserts records, compute baseline counts through the same API before inserting,
  so other tests can never skew totals.
- **Login throttle caveat:** brute-force lockout is per email+IP (5 tries/15 min). Never pepper
  wrong passwords against seeded emails in tests — `security.test.js` uses a dedicated locked
  email (`brute.force.sec@newleaf.com`).
- Keep business behavior intact; a failing assertion indicates a real bug or a spec mismatch —
  fix the route or the expectation deliberately, never weaken the assertion to pass.

## Adding a test

1. Add to an existing suite or create `test/<area>.test.js`.
2. Import helpers, `describe`, `it`, `expect`.
3. Use `await login(...)` / `loginAs(...)` / `call(...)` for authenticated flows.
4. Run `npx vitest run test/<your-file>.test.js`, then the full `npm test`.
5. If any behavior needs changing, update the route — tests are the source of truth for this
   project's workflows.

## Adding a regression test

1. Put it in the file matching the intent: `characterization` (current behavior), `contract`
   (response shape) or `invariants` (database property).
2. Prefer `normalize()`/`shape()` over hand-written key lists so snapshots stay readable.
3. When asserting DB state, import `db` from the regression helpers and query directly — that is
   the point of the invariant suite.
4. If the test uploads a file, ensure the file has `afterAll(cleanupUploads)` at module scope.
5. Run `npm run test:regression` twice before committing: the suites share one database, and a
   suite that only passes on a second run has an order dependency.

## Manual testing of the Multimedia module (one simulated TV)

The Digital Signage module talks to *players* (TVs / displays) over a small HTTP contract, so a
physical screen is not needed to exercise it. Two tools ship with the server for this:

| Tool | What it does |
| --- | --- |
| `server/scripts/multimedia-e2e.js` | Automated end-to-end run of the whole workflow against a live server (78 assertions). Creates its own device/media/group/schedule and removes them afterwards. |
| `server/scripts/simulate-device.js` | A long-running TV that heartbeats, logs the `play`/`stop` commands the server sends it, and can download the media file it was told to play. |

### 0. Prerequisites

- API server running on `http://localhost:5001` (`cd server && npm run dev`).
- Client running on `http://localhost:3000` (`cd client && npm run dev`) for the UI walkthrough.

### 1. Run the automated workflow test

```bash
cd server
npm run test:mm          # node scripts/multimedia-e2e.js
```

It covers, in order: login -> capabilities -> device registration (secret returned once) ->
heartbeat (accepted, plus wrong-secret / unknown-device / missing-credential rejections) -> media
upload -> draft cannot be broadcast -> broadcast to the device -> the device is told to `play` with
a file URL -> media file download -> direct `play`/`stop` commands -> unsupported command (`power`)
refused and logged -> group targeting -> schedule created and processed on demand -> stop playback
-> offline handling (stale heartbeat means `offline`, never `playing`) -> history / audit / command
log -> RBAC (nurse denied, `it_staff` gated by the `multimedia_allow_it_staff_commands` setting) ->
disable/enable. Exit code `0` means every step passed.

Options: `MM_API`, `MM_EMAIL`, `MM_PASSWORD` override the server, account and password.

### 2. Run a simulated TV and watch it react

Register a device first - the secret is shown **once** (Multimedia -> Devices -> *Register Device*,
or `POST /api/multimedia/devices`). Then:

```bash
cd server
node scripts/simulate-device.js --identifier TV-001 --secret nl-dev-xxxxxxxx
```

```
[player] TV-001 -> http://localhost:5001/api/multimedia/devices/heartbeat (every 30s)
[20:02:02] status=online  idle
[20:02:32] status=playing  [PLAY]  "Hospital Welcome Message"  media_id=1
          file_url=/api/multimedia/media/1/file
```

Options: `--interval <sec>` (default 30), `--server <url>`, `--once`, `--offline-after <sec>`
(stops heartbeating to simulate a TV being switched off), `--token <jwt>` (a **user** JWT - with it
the simulator also downloads the media file; the file endpoint sits behind the user auth
middleware, device credentials are not accepted there).

### 3. UI walkthrough

1. **Multimedia -> Devices -> Register Device**: name `Test TV`, type `tv`, identifier
   `nl-test-tv-01`. Copy the secret that is shown once.
2. **Start the simulator** with that identifier + secret. The device row flips to `online` and
   *Last heartbeat* updates every interval.
3. **Multimedia -> Media Library -> Upload**: upload a PNG/JPG/MP4 (<= 100 MB). It becomes `active`.
4. **Multimedia -> Broadcast**: target *This device* -> send. The device turns `playing`, and the
   simulator prints `[PLAY]` with the file URL.
5. **Multimedia -> Devices -> Test TV** (device detail) sends a direct play/stop command; the
   simulator reacts on its next heartbeat.
6. **Multimedia -> Groups**: add the device to a group, then broadcast to the group.
7. **Multimedia -> Schedules**: create a schedule (start time in the past) -> open the dashboard or
   run *Process due schedules*; the TV starts playing on its own.
8. **Multimedia -> History / Commands / Audit**: the broadcast, stop, heartbeat and command events
   are all recorded. Unsupported commands appear as `not_supported`.
9. **Negative checks**: stop the simulator and wait out the heartbeat timeout (default 3 minutes,
   `Multimedia -> Settings` -> *Heartbeat timeout*) - the device turns `offline`, a broadcast then
   reports `devices_offline: 1` (never `playing`), and a direct command is refused with
   *"Device is offline; command not sent"*.
10. **Disable the device** -> the simulator gets `403 Device is disabled`; re-enable it -> the next
    heartbeat succeeds.

### Gotchas worth knowing

- **Seeded devices have no secret.** The seed inserts `TV-001`...`TV-006` without a
  `device_secret_hash`, so they can never authenticate a heartbeat. Register a new device, or give
  an existing one a secret with `PUT /api/multimedia/devices/:id` + `{"regenerate_secret":true}`
  (the new secret comes back in the response).
- **Seeded media rows have no file on disk.** `GET /api/multimedia/media/:id/file` returns 404 for
  them; upload a real file to test the delivery path.
- **Schedules are processed on demand**, not by a background worker - the dashboard/history reads
  and `POST /api/multimedia/schedules/process` trigger them.
- **Nothing is ever faked.** `play`/`stop` are supported by the bundled `mock-local-player`
  integration; `power`, `volume` and `mute` are reported `not_supported` instead of pretending to
  have worked.