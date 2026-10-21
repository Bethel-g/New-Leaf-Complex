import { describe, it, expect } from 'vitest';
import db from '../src/config/db.js';
import { request, login, loginAs, call } from './helpers.mjs';

const MAX_LOGIN_ATTEMPTS = 5;

async function refs() {
  const byName = async (table, name, type) => {
    const q = db(table).where('name', name);
    if (type) q.andWhere('type', type);
    return q.first();
  };
  return {
    itCat: await db('categories').where({ type: 'it' }).first(),
    mCat: await db('categories').where({ type: 'maintenance' }).first(),
    itNew: await byName('statuses', 'New', 'it'),
    itInProg: await byName('statuses', 'In Progress', 'it'),
    mInProg: await byName('statuses', 'In Progress', 'maintenance'),
    itStaffRole: await db('roles').where('name', 'it_staff').first(),
    itSupRole: await db('roles').where('name', 'it_supervisor').first(),
    maintStaffRole: await db('roles').where('name', 'maintenance_staff').first(),
    dep: await db('departments').first(),
  };
}

function attach(token, url, buffer, filename, contentType) {
  const path = url.startsWith('/api') ? url : `/api${url}`;
  return request.post(path)
    .set('Authorization', `Bearer ${token}`)
    .attach('files', buffer, { filename, contentType });
}

