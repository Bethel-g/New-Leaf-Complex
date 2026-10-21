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