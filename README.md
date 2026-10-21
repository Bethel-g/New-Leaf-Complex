# New Leaf Complex — Operations Request & Improvement System

A full-stack operations platform for the New Leaf Complex. Staff submit IT and
maintenance **tickets** and **improvement suggestions**; supervisors manage work queues,
technicians record work, and administrators track everything through role-scoped dashboards
and a searchable history with an audit trail.

## Contents

- [Stack](#stack)
- [Repository layout](#repository-layout)
- [Requirements](#requirements)
- [Setup](#setup)
- [Running in development](#running-in-development)
- [Database scripts](#database-scripts-from-server)
- [Tests](#tests)
- [Documentation](#documentation)
- [Building for production](#building-for-production)
- [API overview](#api-overview)
- [System settings](#system-settings)
- [Digital Signage module](#digital-signage-module-multimedia-control)
- [Frontend shell](#frontend-shell)
- [Security notes](#security-notes)

## Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js + Express (CommonJS), PostgreSQL via Knex |
| Frontend | React 19 + Vite + Tailwind CSS (React Router, Axios, Recharts) |
| Uploads | Multer (stored locally, served only via authenticated download routes) |
| Auth | JWT (Bearer), bcrypt password hashing |
| Tests | Vitest + Supertest (API-level integration tests) |

## Repository layout

```
├── server/                  Express API + database
│   ├── src/
│   │   ├── config/          dotenv config, postgres pool
│   │   ├── database/        Knex migrations + seed
│   │   ├── middleware/      auth (JWT), authorizations
│   │   ├── routes/          auth, users, tickets, suggestions, dashboard, notifications, admin, multimedia
│   │   ├── services/        collaboration (comments/history/attachments), multimedia devices, upload middleware
│   │   └── utils/           helpers, validation, permissions
│   ├── test/                Vitest integration suites + helpers
│   ├── knexfile.js
│   └── .env                 environment (gitignored)
└── client/                  React frontend (Vite dev server on :3000 proxying /api → :5000)
```

## Requirements

- Node.js 20+ (uses `node --watch` for dev)
- PostgreSQL 12+ running locally

## Setup

### 1. Create the databases

```sql
CREATE DATABASE newleaf_db;
CREATE DATABASE newleaf_test;   -- used by the automated tests
```

### 2. Server environment

Copy the values into `server/.env` (a dev convenience file exists already):

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newleaf_db
DB_USER=postgres
DB_PASSWORD=postgres
TEST_DB_NAME=newleaf_test
JWT_SECRET=newleaf-hospital-jwt-secret-key-2024
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=../uploads
```

`.env` is gitignored. For **production** the server refuses to start without an explicit
`JWT_SECRET`, and `CORS_ORIGIN` should be pinned to the deployed frontend origin
(comma-separated list allowed).

### 3. Install, migrate, seed

```bash
cd server
npm install
npm run migrate        # knex migrate:latest (development DB)
npm run seed           # knex seed:run (idempotent: truncates + re-seeds reference data)

cd ../client
npm install
```

### Seeded accounts (all use password `password123`)

| Email | Role |
| --- | --- |
| `admin@newleaf.com` | sys_admin (system administration) |
| `hospital.admin@newleaf.com` | admin (hospital administrator) |
| `john.it@newleaf.com` | it_supervisor |
| `mike.tech@newleaf.com` | it_staff |
| `sarah.tech@newleaf.com` | it_staff |
| `ahmed.maint@newleaf.com` | maintenance_supervisor |
| `ali.maint@newleaf.com` | maintenance_staff |
| `fatima.nurse@newleaf.com` | staff |
| `omar.doctor@newleaf.com` | staff |
| `layla.lab@newleaf.com` | staff |

## Running in development

```bash
# Terminal 1 — API
cd server
npm run dev            # node --watch src/index.js on :5000

# Terminal 2 — frontend
cd client
npm run dev            # Vite on :3000, proxies /api to :5000
```

Open http://localhost:3000.

## Database scripts (from `server/`)

| Command | What it does |
| --- | --- |
| `npm run migrate` | Run pending migrations (`knex migrate:latest`) |
| `npm run migrate:rollback` | Roll back the latest migration batch |
| `npm run seed` | Run seed files (idempotent) |
| `npm run migrate:fresh` | Roll back **all** migrations, re-migrate, re-seed |
| `npm run test:setup` | Same cycle against the `test` environment (`newleaf_test`) |

There are 9 migrations. Two share the `20240101000002` prefix (`extend_ticket_dates`,
`system_settings`); Knex applies them lexicographically and they are independent. The
migrations add, in order:

- `20240101000006_multimedia_module` — Digital Signage module (10 tables: locations, media
  assets, devices, groups, group membership, playback assignments, schedules, playback history,
  device commands, audit log).
- `20240101000007_notification_task_links` — `entity_type` / `entity_id` on `notifications`, so a
  notification links to the ticket or suggestion it is about.
- `20240101000008_profile_audit_prefs` — `ip_address` on `activity_logs` and a
  `user_preferences` table (per-user notification opt-outs). Preferences live in their own table
  so the `users` projection returned by login and `/auth/me` never changes shape.

## Tests

```bash
cd server
npm run test:setup     # rebuild the test DB (rollback → migrate → seed, test env)
npm test               # vitest run — full API integration suite
```

See [TESTING.md](TESTING.md) for a detailed breakdown of the functional and regression suites.

## Documentation

| Document | Contents |
| --- | --- |
| This README | Setup, seeded accounts, API surface, operations, deployment, and security notes |
| [docs/BUSINESS_FLOW.md](docs/BUSINESS_FLOW.md) | Full business-flow reference: roles, ticket and suggestion lifecycles, permissions, notifications, collaboration, payloads, frontend flows |
| [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) | Technical architecture and design decisions |
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | Feature roadmap and scope history |
| [TESTING.md](TESTING.md) | Test suites, commands and coverage |

## Building for production

```bash
# API: install prod deps and start
cd server
npm ci --omit=dev
NODE_ENV=production JWT_SECRET=<strong secret> CORS_ORIGIN=<ingress/origin> npm start

# Frontend: build static assets (output in client/dist)
cd client
npm run build
```

Serve `client/dist` from your web server and reverse-proxy `/api` to the API. The API listens
on `PORT` (default 5000).

## API overview

Everything is under `/api`. Authenticated endpoints require a JWT in the
`Authorization` header. `POST /api/auth/login` returns `{ token, user }`;
`GET /api/auth/me` returns the current user.

| Module | Routes |
| --- | --- |
| `auth` | `POST /login`, `POST /logout`, `POST /change-password`, `GET /me`, `PUT /profile` (self-service name/email/phone), `GET /me/security` |
| `users` | user CRUD, `GET /technicians?type=it\|maintenance`, password reset (sys_admin) |
| `tickets` | list w/ filters + pagination, detail, create, update (assign/status/priority), comments, work notes, attachments |
| `suggestions` | list w/ filters + pagination, detail, create, update (workflow + assignment), comments, attachments |
| `dashboard` | role-scoped stats (totals, IT/maintenance splits, recent tickets, my open requests) |
| `notifications` | list, `GET /unread-count`, `PUT /:id/read`, `PUT /read-all`, `GET /preferences`, `PUT /preferences` |
| `admin` | category/status/priority/department/role/settings reference management; `GET /activity-logs` with action/user/date filters and client IP (sys_admin); `GET /recent-activity` (admin/sys_admin) and `GET /public-settings` (any signed-in user) |
| `multimedia` | Digital Signage: devices (register + enable/disable + heartbeat), dashboard stats, groups, locations, media upload/stream, broadcast to one/group/all, schedules, playback history, device commands, settings & audit log |

### Access model (short version)

- **staff** — create tickets/suggestions, track their own, reopen/resolve/close their tickets when asked.
- **it_staff / maintenance_staff** — their team's queue; move assigned tickets forward, add comments + work notes + attachments.
- **it_supervisor / maintenance_supervisor** — full control of their team's tickets (assign, priority, status, workflow).
- **admin** — everything; drives the suggestion review workflow.
- **sys_admin** — admin + user/role/settings/activity-log management.

## System settings

Settings are **not seeded**. Every configurable value has a code-level default, and a
`system_settings` row is created the first time a `sys_admin` saves it from
**Admin → System Settings** (`GET/POST /api/admin/settings`, `PUT /api/admin/settings/:key`).
This keeps fresh databases working with no extra seed data.

| Section | Keys (defaults) | Effect |
| --- | --- | --- |
| Hospital information | `hospital_name`, `hospital_address`, `hospital_phone`, `hospital_email` | Name shown in the header; contact details for printed reports |
| SLA targets | `sla_critical_hours` (24), `sla_high_days` (3), `sla_medium_days` (7), `sla_low_days` (7) | Deadlines used to flag overdue work on dashboards and reports |
| Ticket behaviour | `require_resolution_notes` (true), `allow_requester_closure` (true), `notify_new_critical` (false) | Workflow rules enforced by the ticket API |
| Appearance | `appearance_accent` (blue), `appearance_density` (comfortable), `appearance_show_requester` (true) | Brand accent, layout density, and requester column in request tables |

Non-sensitive keys (`hospital_*`, `appearance_*`, `system_name`) are exposed to every
signed-in user through `GET /api/admin/public-settings`, which the shell uses to render the
header and apply the theme. Administrator-level settings stay behind `sys_admin`.

## Digital Signage module (Multimedia Control)

Broadcast media to display devices across the hospital: register displays, organize them into
groups and a location hierarchy, upload images/videos, broadcast now or on a schedule, and audit
every action.

### Scope

- **In MVP:** play/stop broadcasting to one device, a group, or all devices; heartbeat-based
  online/offline detection (timeout default 3 min); device registration with a one-time secret
  (stored hashed); groups, locations, media library, one-shot and repeating schedules (daily /
  weekly / specific weekdays), playback history, device command queue with redelivery, and a full
  audit log.
- **Mock player:** the built-in `mock-local-player` integration reports real `play`/`stop`
  deliveries. Power/volume/mute/reboot commands are reported as `not_supported` — they are never
  faked as success. Real hardware drivers, emergency broadcast, remote power management and
  transcoding are later-phase features.
- **Permissions:** `it_staff` can view devices, upload media, broadcast and schedule content.
  `it_supervisor`, `admin` and `sys_admin` additionally register/disable devices, manage groups,
  locations and settings, and redeliver commands. Sending device commands can be enabled for
  `it_staff` via the `multimedia_allow_it_staff_commands` settings key (default off).

### Device heartbeat contract

Devices authenticate to `POST /api/multimedia/devices/heartbeat` with
`X-Device-Identifier` + `X-Device-Secret`. A heartbeat marks the device online, plays due
scheduled content, and pulls pending commands. Devices not heard from within the timeout are
treated as offline and are excluded from broadcasts (never reported as playing).

### Frontend

The module lives under `/multimedia` in the sidebar (Digital Signage section):
Dashboard, Devices (with per-device detail), Broadcast, Media Library, Groups, Locations,
Schedules, History, Device Commands (supervisors), Settings & Audit (supervisors).

### Testing the module without hardware

Two scripts in `server/scripts/` drive the whole workflow against a running API:

```bash
cd server
npm run test:mm          # end-to-end workflow test (78 assertions, cleans up after itself)
npm run sim:device -- --identifier TV-001 --secret nl-dev-xxx   # a TV that heartbeats and logs commands
```

See [TESTING.md](TESTING.md#manual-testing-of-the-multimedia-module-one-simulated-tv) for the
full manual walkthrough and the known gotchas (seeded devices have no secret, seeded media rows
have no file on disk, schedules run on demand).

## Frontend shell

- `/` is the landing page. Signed-out visitors get the animated sign-in screen
  (`client/src/pages/auth/Login.jsx`); signed-in users are sent straight to their role home
  (`/dashboard`, `/it`, `/maintenance`, `/admin`). `/login` remains as an alias, and every
  protected route redirects to `/` when there is no session.
- The sign-in backdrop (`client/src/components/AuthBackdrop.jsx`) layers the hospital photograph
  (`client/src/assets/hospital-bg.jpg`, from `backgound image.png`) with a slow Ken Burns push-in, a
  light grade + edge vignette, four screen-blended aurora layers, a rotating sheen, a drifting grid
  and film grain. The aurora colours come from the theme tokens, so the backdrop re-themes with
  the configured accent.
- The sign-in card is a dark glass panel (`backdrop-blur`) so the photograph stays clearly visible
  behind it.
- Sidebar navigation and its icons are defined once in `client/src/config/navigation.js`
  (`getNavGroups`, `NAV_ICONS`); `node scripts/verify-nav.mjs` checks that every nav item for
  every role resolves to a real icon.

## Security notes

- JWT auth; passwords bcrypt-hashed; deactivated users rejected on login and by their tokens.
- Login brute-force throttle: 5 failed attempts per email+IP locks for 15 minutes.
- Role-based access control enforced server-side (list scoping, detail access, action guards).
- Profile self-service (`PUT /api/auth/profile`) is limited to the caller's own name, email and
  phone; email changes are checked for uniqueness and every update is written to the audit log.
- Audit entries capture the client IP (behind a trusted proxy, `X-Forwarded-For` is honoured by
  Express `trust proxy`) and `/api/auth/me/security` derives the last login/IP and recent failed
  attempts from those entries — no extra security columns on `users`.
- File uploads: allow-listed extensions + MIME checks, 10 MB / 5 files max, authorization checked
  *before* files are written, and attachments are served only through authenticated download
  endpoints (no public `/uploads` static mount).
- Security headers (`nosniff`, `X-Frame-Options`, Referrer-Policy, `no-store`), strict JSON body
  parsing, SQL-injection-safe parameterized queries.
- Suggestions are private: non-admins only ever see their own.
