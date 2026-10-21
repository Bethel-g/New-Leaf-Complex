/**
 * API contract snapshots.
 *
 * These pin the *shape* of every JSON response the application exposes: which
 * keys are returned, their types, and for reference-data endpoints the actual
 * values. They are written with `toMatchSnapshot()`, so the committed `.snap`
 * file is the human-readable record of the contract:
 *
 *   npm run test:regression           compare against the committed snapshots
 *   npm run test:regression:update    rewrite them after an intended change
 *
 * Volatile values are collapsed by `normalize()` (ids → `<id>`, timestamps →
 * `<timestamp>`, secrets → `<secret>`, stored file names → `<file>`), so a
 * snapshot only changes when the *contract* changes.
 *
 * Every snapshot also records the HTTP status code, because a 200 that becomes
 * a 500 is the most important regression to catch.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  db, call, login, loginAs, attach, request,
  normalize, normalizeIds, shape, refs, cleanupUploads,
} from './helpers.mjs';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

afterAll(cleanupUploads);

/** `{ status, body }` — the full contract of a response, ready to snapshot. */
async function contract(token, method, url, body) {
  const res = await call(token, method, url, body);
  return { status: res.status, body: normalize(res.body) };
}

describe('Contract: auth', () => {
  it('POST /api/auth/login returns a token plus the user without the hash', async () => {
    const res = await request.post('/api/auth/login')
      .send({ email: 'mike.tech@newleaf.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['token', 'user']);
    // Note: login returns the raw users row (role_description is NOT included),
    // while GET /auth/me returns the curated USER_COLUMNS projection. The two
    // payloads are intentionally different — see the next test.
    expect(keys(res.body.user)).toEqual([
      'created_at', 'department_id', 'department_name', 'email', 'employee_id',
      'id', 'is_active', 'name', 'phone', 'role_id', 'role_name', 'updated_at',
    ]);
    expect(normalize(res.body)).toMatchSnapshot('login');
  });

  it('GET /api/auth/me returns the current user with role and department', async () => {
    const sysAdmin = await loginAs('sys_admin');
    const res = await call(sysAdmin.token, 'get', '/auth/me');
    expect(res.status).toBe(200);
    // /auth/me uses the curated USER_COLUMNS projection: no created_at /
    // updated_at, but it does carry role_description.
    expect(keys(res.body)).toEqual([
      'department_id', 'department_name', 'email', 'employee_id', 'id',
      'is_active', 'name', 'phone', 'role_description', 'role_id', 'role_name',
    ]);
    expect(normalize(res.body)).toMatchSnapshot('me');
  });

  it('the error envelope for auth failures is a flat message', async () => {
    const wrong = await request.post('/api/auth/login')
      .send({ email: 'mike.tech@newleaf.com', password: 'nope' });
    expect({ status: wrong.status, body: wrong.body }).toMatchSnapshot('bad-password');

    const invalid = await request.post('/api/auth/login').send({ email: 'bad', password: '' });
    expect({ status: invalid.status, body: invalid.body }).toMatchSnapshot('validation');
  });

  it('POST /api/auth/logout always returns the same message', async () => {
    const staff = await loginAs('staff');
    const withToken = await request.post('/api/auth/logout')
      .set('Authorization', `Bearer ${staff.token}`);
    const withoutToken = await request.post('/api/auth/logout');
    expect(withToken.status).toBe(200);
    expect(withoutToken.status).toBe(200);
    expect(withToken.body).toEqual(withoutToken.body);
  });
});

describe('Contract: reference data (values are pinned)', () => {
  let sysAdmin; let staff;

  beforeAll(async () => {
    [sysAdmin, staff] = await Promise.all([loginAs('sys_admin'), loginAs('staff')]);
  });

  it('GET /api/admin/categories — the full it/maintenance taxonomy', async () => {
    expect(await contract(sysAdmin.token, 'get', '/admin/categories'))
      .toMatchSnapshot('categories-all');
  });

  it('GET /api/admin/categories?type=it', async () => {
    expect(await contract(sysAdmin.token, 'get', '/admin/categories?type=it'))
      .toMatchSnapshot('categories-it');
  });

  it('GET /api/admin/priorities — level order is the escalation order', async () => {
    expect(await contract(sysAdmin.token, 'get', '/admin/priorities'))
      .toMatchSnapshot('priorities');
  });

  it('GET /api/admin/statuses — all three workflows and their sort order', async () => {
    expect(await contract(sysAdmin.token, 'get', '/admin/statuses'))
      .toMatchSnapshot('statuses-all');
  });

  it('GET /api/admin/statuses?type=it / maintenance / suggestion', async () => {
    expect(await contract(sysAdmin.token, 'get', '/admin/statuses?type=it'))
      .toMatchSnapshot('statuses-it');
    expect(await contract(sysAdmin.token, 'get', '/admin/statuses?type=maintenance'))
      .toMatchSnapshot('statuses-maintenance');
    expect(await contract(sysAdmin.token, 'get', '/admin/statuses?type=suggestion'))
      .toMatchSnapshot('statuses-suggestion');
  });

  it('GET /api/admin/departments', async () => {
    expect(await contract(sysAdmin.token, 'get', '/admin/departments'))
      .toMatchSnapshot('departments');
  });

  it('GET /api/admin/roles', async () => {
    expect(await contract(sysAdmin.token, 'get', '/admin/roles'))
      .toMatchSnapshot('roles');
  });

  it('GET /api/admin/settings — key, value, category and protection flag', async () => {
    expect(await contract(sysAdmin.token, 'get', '/admin/settings'))
      .toMatchSnapshot('settings');
  });

  it('reference data is identical for a plain staff member', async () => {
    // Forms are populated by any authenticated user; the payload must not
    // depend on the caller's role.
    for (const url of ['/admin/categories', '/admin/priorities', '/admin/statuses']) {
      const asStaff = await contract(staff.token, 'get', url);
      const asSys = await contract(sysAdmin.token, 'get', url);
      expect(asStaff).toEqual(asSys);
    }
  });
});

describe('Contract: user administration (shape pinned, ids masked)', () => {
  let sysAdmin; let r;

  beforeAll(async () => {
    sysAdmin = await loginAs('sys_admin');
    r = await refs();
  });

  it('GET /api/users roster shape', async () => {
    expect(await contract(sysAdmin.token, 'get', '/users'))
      .toMatchSnapshot('users-roster');
  });

  it('GET /api/users/technicians shapes per type', async () => {
    expect(await contract(sysAdmin.token, 'get', '/users/technicians?type=it'))
      .toMatchSnapshot('technicians-it');
    expect(await contract(sysAdmin.token, 'get', '/users/technicians?type=maintenance'))
      .toMatchSnapshot('technicians-maintenance');
  });

  it('GET /api/users/staff shape', async () => {
    expect(await contract(sysAdmin.token, 'get', '/users/staff'))
      .toMatchSnapshot('staff-list');
  });

  it('mutation envelopes', async () => {
    const email = `contract.${Date.now()}@newleaf.com`;
    const created = await contract(sysAdmin.token, 'post', '/users', {
      name: 'Contract Probe', email, password: 'password123',
      department_id: r.deptNursing.id, role_id: r.roleStaff.id,
    });
    expect(created).toMatchSnapshot('user-create');

    const id = created.body.id;
    expect(await contract(sysAdmin.token, 'put', `/users/${id}`, { name: 'Contract Probe 2' }))
      .toMatchSnapshot('user-update');
    expect(await contract(sysAdmin.token, 'put', `/users/${id}/password`, { password: 'contractpass1' }))
      .toMatchSnapshot('user-password');
    expect(await contract(sysAdmin.token, 'delete', `/users/${id}`))
      .toMatchSnapshot('user-delete');
  });
});

describe('Contract: tickets', () => {
  let staff; let sysAdmin; let r; let ticketId;

  beforeAll(async () => {
    [staff, sysAdmin] = await Promise.all([loginAs('staff'), loginAs('sys_admin')]);
    r = await refs();
    const created = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Contract probe ticket',
      description: 'shape check', location: 'Ward B', priority: 'High',
    });
    ticketId = created.body.id;
  });

  it('GET /api/tickets — paginated envelope with total/page/limit', async () => {
    expect(await contract(staff.token, 'get', '/tickets'))
      .toMatchSnapshot('ticket-list-staff');
    expect(await contract(sysAdmin.token, 'get', '/tickets'))
      .toMatchSnapshot('ticket-list-admin');
  });

  it('pagination clamps the limit and echoes the effective page', async () => {
    expect(await contract(staff.token, 'get', '/tickets?page=1&limit=5'))
      .toMatchSnapshot('ticket-list-page1-limit5');
    expect(await contract(staff.token, 'get', '/tickets?page=-3&limit=99999'))
      .toMatchSnapshot('ticket-list-clamped');
  });

  it('every documented filter is accepted and echoed back consistently', async () => {
    const cases = {
      'type=it': 'filter-type',
      'status=New': 'filter-status',
      'priority=High': 'filter-priority',
      'search=Contract': 'filter-search',
      'location=Ward': 'filter-location',
    };
    for (const [query, name] of Object.entries(cases)) {
      const res = await call(staff.token, 'get', `/tickets?${query}`);
      expect(res.status, query).toBe(200);
      expect(normalize({ status: res.status, body: res.body })).toMatchSnapshot(name);
    }
  });

  it('GET /api/tickets/:id — detail with comments, attachments, history, work notes, statuses', async () => {
    const detail = await call(sysAdmin.token, 'get', `/tickets/${ticketId}`);
    expect(detail.status).toBe(200);
    expect(keys(detail.body)).toEqual([
      'attachments', 'comments', 'history', 'statuses', 'ticket', 'workNotes',
    ]);
    expect(keys(detail.body.ticket)).toEqual([
      'assigned_to', 'assignee_name', 'category_id', 'category_name',
      'closed_date', 'contact_info', 'created_at', 'department_id',
      'department_name', 'description', 'equipment_name', 'id', 'location',
      'priority_id', 'priority_level', 'priority_name', 'requester_email',
      'requester_id', 'requester_name', 'requester_phone', 'resolution_notes',
      'resolved_date', 'status_id', 'status_name', 'ticket_number', 'title',
      'type', 'updated_at',
    ]);
    expect(normalize(detail.body)).toMatchSnapshot('ticket-detail');
  });

  it('POST /api/tickets/:id/comments and /work-notes envelopes', async () => {
    expect(await contract(staff.token, 'post', `/tickets/${ticketId}/comments`, { comment: 'contract comment' }))
      .toMatchSnapshot('ticket-comment');
    expect(await contract(sysAdmin.token, 'post', `/tickets/${ticketId}/work-notes`, { notes: 'internal', parts_used: 'none' }))
      .toMatchSnapshot('ticket-work-note');
    expect(await contract(staff.token, 'post', `/tickets/${ticketId}/work-notes`, { notes: 'sneaky' }))
      .toMatchSnapshot('ticket-work-note-forbidden');
  });

  it('POST /api/tickets/:id/attachments envelope', async () => {
    const res = await attach(staff.token, `/tickets/${ticketId}/attachments`, PNG, 'contract.png', 'image/png');
    expect({ status: res.status, body: normalize(res.body) }).toMatchSnapshot('ticket-attachment-upload');
  });

  it('validation and 404 envelopes', async () => {
    expect(await contract(staff.token, 'post', '/tickets', { type: 'it' }))
      .toMatchSnapshot('ticket-create-validation');
    expect(await contract(staff.token, 'post', '/tickets', { type: 'it', category_id: r.mCat.id, title: 'x' }))
      .toMatchSnapshot('ticket-create-category-type-mismatch');
    expect(await contract(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Valid title', priority: 'Urgent' }))
      .toMatchSnapshot('ticket-create-bad-priority');
    expect(await contract(staff.token, 'get', '/tickets/999999'))
      .toMatchSnapshot('ticket-missing');
  });
});

describe('Contract: suggestions', () => {
  let staff; let admin; let suggestionId;

  beforeAll(async () => {
    [staff, admin] = await Promise.all([loginAs('staff'), loginAs('admin')]);
    suggestionId = (await call(staff.token, 'post', '/suggestions', {
      title: 'Contract probe suggestion',
      problem: 'p', proposed_solution: 's', expected_benefit: 'b',
    })).body.id;
  });

  it('GET /api/suggestions — paginated envelope', async () => {
    expect(await contract(staff.token, 'get', '/suggestions'))
      .toMatchSnapshot('suggestion-list-author');
    expect(await contract(admin.token, 'get', '/suggestions'))
      .toMatchSnapshot('suggestion-list-admin');
  });

  it('GET /api/suggestions/:id — detail envelope', async () => {
    const detail = await call(admin.token, 'get', `/suggestions/${suggestionId}`);
    expect(keys(detail.body)).toEqual([
      'attachments', 'comments', 'history', 'statuses', 'suggestion',
    ]);
    expect(keys(detail.body.suggestion)).toEqual([
      // allowed_statuses: the workflow steps this viewer may apply, so every
      // surface offers exactly what the server will accept.
      'allowed_statuses',
      'assigned_department_id', 'assigned_department_name', 'assigned_to',
      'assignee_name', 'created_at', 'department_id', 'department_name',
      'expected_benefit', 'id', 'problem', 'proposed_solution', 'status_id',
      'status_name', 'suggestion_number', 'title', 'updated_at', 'user_email',
      'user_id', 'user_name',
    ]);
    expect(normalize(detail.body)).toMatchSnapshot('suggestion-detail');
  });

  it('comment and update envelopes', async () => {
    expect(await contract(staff.token, 'post', `/suggestions/${suggestionId}/comments`, { comment: 'good idea' }))
      .toMatchSnapshot('suggestion-comment');
    expect(await contract(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: 999999 }))
      .toMatchSnapshot('suggestion-update-bad-status');
  });
});

describe('Contract: notifications', () => {
  it('list, unread-count and read envelopes', async () => {
    const staff = await loginAs('staff');
    await db('notifications').insert({ user_id: staff.user.id, title: 'contract probe', message: 'm' });

    expect(await contract(staff.token, 'get', '/notifications'))
      .toMatchSnapshot('notification-list');
    expect(await contract(staff.token, 'get', '/notifications/unread-count'))
      .toMatchSnapshot('notification-unread-count');
    expect(await contract(staff.token, 'put', '/notifications/read-all'))
      .toMatchSnapshot('notification-read-all');

    const row = await db('notifications').where({ user_id: staff.user.id, is_read: true })
      .orderBy('id', 'desc').first();
    expect(await contract(staff.token, 'put', `/notifications/${row.id}/read`))
      .toMatchSnapshot('notification-mark-read');
    expect(await contract(staff.token, 'put', '/notifications/999999/read'))
      .toMatchSnapshot('notification-mark-read-missing');
  });
});

describe('Contract: dashboard', () => {
  it('dashboard returns the same envelope for every role', async () => {
    const roles = ['staff', 'it_staff', 'it_supervisor', 'maintenance_supervisor', 'admin', 'sys_admin'];
    let reference = null;

    for (const role of roles) {
      const session = await loginAs(role);
      const res = await call(session.token, 'get', '/dashboard');
      expect(res.status, role).toBe(200);

      const current = keys(res.body);
      if (reference === null) reference = current;
      // Role-specific lists are emptied for roles that do not get them, but the
      // envelope must not change.
      expect(current, role).toEqual(reference);
      expect(normalize({ range: res.body.range, keys: current }))
        .toMatchSnapshot(`dashboard-envelope-${role}`);
    }
  });

  it('the reporting window is echoed back, including a swapped custom range', async () => {
    const sysAdmin = await loginAs('sys_admin');
    for (const [query, name] of [
      ['?period=today', 'dashboard-range-today'],
      ['?period=week', 'dashboard-range-week'],
      ['?period=month', 'dashboard-range-month'],
      ['?from=2024-06-01&to=2024-01-01', 'dashboard-range-swapped'],
    ]) {
      const res = await call(sysAdmin.token, 'get', `/dashboard${query}`);
      expect(res.status, query).toBe(200);
      expect(normalize(res.body.range)).toMatchSnapshot(name);
    }
  });

  it('the top-level numeric totals are all numbers', async () => {
    const sysAdmin = await loginAs('sys_admin');
    const res = await call(sysAdmin.token, 'get', '/dashboard');
    const numeric = [
      'totalTickets', 'openTickets', 'inProgressTickets', 'resolvedTickets',
      'closedTickets', 'criticalTickets', 'itCount', 'mCount', 'sCount',
      'itCritical', 'itOverdue', 'mCritical', 'mOverdue', 'overdueCount',
      'avgResolutionTimeDays',
    ];
    for (const key of numeric) {
      expect(typeof res.body[key], key).toBe('number');
    }
    // Breakdown objects always carry every status name for their workflow,
    // defaulting to 0 — the dashboard must not drop keys for empty states.
    expect(Object.keys(res.body.itStatusCounts)).toEqual([
      'New', 'Assigned', 'In Progress', 'Waiting for Information', 'Resolved', 'Closed',
    ]);
    expect(Object.keys(res.body.mStatusCounts)).toEqual([
      'New', 'Assigned', 'Inspection', 'In Progress', 'Waiting for Parts', 'Completed', 'Closed',
    ]);
  });
});

describe('Contract: multimedia', () => {
  let sysAdmin;

  beforeAll(async () => {
    sysAdmin = await loginAs('sys_admin');
  });

  it('GET /api/multimedia/capabilities is a static UI manifest', async () => {
    expect(await contract(sysAdmin.token, 'get', '/multimedia/capabilities'))
      .toMatchSnapshot('multimedia-capabilities');
  });

  it('GET /api/multimedia/dashboard envelope', async () => {
    const res = await call(sysAdmin.token, 'get', '/multimedia/dashboard');
    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(['integration', 'needs_attention', 'recent_activity', 'totals']);
    expect(keys(res.body.totals).sort()).toEqual([
      'groups', 'history_today', 'locations', 'media', 'offline', 'online',
      'playing', 'schedules', 'total',
    ]);
    expect(normalize({ totals: res.body.totals, integration: res.body.integration }))
      .toMatchSnapshot('multimedia-dashboard');
  });

  it('GET /api/multimedia/device, group, location and media list envelopes', async () => {
    const endpoints = {
      devices: '/multimedia/devices',
      groups: '/multimedia/groups',
      locations: '/multimedia/locations',
      media: '/multimedia/media',
      mediaCategories: '/multimedia/media/categories',
      history: '/multimedia/history',
      commands: '/multimedia/commands',
      audit: '/multimedia/audit',
      schedules: '/multimedia/schedules',
      settings: '/multimedia/settings',
    };
    for (const [name, url] of Object.entries(endpoints)) {
      const res = await call(sysAdmin.token, 'get', url);
      expect(res.status, url).toBe(200);
      expect(normalize({ status: res.status, shape: shape(res.body) }))
        .toMatchSnapshot(`multimedia-${name}-shape`);
    }
  });

  it('device rows never expose the device secret, only its hash', async () => {
    const res = await call(sysAdmin.token, 'get', '/multimedia/devices');
    expect(keys(res.body[0])).toContain('device_secret_hash');
    expect(keys(res.body[0])).not.toContain('device_secret');
    expect(normalize(res.body[0])).toMatchSnapshot('multimedia-device-row');
  });

  it('media and history are paginated envelopes, groups and locations are bare arrays', async () => {
    const paginated = ['/multimedia/media', '/multimedia/history'];
    const bare = ['/multimedia/groups', '/multimedia/locations', '/multimedia/commands', '/multimedia/schedules'];

    for (const url of paginated) {
      const res = await call(sysAdmin.token, 'get', url);
      expect(keys(res.body), url).toEqual(['items', 'limit', 'offset', 'total']);
      expect(typeof res.body.total).toBe('number');
    }
    for (const url of bare) {
      const res = await call(sysAdmin.token, 'get', url);
      expect(Array.isArray(res.body), url).toBe(true);
    }
  });
});

describe('Contract: multipart and upload rules', () => {
  let staff; let r; let ticketId;

  beforeAll(async () => {
    staff = await loginAs('staff');
    r = await refs();
    ticketId = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Upload contract probe',
    })).body.id;
  });

  it('rejects disallowed extensions with a stable message', async () => {
    const cases = [
      // executable by extension
      ['evil.exe', 'application/octet-stream', 'upload-rejected-exe'],
      // SVG can carry script and is therefore never accepted
      ['payload.svg', 'image/svg+xml', 'upload-rejected-svg'],
      // benign extension, executable content type (spoofed part header)
      ['notes.rtf', 'application/x-bat', 'upload-rejected-mime'],
    ];
    for (const [filename, contentType, name] of cases) {
      const res = await attach(staff.token, `/tickets/${ticketId}/attachments`, Buffer.from('x'), filename, contentType);
      expect(res.status, filename).toBe(400);
      expect(normalize(res.body)).toMatchSnapshot(name);
    }
  });

  it('a rejected category during ticket creation leaves no attachment row and no file', async () => {
    const res = await request.post('/api/tickets')
      .set('Authorization', `Bearer ${staff.token}`)
      .field('type', 'it')
      .field('category_id', String(r.mCat.id))
      .field('title', 'Mismatched category upload probe')
      .attach('attachments', Buffer.from('x'), { filename: 'orphan.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Category must belong to the selected ticket type');
    expect((await db('ticket_attachments').where('file_name', 'orphan.txt')).length).toBe(0);
  });

  it('an oversized or empty upload is rejected without a row', async () => {
    const empty = await attach(staff.token, `/tickets/${ticketId}/attachments`, Buffer.from(''), 'empty.txt', 'text/plain');
    // An empty buffer is still a file, so this is a normal upload.
    expect(empty.status).toBe(201);

    const noFiles = await request.post(`/api/tickets/${ticketId}/attachments`)
      .set('Authorization', `Bearer ${staff.token}`);
    expect(noFiles.status).toBe(400);
    expect(noFiles.body).toEqual({ message: 'No files uploaded' });
  });
});

function keys(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value).sort()
    : [];
}
