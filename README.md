# New Leaf Complex — Operations Request & Improvement System

A full-stack operations platform for the New Leaf Complex. Staff submit IT and
maintenance **tickets** and **improvement suggestions**; supervisors manage work queues,
technicians record work, and administrators track everything through role-scoped dashboards
and a searchable history with an audit trail.

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

There are 7 migrations. Two share the `20240101000002` prefix (`extend_ticket_dates`,
`system_settings`); Knex applies them lexicographically and they are independent. The last
migration, `20240101000006_multimedia_module`, adds the Digital Signage module (10 tables:
locations, media assets, devices, groups, group membership, playback assignments, schedules,
playback history, device commands, audit log).

## Tests

```bash
cd server
npm run test:setup     # rebuild the test DB (rollback → migrate → seed, test env)
npm test               # vitest run — full API integration suite
```

See [TESTING.md](TESTING.md) for a detailed breakdown of the six suites.

## Documentation

| Document | Contents |
| --- | --- |
| [README.md](README.md) | Setup, seeded accounts, API surface, security notes |
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

Everything is under `/api` and authenticated with `Authorization: Bearer <token>` (a
`/api/auth/login` returns `{ token, user }`). `GET /api/auth/me` returns the current user.

| Module | Routes |
| --- | --- |
| `auth` | `POST /login`, `POST /logout`, `POST /change-password`, `GET /me` |
| `users` | user CRUD, `GET /technicians?type=it\|maintenance`, password reset (sys_admin) |
| `tickets` | list w/ filters + pagination, detail, create, update (assign/status/priority), comments, work notes, attachments |
| `suggestions` | list w/ filters + pagination, detail, create, update (workflow + assignment), comments, attachments |
| `dashboard` | role-scoped stats (totals, IT/maintenance splits, recent tickets, my open requests) |
| `notifications` | list, `GET /unread-count`, `PUT /:id/read`, `PUT /read-all` |
| `admin` | category/status/priority/department/role/settings reference management, `GET /activity-logs` (sys_admin) |
| `multimedia` | Digital Signage: devices (register + enable/disable + heartbeat), dashboard stats, groups, locations, media upload/stream, broadcast to one/group/all, schedules, playback history, device commands, settings & audit log |

### Access model (short version)

- **staff** — create tickets/suggestions, track their own, reopen/resolve/close their tickets when asked.
- **it_staff / maintenance_staff** — their team's queue; move assigned tickets forward, add comments + work notes + attachments.
- **it_supervisor / maintenance_supervisor** — full control of their team's tickets (assign, priority, status, workflow).
- **admin** — everything; drives the suggestion review workflow.
- **sys_admin** — admin + user/role/settings/activity-log management.

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

## Security notes

- JWT auth; passwords bcrypt-hashed; deactivated users rejected on login and by their tokens.
- Login brute-force throttle: 5 failed attempts per email+IP locks for 15 minutes.
- Role-based access control enforced server-side (list scoping, detail access, action guards).
- File uploads: allow-listed extensions + MIME checks, 10 MB / 5 files max, authorization checked
  *before* files are written, and attachments are served only through authenticated download
  endpoints (no public `/uploads` static mount).
- Security headers (`nosniff`, `X-Frame-Options`, Referrer-Policy, `no-store`), strict JSON body
  parsing, SQL-injection-safe parameterized queries.
- Suggestions are private: non-admins only ever see their own.#   N e w - L e a f - C o m p l e x  
 #   N e w - L e a f - C o m p l e x  
 