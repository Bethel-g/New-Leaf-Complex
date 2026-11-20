# New Leaf Complex — Development Plan

This plan maps the implementation of the system into phases. The project already contains working foundations for most modules (built in a previous step); therefore each phase below states **current state** and the **remaining work** to bring it to production quality. No new business modules are to be built in this step.

Legend:
- **Status — Done:** fully implemented today.
- **Status — Partial:** works but needs hardening.
- **Status — Pending:** not yet implemented.

---

## Phase 1 — Authentication and Roles

**Status: Done (hardening backlog below)**

Current state:
- JWT login/logout, `GET /auth/me` (via hardened `authenticate`, checks `is_active`), change-password (`bcryptjs` hashing, 24h expiry) — Done.
- Role-based access via `authenticate` (JWT decode → user w/ role) and `authorize(...roles)` middleware; centralized rules in `utils/permissions.js` — Done.
- Client-side `AuthContext` + localStorage persistence + `ProtectedRoute`/`RoleRoute` — Done.
- Demo users seeded for every role — Done.
- Failed-login and auth events logged to `activity_logs` — Done.
- Server-side input validation via `express-validator` for login, password change, user/department/category/role CRUD (`utils/validate.js`) — Done.
- User/department/category/role/system-settings management restricted to `sys_admin`; categories/statuses/priorities readable by any authenticated user; assign/priority restricted to supervisors+admins — Done.
- Backend test suite (`Vitest + Supertest`, isolated `newleaf_test` DB) covering every role's login, deactivated accounts, tampered tokens, logout, `/auth/me`, change-password, and a full end-to-end RBAC permission matrix — Done.

Remaining work (backlog):
- Consider shorter token expiry + refresh-token flow (tokens are 24h today; `JWT_SECRET` is already required in production and `is_active` is re-checked on every request).
- Deactivate-instead-of-delete user policy (see Phase 8 / issues).

---

## Phase 2 — IT Support Ticket System

**Status: Done (requires hardening)**

Current state:
- Create IT ticket with category, title, description, location, contact, priority, up to 5 attachments; auto `IT-XXXX` number; default status `New`; supervisor notified — Done.
- List with filters (type, status, priority, department, category, search, assignee, requester) + pagination — Done.
- Detail view with comments, attachments, history timeline, internal work notes, available statuses — Done.
- Assign, change priority/status, resolve/close, requester close/reopen rules enforced — Done.
- UI: `SubmitITRequest`, `ITTicketList`, `ITTicketDetail`, `ITDashboard` — Done.

Remaining work:
- Add SLAs/SLA timers per priority and overdue highlighting (reporting hooks already in `Reports.jsx`).
- Validate and bound pagination params (`page`, `limit`); cap `limit`.
- Add ticket edit audit coverage of title/description/location changes (only status/assign/priority are logged today via `addTicketHistory`).
- Consider email notifications (out of scope for MVP).

---

## Phase 3 — Maintenance Ticket System

**Status: Done (requires hardening)**

Current state:
- Same ticket engine via `tickets.type = 'maintenance'`; `MT-XXXX` numbering; maintenance-specific statuses incl. `Inspection`, `Waiting for Parts` — Done.
- Maintenance categories seeded; assign/status/comment/work-notes (`parts_used`) supported — Done.
- UI: `SubmitMaintenanceRequest`, `MaintenanceTicketList`, `MaintenanceTicketDetail`, `MaintenanceDashboard` — Done.

Remaining work:
- Same hardening as Phase 2 (pagination bounds, param validation, SLA).
- Add parts/inventory tracking if required (future; today parts are free-text on work notes).

---

## Phase 4 — Suggestion & Improvement System

**Status: Partial**

Current state:
- Create suggestion (title, problem, proposed solution, expected benefit); `S-XXXX` numbering; default status `Submitted`; admins notified — Done.
- Admin review: update status, forward to a department, comment; author notified on status change — Done.
- Detail/list access restricted to author or admin — Done.
- UI: `SubmitSuggestion`, `SuggestionsReview`, `MyRequests` integration — Done.

Remaining work:
- Add **attachments** to suggestions (mirror the ticket attachment flow; requires new table `suggestion_attachments` + migration, or reuse a generic file table).
- Decide visibility for supervisors/technicians (today only the author or admins can view a suggestion).
- Add comments history/audit timeline for suggestions (today comments exist but no history table).
- Track "benefits realized" follow-up on implemented suggestions (future).

---

## Phase 5 — Comments and Attachments

**Status: Partial**

Current state:
- Tickets: public comments (`ticket_comments`), internal work notes (`ticket_work_notes`, team-only), file attachments (`ticket_attachments`, 10MB, ≤5 files) with notifications on comments — Done.
- Suggestions: comments (`suggestion_comments`) with notifications — Done.