describe('Security hardening', () => {
  it('blocks cross-team assignment, cross-type status and deactivated assignees on PUT', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const supIT = await loginAs('it_supervisor');
    const ali = await loginAs('maintenance_staff');

    const t = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Sec team ticket', priority: 'High',
    });
    expect(t.status).toBe(201);
    const id = t.body.id;

    // Assigning to a member of the OTHER managing team is rejected.
    const crossTeam = await call(supIT.token, 'put', `/tickets/${id}`, { assigned_to: ali.user.id });
    expect(crossTeam.status).toBe(400);
    expect(crossTeam.body.message).toMatch(/managing team/);

    // A status from the other workflow type cannot be applied.
    const crossType = await call(supIT.token, 'put', `/tickets/${id}`, { status_id: r.mInProg.id });
    expect(crossType.status).toBe(400);
    expect(crossType.body.message).toMatch(/status for this ticket type/);

    // Valid assignment still works (regression guard on the new validation).
    const ok = await call(supIT.token, 'put', `/tickets/${id}`, { status_id: r.itInProg.id });
    expect(ok.status).toBe(200);

    // Assigning to a deactivated account is rejected.
    const [inactiveId] = await db('users').insert({
      name: 'Inactive Tech', email: 'inactive.sec@newleaf.com', password: 'x',
      employee_id: 'SEC-0', department_id: r.dep.id, role_id: r.itStaffRole.id, is_active: false,
    }).returning('id');
    const inactive = await call(supIT.token, 'put', `/tickets/${id}`, { assigned_to: inactiveId.id });
    expect(inactive.status).toBe(400);
    expect(inactive.body.message).toMatch(/active user/);
  });

  it('rejects a category that does not belong to the ticket type', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const res = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.mCat.id, title: 'Mismatched category',
    });
    expect(res.status).toBe(400);
  });

  it('scopes the suggestions list for non-admins', async () => {
    const staff = await loginAs('staff');
    const supIT = await loginAs('it_supervisor');
    const admin = await loginAs('admin');

    const other = await call(staff.token, 'post', '/suggestions', {
      title: 'Owned by staff', problem: 'private',
    });
    const mine = await call(supIT.token, 'post', '/suggestions', {
      title: 'Owned by supervisor', problem: 'also private-ish',
    });

    const list = (await call(supIT.token, 'get', '/suggestions')).body.suggestions;
    const ids = list.map((s) => s.id);
    expect(ids).toContain(mine.body.id);
    expect(ids).not.toContain(other.body.id);

    const adminList = (await call(admin.token, 'get', '/suggestions')).body.suggestions;
    expect(adminList.map((s) => s.id)).toContain(other.body.id);
  });

  it('prevents IDOR marking another user notifications as read', async () => {
    const staff = await loginAs('staff');
    const mike = await loginAs('it_staff');

    const [notifId] = await db('notifications').insert({
      user_id: mike.user.id, title: 'Private notices', message: 'addressed to Mike only',
    }).returning('id');

    const staffTries = await call(staff.token, 'put', `/notifications/${notifId.id}/read`);
    expect(staffTries.status).toBe(404);

    const ownList = (await call(staff.token, 'get', '/notifications')).body;
    const ownIds = (ownList.notifications || ownList).map((n) => (n.id ?? n));
    expect(ownIds).not.toContain(notifId.id);

    expect((await call(mike.token, 'put', `/notifications/${notifId.id}/read`)).status).toBe(200);
    const row = await db('notifications').where('id', notifId.id).first();
    expect(row.is_read).toBe(true);
  });

  it('authorizes before writing uploads and rejects executable/SVG/MIME-spoof files', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const doctor = await login('omar.doctor@newleaf.com');

    const t = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Upload hardening test', priority: 'Medium',
    });
    expect(t.status).toBe(201);
    const id = t.body.id;

    // A user who cannot view the ticket must be rejected (403) — and the check
    // runs BEFORE multer stores anything on disk.
    expect((await attach(doctor.token, `/tickets/${id}/attachments`, Buffer.from('x'), 'steal.pdf', 'application/pdf')).status).toBe(403);

    // Executable by extension.
    const exe = await attach(staff.token, `/tickets/${id}/attachments`, Buffer.from('MZ...'), 'tool.exe', 'application/octet-stream');
    expect(exe.status).toBe(400);

    // SVG carries script-capable markup and must be rejected.
    const svg = await attach(staff.token, `/tickets/${id}/attachments`, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'evil.svg', 'image/svg+xml');
    expect(svg.status).toBe(400);

    // Benign extension but executable content-type (spoofed part header).
    const spoof = await attach(staff.token, `/tickets/${id}/attachments`, Buffer.from('malware'), 'notes.txt', 'application/x-msdownload');
    expect(spoof.status).toBe(400);

    // A legitimate PNG is accepted.
    const png = await attach(staff.token, `/tickets/${id}/attachments`, Buffer.from('iVBORw0KGgoAAAANSUhEUg==', 'base64'), 'photo.png', 'image/png');
    expect(png.status).toBe(201);
  });

  it('never exposes credentials or requester contact fields in lists', async () => {
    const staff = await loginAs('staff');
    const r = await refs();
    await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Privacy check', priority: 'Low',
    });

    const tickets = (await call(staff.token, 'get', '/tickets')).body.tickets;
    for (const t of tickets) {
      expect(t).not.toHaveProperty('requester_email');
      expect(t).not.toHaveProperty('requester_phone');
      expect(JSON.stringify(t)).not.toMatch(/"password"/i);
    }

    const suggestions = (await call(staff.token, 'get', '/suggestions')).body.suggestions;
    for (const s of suggestions) {
      expect(s).not.toHaveProperty('user_email');
      expect(JSON.stringify(s)).not.toMatch(/"password"/i);
    }
  });

  it('is safe against SQL injection payloads and injected markup in input', async () => {
    const staff = await loginAs('staff');
    const r = await refs();
    await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: `'; DROP TABLE tickets;-- <b>hi</b>${Math.random()}`, priority: 'Medium',
    });

    // The payloads must never return other users' data or crash the API.
    const t1 = await call(staff.token, 'get', '/tickets?search=%27%20OR%201%3D1--');
    expect(t1.status).toBe(200);
    expect(t1.body.tickets.every((t) => t.requester_id === staff.user.id)).toBe(true);

    const t2 = await call(staff.token, 'get', '/tickets?search=DROP%20TABLE%20tickets%3B--');
    expect(t2.status).toBe(200);

    const s1 = await call(staff.token, 'get', `/suggestions?search=%27%20OR%20%271%27%3D%271`);
    expect(s1.status).toBe(200);
    expect(s1.body.suggestions.every((s) => s.user_id === staff.user.id)).toBe(true);

    // DB is still intact and serviceable.
    const after = await call(staff.token, 'get', '/tickets');
    expect(after.status).toBe(200);
    expect(after.body.tickets.length).toBeGreaterThan(0);
  });

  it('locks out repeated login failures for the same email', async () => {
    const email = 'brute.force.sec@newleaf.com';
    let last;
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
      last = await request.post('/api/auth/login').send({ email, password: 'wrong-password' });
      expect(last.status).toBe(401);
    }
    const locked = await request.post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(locked.status).toBe(429);
    expect(locked.body.message).toMatch(/attempts/i);
  });

  it('returns 404 when updating or reading records that do not exist', async () => {
    const sys = await loginAs('sys_admin');

    expect((await call(sys.token, 'put', '/users/999999', { name: 'Nobody' })).status).toBe(404);
    expect((await call(sys.token, 'put', '/users/999999/password', { password: 'password123' })).status).toBe(404);
    expect((await call(sys.token, 'put', '/admin/departments/999999', { name: 'X' })).status).toBe(404);
    expect((await call(sys.token, 'put', '/admin/categories/999999', { name: 'X', type: 'it' })).status).toBe(404);
    expect((await call(sys.token, 'put', '/admin/roles/999999', { name: 'x' })).status).toBe(404);
    expect((await call(sys.token, 'delete', '/admin/roles/999999')).status).toBe(404);
    expect((await call(sys.token, 'put', '/admin/settings/no.such.key', { value: 'v' })).status).toBe(404);

    const staff = await loginAs('staff');
    expect((await call(staff.token, 'put', '/tickets/999999', { status_id: 1 })).status).toBe(404);
    expect((await call(staff.token, 'put', '/notifications/999999/read')).status).toBe(404);
  });
});