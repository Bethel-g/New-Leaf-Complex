# New Leaf Complex — Project Architecture

## System Purpose

The New Leaf Operations Request & Improvement System is a centralized web platform for hospital staff at New Leaf Complex. It replaces paper/email-based reporting with a single system for:

- Submitting and tracking **IT support** requests (computers, printers, network, software, accounts, etc.)
- Submitting and tracking **maintenance** requests (plumbing, electrical, AC, medical equipment, building, etc.)
- Submitting and reviewing **staff suggestions / improvements** for hospital operations
- Assignment, prioritization, commenting, internal work notes, attachments, and status tracking
- Notifications, dashboards, reporting, and audit logging for management

The system is role-aware: ordinary staff create and track their own requests; IT and maintenance teams manage their respective queues; administrators manage users, departments, categories, and review suggestions.

## Technology Stack

The project already has a full stack in place. **This stack should be preserved** — there is no technical reason to replace it.

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Backend language | JavaScript (CommonJS, Node.js runtime) | — | Node 18+ expected (`node --watch` used in dev script) |
| Backend framework | Express | ^4.21.0 | REST API, JSON, CORS enabled |
| Database | PostgreSQL | — | `pg` driver |
| Query builder / ORM | Knex | ^3.1.0 | Migrations + seeds |
| Authentication | JWT (`jsonwebtoken`) + `bcryptjs` | ^9.x / ^2.4.3 | Stateless bearer tokens, 24h expiry |
| File uploads | Multer | ^1.4.5-lts.1 | Attachments, 10MB limit, max 5 files |
| Frontend language | JavaScript (JSX, no TypeScript) | — | |
| Frontend framework | React | ^19.2.8 | Function components + hooks |
| Build tool | Vite | ^8.3.0 | Dev port 3000, proxies `/api` + `/uploads` to :5000 |
| Styling | Tailwind CSS | ^4.3.3 | Via `@tailwindcss/vite` plugin |
| Routing (client) | react-router-dom | ^6.30.6 | Protected routes + role routes |
| HTTP client | axios | ^1.20.0 | Base `/api`, auth header interceptor, 401 redirect |
| UI/utility libs | lucide-react, react-hot-toast, recharts, date-fns | — | Icons, toasts, charts, date formatting |
| Linting (client) | oxlint | ^1.81.0 | Combined with oxlint's react plugin |
| Validation | express-validator | ^7.2.0 | Server-side input validation via `utils/validate.js` wrapper |

### Infrastructure / config
- `.env` in `server/` holds port, DB credentials, JWT secret/expiry, upload dir.
- No frontend `.env` — the Vite dev proxy forwards `/api` to the backend.
- There is no git repository yet (`.gitignore` exists, `git init` not run).

## Main Modules

The system is organized into three business modules plus supporting infrastructure. All three modules already have working backend + frontend implementations.

### 1. IT Support Ticket System
- Staff submit IT tickets (category, title, description, location, contact, priority, attachments).
- IT staff/supervisors list, filter, assign, prioritize, update status, add work notes/comments/attachments, resolve, close.
- Ticket numbering `IT-0001`.
- IT statuses: New, Assigned, In Progress, Waiting for Information, Resolved, Closed.

### 2. Maintenance Ticket System
- Same ticket engine but `type = 'maintenance'`, different categories and statuses.
- Ticket numbering `MT-0001`.
- Maintenance statuses: New, Assigned, Inspection, In Progress, Waiting for Parts, Completed, Closed.

### 3. Staff Suggestion & Improvement System
- Staff submit suggestions (title, problem, proposed solution, expected benefit).
- Admins review, set status, forward to a department, and comment.
- Suggestion numbering `S-0001`.
- Suggestion statuses (primary flow): Submitted, Under Review, Accepted, Assigned, Implementation, Implemented, Closed; supplementary: Rejected, Need More Information, Already Planned, Forwarded to Department.

### Cross-cutting modules (already present)
- **Auth & roles** — JWT login/logout/change-password, role-based access.
- **Comments & attachments** — on tickets (comments + internal work notes + attachments) and suggestions (comments).
- **Notifications** — in-app notifications with read/unread state.
- **Dashboards & reporting** — per-role dashboards, admin reports with CSV export.
- **Audit logging** — `activity_logs` table; ticket-level history timeline.

## User Roles

Roles are stored in the `roles` table and enforced server-side via `authenticate` + `authorize` middleware.