Remaining work:
- Add `suggestion_attachments` (Phase 4).
- Harden upload security: validate MIME type / extension whitelist, protect against path traversal in `file_name`, restrict public access of `/uploads` to authorized users (currently static and open).
- Consistent attachment URL/access handling; delete orphaned files when records are removed.
- Consider rich-text sanitization for comments (they are rendered as plain text today).

---

## Phase 6 — Notifications

**Status: Partial**

Current state:
- DB `notifications` table; creation for: new tickets (supervisors), assignment, resolution/completion, reopen, new comments, new suggestions (admins), suggestion status change — Done.
- API: list, unread count, mark-all-read, mark-one-read — Done.
- UI: notification list page + top-bar unread badge (polls every 30s + on window focus) — Done.

Remaining work:
- Add `type` + `entity_type`/`entity_id` to notifications so items deep-link to the source (ticket/suggestion detail) — **Done**
  (`20240101000007_notification_task_links`; the notification list and detail resolve the linked task).
- Add pagination on `GET /notifications` (currently capped at 50) — **Still open**; the list remains capped.
- Notification preferences (per-user opt-outs) — **Done** (`user_preferences`, `GET/PUT /notifications/preferences`);
  email push later.

---

## Phase 7 — Dashboard / Reporting

**Status: Partial**

Current state:
- Role-aware `/dashboard` endpoint: totals, open/in-progress/resolved/closed, critical, IT/maintenance/suggestion counts, by-department and by-category breakdowns, recent & recently-completed tickets, my-assigned list — Done.
- UI dashboards for staff, IT, maintenance, admin; admin `Reports` with charts (recharts) and CSV export, average resolution time, overdue detection — Done.

Remaining work:
- Report data currently aggregates in memory on the client; move heavier reports to server endpoints (`/api/reports`) with date-range filters — **Still open**.
- Add charts for suggestions and per-user/per-category workload; trend over time — **Done** (Admin dashboard workload
  and review panels; Reports adds an over-time trend and top-requester breakdown).
- Note: role-scoping of dashboard counts was addressed in the auth/RBAC hardening phase (counts are now computed against the caller's role scope).

---

## Phase 8 — Audit Logging

**Status: Partial**

Current state:
- `activity_logs` table; login, logout, change-password, and **failed login attempts** recorded — Done.
- Ticket history timeline (`ticket_history`) for create/assign/status/priority/work-note events — Done.
- Admin UI `ActivityLog` page (latest 100) — Done.

Remaining work:
- Log user CRUD (create/update/delete, admin reset password), department/category CRUD, and suggestion status changes —
  **Partial**: auth events, failed logins and self-service profile updates are audited; admin CRUD logging is still open.
- Store contextual data (IP address, user agent) and a `performed_by` in addition to `user_id` — **Partial**:
  `activity_logs.ip_address` is captured (`20240101000008_profile_audit_prefs`) and returned by the audit API;
  user-agent and `performed_by` are not stored.
- Add pagination + filters (action type, user, date range) to the activity-log endpoint — **Done** (`GET /admin/activity-logs`
  supports action/user/date filters and exposes the IP; `GET /admin/recent-activity` is the admin-safe dashboard feed).

---

## Phase 9 — Testing

**Status: Partial (server suite added)**

Current state:
- Test framework added: **Vitest + Supertest** against an isolated `newleaf_test` database (auto-created, migrated, and seeded from `knexfile.js` test config).
  - `test/auth.test.js`: login for every role, wrong password, unknown email, deactivated account, input validation, logout (incl. idempotence), `/auth/me` (no password hash), invalid/tampered tokens, token of a deactivated user, change-password.
  - `test/rbac.test.js`: full permission-matrix scenario end-to-end (own-team vs other-team visibility, assign/priority restrictions, work-notes hiding, requester close/reopen, 401 without token, 401 on bad token) plus sys_admin-only management routes.
- Still present: `server/test-insert.js` ad-hoc DB script.

Remaining work:
- Unit tests: `utils/helpers.js` (ticket-number generation, notification creation), `utils/permissions.js`.
- Add server linter (e.g. ESLint) and run lint + tests before merging.
- Add client tests (recommend **Vitest + React Testing Library**) for auth context, route guards, key components (Badge/TicketTable/Modal) and a page-level smoke test.
- Add a CI step running `knex migrate:latest --env test && knex seed:run --env test && vitest run` (or `npm run test:setup && npm test`).
- Consider restoring `e2e-test.js` as a smoke suite against a running server.

---

## Cross-cutting notes for all phases
- Never edit the existing `20240101000001_initial_schema.js` migration; add new migration files for schema changes.
- Follow existing patterns: route files under `server/src/routes`, months of role checks via middleware, components under `client/src/components`, pages under `client/src/pages/<module>`.
- Preserve current functionality; introduce only libraries already present unless a phase explicitly needs one.