| Role | Access |
|------|--------|
| `staff` | Create IT/maintenance tickets and suggestions; view own requests only; comment on own requests; close/reopen own resolved/closed tickets |
| `it_staff` | View/update/resolve IT tickets assigned to them; comment; add work notes/attachments. May NOT assign or change priority |
| `it_supervisor` | View whole IT queue; assign to technicians; change status/priority; add comments/work notes |
| `maintenance_staff` | View/update/complete maintenance tickets assigned to them (same pattern as IT) |
| `maintenance_supervisor` | View whole maintenance queue; assign; change status/priority (same pattern as IT) |
| `admin` | View all requests; review/assign suggestions; reports; activity log. Has NO user/department/category/role management |
| `sys_admin` | Everything `admin` can, plus user accounts, roles, departments, categories, and system settings |

Permission model is centralized in `server/src/utils/permissions.js` (role → team-type mapping, `canManageTicket`/`canViewTicket`/`canAssign`/`canControlTicket`/`canManageSystem`) and enforced per-route with the `authenticate` + `authorize(...roles)` middleware plus ticket-object checks in `routes/tickets.js`. Request-scoped visibility applies to lists and dashboards: staff see only their own, IT/maintenance staff see only tickets assigned to them, supervisors see their team type, admin/sys_admin see everything.

## Database Entities

PostgreSQL database `newleaf_db`. Initialized by Knex migration `20240101000001_initial_schema.js` (15 tables), extended by `20240101000002_extend_ticket_dates.js` (ticket `resolved_date`/`closed_date` + query indexes + unique constraints), `20240101000003_operations_workflow_statuses.js` (workflow statuses) and `20240101000002_system_settings.js` (system settings table). Seeded by `001_initial_data.js` (roles, departments, categories, statuses, priorities, 10 demo users with password `password123`).

### Existing tables
| Table | Purpose |
|-------|---------|
| `users` | Staff/team accounts, email unique, bcrypt password hash, links to `departments` + `roles` |
| `roles` | System roles (staff, it_staff, it_supervisor, maintenance_staff, maintenance_supervisor, admin, sys_admin) |
| `departments` | Hospital departments (Administration, IT, Maintenance, Nursing, ...) |
| `categories` | Ticket categories with `type` enum (`it` / `maintenance`) |
| `priorities` | Low, Medium, High, Critical (+ `level` for ordering) |
| `statuses` | Workflow statuses with `type` enum (`it` / `maintenance` / `suggestion`) + `sort_order` |
| `tickets` | Core ticket record. `type` enum (`it`/`maintenance`), requester, department, category, priority, status, assignee, title/description/location/contact/equipment, lifecycle dates (`created_at`, `updated_at`, `resolved_date`, `closed_date`) |
| `ticket_comments` | Public conversation on a ticket |
| `ticket_work_notes` | Internal notes + `parts_used` (visible only to managing team) |
| `ticket_attachments` | Uploaded files (stored in `uploads/`, DB stores file name/path) |
| `ticket_history` | Audit timeline for a ticket (created, assigned, status_changed, priority_changed, work_notes_added) |
| `suggestions` | Suggestion record: author, department, title, problem, proposed_solution, expected_benefit, status, assigned_department |
| `suggestion_comments` | Comments on suggestions |
| `notifications` | In-app notifications (user, title, message, is_read) |
| `activity_logs` | Global audit log (user, action, entity_type, entity_id, details) |
| `system_settings` | Key/value system configuration (`system_name`, upload limits, session timeout) managed by sys_admin |

### Proposed enhancements (for later phases — not implemented now)
- `notifications`: add `type` + linked `entity_type`/`entity_id` so UI can navigate to the source.
- `suggestions` attachments: suggestions currently have no attachment support (tickets do).
- `activity_logs`: consider covering more actions (user CRUD currently not fully logged) and adding IP/user-agent.
- `permissions` table (optional future): move hardcoded role allowances into data-driven permissions if a finer matrix is needed.

## Application Architecture

```
Browser (React SPA)
   │  axios → /api/...   (Vite dev proxy → http://localhost:5000)
   ▼
Express API (server/src)
   │
   ├─ app.js               createApp() factory (exported for testing); index.js only boots the listener
   ├─ middleware/auth.js   authenticate (JWT → user+role, is_active check) / authorize(...roles)
   ├─ routes/              REST endpoints (see below)
   ├─ utils/helpers.js     ticket/suggestion numbers, ticket history, notifications
   ├─ utils/permissions.js centralized RBAC rules (canManageTicket, canAssign, scopeTicketQuery, …)
   ├─ utils/validate.js    express-validator wrapper
   ├─ config/              env config + Knex connection
   └─ database/            Knex migrations + seeds
   │
   ▼
PostgreSQL (newleaf_db / newleaf_test)
```

### API routes (`/api`)
| Prefix | Routes | Auth |
|--------|--------|------|
| `/api/auth` | `POST /login`, `POST /logout`, `POST /change-password`, `GET /me` | login public, rest JWT-ish |
| `/api/users` | `GET /`, `GET /technicians`, `POST /`, `PUT /:id`, `PUT /:id/password`, `DELETE /:id` | JWT + role |
| `/api/tickets` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `POST /:id/comments`, `POST /:id/work-notes`, `POST /:id/attachments` | JWT + permissions |
| `/api/suggestions` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `POST /:id/comments` | JWT + permissions |
| `/api/dashboard` | `GET /` (role-aware stats) | JWT |
| `/api/notifications` | `GET /`, `GET /unread-count`, `PUT /read-all`, `PUT /:id/read` | JWT |
| `/api/admin` | reference data (GET categories/statuses/priorities — any authenticated); GET departments (admin+sys_admin); activity-logs (sys_admin); CRUD departments/categories/roles (sys_admin); system settings (sys_admin) | JWT + role |
| `/uploads` | static file serving for attachments | static |

### Client architecture
- `AuthContext` stores user + token in `localStorage`; axios interceptor attaches token and redirects to `/login` on 401.
- `App.jsx` defines routes; `ProtectedRoute` guards login; `RoleRoute` restricts by role.
- `Layout.jsx` renders role-aware sidebar (from `config/navigation.js` — single source of truth per role) + top bar with unread notification polling (30s).
- Shared components: `Badge`, `TicketTable`, `TicketCard`, `StatCard`, `Modal`, `EmptyState`.
- Pages grouped: `pages/auth`, `pages/staff`, `pages/it`, `pages/maintenance`, `pages/admin`, `pages/common`.

## Folder Structure

```
New-Leaf/
├── .gitignore
├── PROJECT_ARCHITECTURE.md          (this file)
├── DEVELOPMENT_PLAN.md
├── client/                          # React SPA (Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js               # dev server + /api proxy
│   ├── .oxlintrc.json               # oxlint rules
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  # router + route guards
│       ├── index.css, App.css
│       ├── assets/                  # images, svg
│       ├── components/              # Badge, Modal, StatCard, Layout, TicketTable, TicketCard, EmptyState
│       ├── context/AuthContext.jsx
│       ├── services/api.js          # axios instance
│       └── pages/
│           ├── auth/Login.jsx
│           ├── staff/               # StaffDashboard, SubmitITRequest, SubmitMaintenanceRequest, SubmitSuggestion, MyRequests
│           ├── it/                  # ITDashboard, ITTicketList, ITTicketDetail
│           ├── maintenance/         # MaintenanceDashboard, MaintenanceTicketList, MaintenanceTicketDetail
│           ├── admin/               # AdminDashboard, AllRequests, SuggestionsReview, Reports, UserManagement, DepartmentManagement, CategoryManagement, ActivityLog
│           └── common/              # NotificationList, Profile
├── server/                          # Express API
│   ├── package.json
│   ├── knexfile.js                  # dev DB connection + migration/seed dirs
│   ├── .env                         # environment config (local)
│   ├── e2e-test.js                  # manual E2E script (run against :5000)
│   ├── test-insert.js               # ad-hoc DB insert script
│   ├── vitest.config.mjs            # Vitest config (NODE_ENV=test, newleaf_test, no parallelism)
│   ├── test/                        # auth.test.js, rbac.test.js, helpers.mjs, setup.js, global-setup.cjs
│   └── src/
│       ├── index.js                 # app bootstrap (listener only)
│       ├── app.js                   # createApp() factory — routes/middleware mounted here
│       ├── config/                  # index.js (env), db.js (Knex instance)
│       ├── database/
│       │   ├── migrations/20240101000001_initial_schema.js
│       │   ├── migrations/20240101000002_extend_ticket_dates.js
│       │   ├── migrations/20240101000003_operations_workflow_statuses.js
│       │   ├── migrations/20240101000002_system_settings.js
│       │   └── seeds/001_initial_data.js
│       ├── middleware/auth.js       # authenticate + authorize
│       ├── routes/                  # auth, users, tickets, suggestions, dashboard, notifications, admin
│       └── utils/                   # helpers.js, permissions.js, validate.js
└── uploads/                         # attachment files (gitignored, .gitkeep kept)
```

## Existing Functionality That Can Be Reused

- **Ticket engine** — `tickets` table + `tickets.js` route already supports IT and maintenance via the `type` column; adding a new ticket type follows the same pattern.
- **Auth + role middleware** — `authenticate`/`authorize` are generic and reusable.
- **Helpers** — `generateTicketNumber`, `addTicketHistory`, `createNotification` are generic utilities.
- **Database migrations/seeds** — Knex-based, extendable with new migrations (do not edit the existing migration).
- **Upload handling** — multer storage configured and reused for ticket attachments.
- **Notifications** — DB table, route, UI list, and unread badge polling are in place.
- **UI components** — reusable Badge (status/priority colors), StatCard, Modal, EmptyState, LoadingSpinner, TicketTable.
- **Role-aware dashboards** — the `/dashboard` route and dashboard pages can be extended for new report metrics.