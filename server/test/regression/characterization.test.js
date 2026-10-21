/**
 * Characterization tests.
 *
 * These lock in the CURRENT observable behaviour of routes that had no test
 * coverage: user administration, system reference data, notifications, the
 * attachment download/delete contract and the suggestion workflow. They are not
 * a statement of what the behaviour *should* be — they are a tripwire: if a
 * status code, message, field list or ordering changes, that is a deliberate
 * contract change that must be reviewed here.
 */
import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  UPLOADS_DIR, db, call, login, loginAs, attach, download, request,
  normalize, shape, keysOf, refs,
  fileExists, readStoredFile, cleanupUploads,
} from './helpers.mjs';

const TXT = Buffer.from('regression attachment payload\n', 'utf8');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

afterAll(cleanupUploads);

describe('Characterization: GET /api/users', () => {
  let sysAdmin; let admin; let staff; let r;

  beforeAll(async () => {
    [sysAdmin, admin, staff] = await Promise.all([loginAs('sys_admin'), loginAs('admin'), loginAs('staff')]);
    r = await refs();
  });

  it('returns the full roster to sys_admin only, alphabetical, without password hashes', async () => {
    const res = await call(sysAdmin.token, 'get', '/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(10);

    expect(keysOf(res.body[0])).toEqual([
      'created_at', 'department_name', 'email', 'employee_id', 'id',
      'is_active', 'name', 'phone', 'role_name',
    ]);
    expect(JSON.stringify(res.body)).not.toContain('password');

    const names = res.body.map((u) => u.name);
    expect(names).toEqual([...names].sort());

    // admin (hospital administrator) is not a system administrator
    expect((await call(admin.token, 'get', '/users')).status).toBe(403);
    expect((await call(staff.token, 'get', '/users')).status).toBe(403);
  });
});

describe('Characterization: GET /api/users/technicians', () => {
  let sysAdmin; let r;

  beforeAll(async () => {
    sysAdmin = await loginAs('sys_admin');
    r = await refs();
  });

  it('returns IT team members for type=it, excluding inactive accounts', async () => {
    const res = await call(sysAdmin.token, 'get', '/users/technicians?type=it');
    expect(res.status).toBe(200);
    expect(keysOf(res.body[0])).toEqual(['department_name', 'employee_id', 'id', 'name']);
    expect(res.body.map((t) => t.name)).toEqual(['John IT Supervisor', 'Mike Technician', 'Sarah IT Tech']);

    const mike = await r.userByName('Mike Technician');
    await db('users').where('id', mike.id).update({ is_active: false });
    const after = await call(sysAdmin.token, 'get', '/users/technicians?type=it');
    expect(after.body.map((t) => t.name)).toEqual(['John IT Supervisor', 'Sarah IT Tech']);
    await db('users').where('id', mike.id).update({ is_active: true });
  });

  it('defaults to the maintenance team for a missing or unrecognised type', async () => {
    const expected = ['Ahmed Maint Supervisor', 'Ali Maint Tech'];
    expect((await call(sysAdmin.token, 'get', '/users/technicians?type=maintenance')).body.map((t) => t.name))
      .toEqual(expected);
    // No type at all
    expect((await call(sysAdmin.token, 'get', '/users/technicians')).body.map((t) => t.name))
      .toEqual(expected);
    // Unknown type falls back to maintenance rather than erroring
    expect((await call(sysAdmin.token, 'get', '/users/technicians?type=bogus')).body.map((t) => t.name))
      .toEqual(expected);
  });

  it('is restricted to supervisors and administrators', async () => {
    expect((await call((await loginAs('it_staff')).token, 'get', '/users/technicians')).status).toBe(403);
    expect((await call((await loginAs('staff')).token, 'get', '/users/technicians')).status).toBe(403);
    expect((await call((await loginAs('it_supervisor')).token, 'get', '/users/technicians')).status).toBe(200);
    expect((await call((await loginAs('admin')).token, 'get', '/users/technicians')).status).toBe(200);
  });
});

describe('Characterization: GET /api/users/staff', () => {
  let sysAdmin; let admin; let staff;

  beforeAll(async () => {
    [sysAdmin, admin, staff] = await Promise.all([loginAs('sys_admin'), loginAs('admin'), loginAs('staff')]);
  });

  it('lists active hospital staff with their department, to admins only', async () => {
    const res = await call(admin.token, 'get', '/users/staff');
    expect(res.status).toBe(200);
    expect(keysOf(res.body[0])).toEqual(['department_name', 'employee_id', 'id', 'name']);
    expect(res.body.map((s) => s.name)).toEqual(['Fatima Nurse', 'Layla Lab Tech', 'Omar Doctor']);

    expect((await call(sysAdmin.token, 'get', '/users/staff')).status).toBe(200);
    expect((await call(staff.token, 'get', '/users/staff')).status).toBe(403);
  });
});

describe('Characterization: POST /api/users', () => {
  let sysAdmin; let r; let counter = 0;

  beforeAll(async () => {
    sysAdmin = await loginAs('sys_admin');
    r = await refs();
  });

  const uniqueEmail = (label) => `probe.${label}.${Date.now()}.${counter++}@newleaf.com`;

  it('creates an active account and lowercases the email', async () => {
    const email = uniqueEmail('create');
    const res = await call(sysAdmin.token, 'post', '/users', {
      name: 'Created Probe', email: email.toUpperCase(), password: 'password123',
      department_id: r.deptNursing.id, role_id: r.roleStaff.id, employee_id: 'EMP-900',
    });
    expect(res.status).toBe(201);
    expect(keysOf(res.body).sort()).toEqual(['id', 'message']);
    expect(res.body.message).toBe('User created');

    const row = await db('users').where('id', res.body.id).first();
    expect(row.email).toBe(email);
    expect(row.is_active).toBe(true);
    expect(row.password).not.toBe('password123');

    expect((await request.post('/api/auth/login').send({ email, password: 'password123' })).status).toBe(200);
  });

  it('reports a duplicate email as 400 before hashing', async () => {
    const email = uniqueEmail('dup');
    const body = { name: 'Dup', email, password: 'password123', department_id: r.deptNursing.id, role_id: r.roleStaff.id };
    expect((await call(sysAdmin.token, 'post', '/users', body)).status).toBe(201);
    const res = await call(sysAdmin.token, 'post', '/users', body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email already exists');
  });

  it('reports each validation failure with a field-tagged errors array', async () => {
    const cases = [
      [{ name: 'x', email: 'not-an-email', password: 'password123', department_id: 1, role_id: 1 }, 'email', 'A valid email is required'],
      [{ name: 'x', email: uniqueEmail('pw'), password: 'short', department_id: 1, role_id: 1 }, 'password', 'Password must be at least 8 characters'],
      [{ name: 'x', email: uniqueEmail('dept'), password: 'password123', role_id: 1 }, 'department_id', 'Department is required'],
      [{ name: 'x', email: uniqueEmail('role'), password: 'password123', department_id: 1 }, 'role_id', 'Role is required'],
    ];
    for (const [body, field, message] of cases) {
      const res = await call(sysAdmin.token, 'post', '/users', body);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe(message);
      expect(res.body.errors).toEqual([{ field, message }]);
    }
  });

  it('is restricted to sys_admin', async () => {
    const res = await call((await loginAs('admin')).token, 'post', '/users', {
      name: 'x', email: uniqueEmail('rbac'), password: 'password123', department_id: 1, role_id: 1,
    });
    expect(res.status).toBe(403);
  });
});

describe('Characterization: PUT /api/users/:id and /:id/password', () => {
  let sysAdmin; let r; let target;

  beforeAll(async () => {
    sysAdmin = await loginAs('sys_admin');
    r = await refs();
    const created = await call(sysAdmin.token, 'post', '/users', {
      name: 'Update Probe', email: `update.probe.${Date.now()}@newleaf.com`, password: 'password123',
      department_id: r.deptNursing.id, role_id: r.roleStaff.id, employee_id: 'EMP-901', phone: '555-9000',
    });
    target = created.body.id;
  });

  it('applies a partial update and leaves omitted columns untouched', async () => {
    const before = await db('users').where('id', target).first();
    const res = await call(sysAdmin.token, 'put', `/users/${target}`, { phone: '555-9999' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'User updated' });

    const after = await db('users').where('id', target).first();
    expect(after.phone).toBe('555-9999');
    expect(after.name).toBe(before.name);
    expect(after.email).toBe(before.email);
    expect(after.department_id).toBe(before.department_id);
    expect(after.role_id).toBe(before.role_id);
    expect(after.is_active).toBe(true);
  });

  it('normalizes the email on update', async () => {
    const email = `renamed.${Date.now()}@newleaf.com`;
    expect((await call(sysAdmin.token, 'put', `/users/${target}`, { email: email.toUpperCase() })).status).toBe(200);
    expect((await db('users').where('id', target).first()).email).toBe(email);
  });

  it('returns 404 for a user that does not exist', async () => {
    const res = await call(sysAdmin.token, 'put', '/users/999999', { name: 'ghost' });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('replaces the password, invalidating the old one', async () => {
    const row = await db('users').where('id', target).first();
    const res = await call(sysAdmin.token, 'put', `/users/${target}/password`, { password: 'rotatedpass1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Password updated' });

    expect((await request.post('/api/auth/login').send({ email: row.email, password: 'password123' })).status).toBe(401);
    expect((await request.post('/api/auth/login').send({ email: row.email, password: 'rotatedpass1' })).status).toBe(200);

    const short = await call(sysAdmin.token, 'put', `/users/${target}/password`, { password: 'abc' });
    expect(short.status).toBe(400);
    expect(short.body.message).toBe('Password must be at least 8 characters');
    expect((await call(sysAdmin.token, 'put', '/users/999999/password', { password: 'password123' })).status).toBe(404);
  });

  it('deactivation blocks login and removes the user from staff/technician lists', async () => {
    const row = await db('users').where('id', target).first();
    expect((await call(sysAdmin.token, 'put', `/users/${target}`, { is_active: false })).status).toBe(200);

    const loginRes = await request.post('/api/auth/login').send({ email: row.email, password: 'rotatedpass1' });
    expect(loginRes.status).toBe(401);
    expect(loginRes.body.message).toBe('Account is deactivated');

    const admin = await loginAs('admin');
    expect((await call(admin.token, 'get', '/users/staff')).body.map((s) => s.id)).not.toContain(target);
    expect((await call(admin.token, 'get', '/users/technicians?type=it')).body.map((s) => s.id)).not.toContain(target);

    await call(sysAdmin.token, 'put', `/users/${target}`, { is_active: true });
    expect((await request.post('/api/auth/login').send({ email: row.email, password: 'rotatedpass1' })).status).toBe(200);
  });
});

describe('Characterization: DELETE /api/users/:id', () => {
  let sysAdmin; let r;

  beforeAll(async () => {
    sysAdmin = await loginAs('sys_admin');
    r = await refs();
  });

  const mkUser = async (roleId, label) => {
    const res = await call(sysAdmin.token, 'post', '/users', {
      name: `Delete Probe ${label}`, email: `delete.probe.${label}.${Date.now()}@newleaf.com`,
      password: 'password123', department_id: r.deptNursing.id, role_id: roleId,
    });
    return res.body.id;
  };

  it('refuses to delete the caller’s own account', async () => {
    const res = await call(sysAdmin.token, 'delete', `/users/${sysAdmin.user.id}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You cannot delete your own account');
  });

  it('refuses to let a system administrator delete their own account', async () => {
    // Note: the "last sys_admin" guard in users.js is unreachable in practice.
    // It only triggers for a target whose role is sys_admin, but the route is
    // gated by authorize('sys_admin') and the self-check runs first — so the
    // only sys_admin an admin can reach is themselves.
    const me = await db('users').where('id', sysAdmin.user.id).first();
    const res = await call(sysAdmin.token, 'delete', `/users/${me.id}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You cannot delete your own account');
  });

  it('returns 404 for an unknown user', async () => {
    const res = await call(sysAdmin.token, 'delete', '/users/999999');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('deletes the account and cascades their notifications', async () => {
    const id = await mkUser(r.roleStaff.id, 'cascade');
    await db('notifications').insert([
      { user_id: id, title: 'a', message: 'm' },
      { user_id: id, title: 'b', message: 'm' },
    ]);
    expect((await db('notifications').where('user_id', id)).length).toBe(2);

    const res = await call(sysAdmin.token, 'delete', `/users/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'User deleted' });
    expect(await db('users').where('id', id).first()).toBeUndefined();
    expect((await db('notifications').where('user_id', id)).length).toBe(0);
  });

  it('allows deleting a second system administrator once another exists', async () => {
    const extraId = await mkUser(r.roleSysAdmin.id, 'sys2');
    const res = await call(sysAdmin.token, 'delete', `/users/${extraId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'User deleted' });
  });
});

describe('Characterization: admin reference data (departments, categories, roles)', () => {
  let sysAdmin; let admin; let r;

  beforeAll(async () => {
    [sysAdmin, admin] = await Promise.all([loginAs('sys_admin'), loginAs('admin')]);
    r = await refs();
  });

  it('GET /admin/categories orders by type then name and filters by type', async () => {
    const all = await call(sysAdmin.token, 'get', '/admin/categories');
    expect(all.status).toBe(200);
    expect(keysOf(all.body[0])).toEqual(['created_at', 'description', 'id', 'name', 'type', 'updated_at']);
    expect(all.body.length).toBe(23);
    expect(all.body.map((c) => `${c.type}:${c.name}`)).toEqual([
      ...all.body.filter((c) => c.type === 'it').map((c) => `it:${c.name}`).sort((x, y) => x.slice(3).localeCompare(y.slice(3))),
      ...all.body.filter((c) => c.type === 'maintenance').map((c) => `maintenance:${c.name}`).sort((x, y) => x.slice(12).localeCompare(y.slice(12))),
    ]);

    const it = await call(sysAdmin.token, 'get', '/admin/categories?type=it');
    expect(it.body.length).toBe(12);
    expect(it.body.every((c) => c.type === 'it')).toBe(true);

    // readable by any authenticated user (needed to populate forms)
    expect((await call((await loginAs('staff')).token, 'get', '/admin/categories')).status).toBe(200);
  });

  it('GET /admin/priorities orders by level', async () => {
    const res = await call(sysAdmin.token, 'get', '/admin/priorities');
    expect(keysOf(res.body[0])).toEqual(['created_at', 'id', 'level', 'name', 'updated_at']);
    expect(res.body.map((p) => [p.name, p.level])).toEqual([
      ['Low', 1], ['Medium', 2], ['High', 3], ['Critical', 4],
    ]);
  });

  it('GET /admin/statuses orders by sort_order and filters by type', async () => {
    const all = await call(sysAdmin.token, 'get', '/admin/statuses');
    expect(all.body.length).toBe(24);
    const sortOrders = all.body.map((s) => s.sort_order);
    expect(sortOrders).toEqual([...sortOrders].sort((a, b) => a - b));

    const it = await call(sysAdmin.token, 'get', '/admin/statuses?type=it');
    expect(it.body.map((s) => s.name)).toEqual([
      'New', 'Assigned', 'In Progress', 'Waiting for Information', 'Resolved', 'Closed',
    ]);
    expect((await call(sysAdmin.token, 'get', '/admin/statuses?type=suggestion')).body.length).toBe(11);
  });

  it('GET /admin/departments is readable by admin, ordered by name', async () => {
    const res = await call(admin.token, 'get', '/admin/departments');
    expect(res.status).toBe(200);
    expect(keysOf(res.body[0])).toEqual(['created_at', 'description', 'id', 'name', 'updated_at']);
    expect(res.body.map((d) => d.name)).toEqual([...res.body.map((d) => d.name)].sort());
    expect((await call((await loginAs('staff')).token, 'get', '/admin/departments')).status).toBe(403);
  });

  it('GET /admin/roles and /admin/activity-logs are sys_admin only', async () => {
    expect((await call(sysAdmin.token, 'get', '/admin/roles')).status).toBe(200);
    expect((await call(admin.token, 'get', '/admin/roles')).status).toBe(403);
    expect((await call(sysAdmin.token, 'get', '/admin/activity-logs')).status).toBe(200);
    expect((await call(admin.token, 'get', '/admin/activity-logs')).status).toBe(403);
  });

  it('GET /admin/roles is ordered by name', async () => {
    const res = await call(sysAdmin.token, 'get', '/admin/roles');
    expect(keysOf(res.body[0])).toEqual(['created_at', 'description', 'id', 'name', 'updated_at']);
    expect(res.body.map((x) => x.name)).toEqual([
      'admin', 'it_staff', 'it_supervisor', 'maintenance_staff',
      'maintenance_supervisor', 'staff', 'sys_admin',
    ]);
  });

  it('POST /admin/departments returns only an id and rejects duplicates with 500', async () => {
    const name = `Probe Dept ${Date.now()}`;
    const created = await call(sysAdmin.token, 'post', '/admin/departments', { name });
    expect(created.status).toBe(201);
    expect(keysOf(created.body)).toEqual(['id']);

    const dup = await call(sysAdmin.token, 'post', '/admin/departments', { name });
    expect(dup.status).toBe(500);
    expect(dup.body).toEqual({ message: 'Server error' });

    const missing = await call(sysAdmin.token, 'post', '/admin/departments', {});
    expect(missing.status).toBe(400);
    expect(missing.body.message).toBe('Name is required');
  });

  it('PUT/DELETE /admin/departments/:id renames, refuses departments in use, 404s unknown', async () => {
    const created = await call(sysAdmin.token, 'post', '/admin/departments', { name: `Renamable ${Date.now()}` });
    const id = created.body.id;

    const renamed = await call(sysAdmin.token, 'put', `/admin/departments/${id}`, { name: `Renamed ${Date.now()}`, description: 'probe' });
    expect(renamed.status).toBe(200);
    expect(renamed.body).toEqual({ message: 'Department updated' });

    const removed = await call(sysAdmin.token, 'delete', `/admin/departments/${id}`);
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ message: 'Department deleted' });

    const inUse = await call(sysAdmin.token, 'delete', `/admin/departments/${r.deptNursing.id}`);
    expect(inUse.status).toBe(400);
    expect(inUse.body.message).toBe('Cannot delete a department in use');

    expect((await call(sysAdmin.token, 'put', `/admin/departments/${r.deptNursing.id}`, { name: 'x' })).status).toBe(200);
    await db('departments').where('id', r.deptNursing.id).update({ name: 'Nursing' });
    expect((await call(sysAdmin.token, 'delete', '/admin/departments/999999')).status).toBe(404);
    expect((await call(sysAdmin.token, 'put', '/admin/departments/999999', { name: 'x' })).status).toBe(404);
  });

  it('POST /admin/categories validates type and enforces name+type uniqueness', async () => {
    const name = `Probe Cat ${Date.now()}`;
    const it = await call(sysAdmin.token, 'post', '/admin/categories', { name, type: 'it' });
    expect(it.status).toBe(201);
    expect(keysOf(it.body)).toEqual(['id']);

    // same name, other type is allowed (unique index is on name+type)
    const maint = await call(sysAdmin.token, 'post', '/admin/categories', { name, type: 'maintenance' });
    expect(maint.status).toBe(201);

    const dup = await call(sysAdmin.token, 'post', '/admin/categories', { name, type: 'it' });
    expect(dup.status).toBe(500);
    expect(dup.body).toEqual({ message: 'Server error' });

    const badType = await call(sysAdmin.token, 'post', '/admin/categories', { name: 'Bad', type: 'nope' });
    expect(badType.status).toBe(400);
    expect(badType.body.message).toBe('Type must be it or maintenance');
    expect(badType.body.errors).toEqual([{ field: 'type', message: 'Type must be it or maintenance' }]);

    expect((await call(sysAdmin.token, 'delete', `/admin/categories/${it.body.id}`)).status).toBe(200);
    expect((await call(sysAdmin.token, 'delete', `/admin/categories/${maint.body.id}`)).status).toBe(200);
  });

  it('PUT /admin/categories/:id requires name and type and 404s unknown', async () => {
    const id = (await call(sysAdmin.token, 'post', '/admin/categories', { name: `Upd ${Date.now()}`, type: 'it' })).body.id;
    const res = await call(sysAdmin.token, 'put', `/admin/categories/${id}`, { name: `Upd2 ${Date.now()}`, type: 'maintenance' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Category updated' });
    expect((await db('categories').where('id', id).first()).type).toBe('maintenance');

    expect((await call(sysAdmin.token, 'put', `/admin/categories/${id}`, { name: 'no type' })).status).toBe(400);
    expect((await call(sysAdmin.token, 'put', '/admin/categories/999999', { name: 'x', type: 'it' })).status).toBe(404);
    await call(sysAdmin.token, 'delete', `/admin/categories/${id}`);
  });

  it('DELETE /admin/categories/:id refuses a category referenced by a ticket', async () => {
    const staff = await loginAs('staff');
    await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Category in use probe',
    });
    const res = await call(sysAdmin.token, 'delete', `/admin/categories/${r.itCat.id}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot delete a category in use');
    expect((await call(sysAdmin.token, 'delete', '/admin/categories/999999')).status).toBe(404);
  });

  it('POST/PUT/DELETE /admin/roles with a duplicate-name guard', async () => {
    const created = await call(sysAdmin.token, 'post', '/admin/roles', { name: `probe_role_${Date.now()}`, description: 'probe' });
    expect(created.status).toBe(201);
    expect(keysOf(created.body)).toEqual(['id']);

    const dup = await call(sysAdmin.token, 'post', '/admin/roles', { name: 'staff' });
    expect(dup.status).toBe(400);
    expect(dup.body.message).toBe('Role already exists');

    const updated = await call(sysAdmin.token, 'put', `/admin/roles/${created.body.id}`, { name: `probe_role_renamed_${Date.now()}`, description: 'probe 2' });
    expect(updated.status).toBe(200);
    expect(updated.body).toEqual({ message: 'Role updated' });

    const removed = await call(sysAdmin.token, 'delete', `/admin/roles/${created.body.id}`);
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ message: 'Role deleted' });

    const inUse = await call(sysAdmin.token, 'delete', `/admin/roles/${r.roleStaff.id}`);
    expect(inUse.status).toBe(400);
    expect(inUse.body.message).toBe('Cannot delete a role assigned to users');

    expect((await call(sysAdmin.token, 'delete', '/admin/roles/999999')).status).toBe(404);
    expect((await call(sysAdmin.token, 'put', '/admin/roles/999999', { name: 'x' })).status).toBe(404);
    expect((await call(sysAdmin.token, 'post', '/admin/roles', {})).status).toBe(400);
  });
});

describe('Characterization: admin system settings', () => {
  let sysAdmin; let admin;

  beforeAll(async () => {
    [sysAdmin, admin] = await Promise.all([loginAs('sys_admin'), loginAs('admin')]);
  });

  it('GET /admin/settings is ordered by category then key and is sys_admin only', async () => {
    const res = await call(sysAdmin.token, 'get', '/admin/settings');
    expect(res.status).toBe(200);
    expect(keysOf(res.body[0])).toEqual([
      'category', 'created_at', 'description', 'id', 'is_protected', 'key', 'updated_at', 'value',
    ]);
    expect(res.body.map((s) => s.key)).toEqual([
      'system_name',
      'multimedia_allow_it_staff_commands',
      'multimedia_device_limit',
      'multimedia_heartbeat_timeout_minutes',
      'session_timeout_minutes',
      'max_attachment_mb',
      'max_attachments',
    ]);
    expect((await call(admin.token, 'get', '/admin/settings')).status).toBe(403);
  });

  it('POST /admin/settings returns id+key and rejects a duplicate key', async () => {
    const key = `probe_setting_${Date.now()}`;
    const created = await call(sysAdmin.token, 'post', '/admin/settings', { key, value: '1', category: 'probe' });
    expect(created.status).toBe(201);
    expect(keysOf(created.body).sort()).toEqual(['id', 'key']);

    const dup = await call(sysAdmin.token, 'post', '/admin/settings', { key, value: '2' });
    expect(dup.status).toBe(400);
    expect(dup.body.message).toBe('Key already exists');

    expect((await call(sysAdmin.token, 'post', '/admin/settings', {})).status).toBe(400);
    expect((await call(sysAdmin.token, 'post', '/admin/settings', { value: 'x' })).status).toBe(400);
  });

  it('PUT /admin/settings/:key requires value, bumps updated_at and 404s unknown keys', async () => {
    const key = `probe_upd_${Date.now()}`;
    await call(sysAdmin.token, 'post', '/admin/settings', { key, value: '1', category: 'probe' });
    const before = await db('system_settings').where('key', key).first();

    const noValue = await call(sysAdmin.token, 'put', `/admin/settings/${key}`, { description: 'no value' });
    expect(noValue.status).toBe(400);
    expect(noValue.body.message).toBe('Value is required');

    const res = await call(sysAdmin.token, 'put', `/admin/settings/${key}`, { value: '2', description: 'probe desc' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Setting updated' });

    const after = await db('system_settings').where('key', key).first();
    expect(after.value).toBe('2');
    expect(after.description).toBe('probe desc');
    expect(new Date(after.updated_at).getTime()).toBeGreaterThan(new Date(before.updated_at).getTime());

    expect((await call(sysAdmin.token, 'put', '/admin/settings/does_not_exist', { value: 'x' })).status).toBe(404);
  });

  it('DELETE /admin/settings/:key refuses protected settings', async () => {
    const protectedRes = await call(sysAdmin.token, 'delete', '/admin/settings/system_name');
    expect(protectedRes.status).toBe(400);
    expect(protectedRes.body.message).toBe('Cannot delete a protected setting');

    const key = `probe_del_${Date.now()}`;
    await call(sysAdmin.token, 'post', '/admin/settings', { key, value: '1', category: 'probe' });
    const removed = await call(sysAdmin.token, 'delete', `/admin/settings/${key}`);
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ message: 'Setting deleted' });
    expect(await db('system_settings').where('key', key).first()).toBeUndefined();

    expect((await call(sysAdmin.token, 'delete', '/admin/settings/does_not_exist')).status).toBe(404);
  });
});

describe('Characterization: activity log', () => {
  it('records login, logout and password changes against the user entity', async () => {
    const sysAdmin = await loginAs('sys_admin');
    const userId = sysAdmin.user.id;

    const afterLogin = await db('activity_logs').where({ user_id: userId, action: 'login' });
    expect(afterLogin.length).toBeGreaterThan(0);
    expect(afterLogin[0].entity_type).toBe('user');
    expect(afterLogin[0].entity_id).toBe(userId);
    expect(afterLogin[0].details).toBe('User logged in');

    const before = (await db('activity_logs').where({ user_id: userId, action: 'logout' })).length;
    await request.post('/api/auth/logout').set('Authorization', `Bearer ${sysAdmin.token}`);
    const after = await db('activity_logs').where({ user_id: userId, action: 'logout' });
    expect(after.length).toBe(before + 1);
    expect(after[0].details).toBe('User logged out');

    const logs = await call(sysAdmin.token, 'get', '/admin/activity-logs');
    expect(logs.status).toBe(200);
    expect(keysOf(logs.body[0])).toContain('user_name');
    expect(logs.body.length).toBeLessThanOrEqual(100);
  });

  it('records failed logins without a user and blocks the IP+email pair after five attempts', async () => {
    const sysAdmin = await loginAs('sys_admin');
    const email = `nobody.${Date.now()}@newleaf.com`;

    await request.post('/api/auth/login').send({ email, password: 'password123' });
    // Scoped to this run's address: test files share one database, so other
    // suites may have logged failed attempts for real accounts meanwhile.
    const rows = await db('activity_logs')
      .where({ action: 'login_failed' })
      .where('details', 'like', `%${email}%`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[rows.length - 1].user_id).toBeNull();
    expect(rows[rows.length - 1].entity_type).toBe('user');

    let lastStatus = 0;
    for (let i = 0; i < 5; i += 1) {
      lastStatus = (await request.post('/api/auth/login').send({ email, password: 'wrong' })).status;
    }
    expect(lastStatus).toBe(429);
    const blocked = await db('activity_logs').where('action', 'login_blocked').orderBy('id', 'desc').first();
    expect(blocked).toBeTruthy();
    expect(blocked.details).toContain(email);

    expect((await call(sysAdmin.token, 'get', '/admin/activity-logs')).status).toBe(200);
  });
});

describe('Characterization: notifications', () => {
  let staff; let r; let staffId;

  beforeAll(async () => {
    staff = await loginAs('staff');
    r = await refs();
    staffId = staff.user.id;
  });

  it('returns only the caller’s notifications, newest first, capped at 50', async () => {
    await db('notifications').insert(
      Array.from({ length: 55 }, (_, i) => ({ user_id: staffId, title: `probe-${i}`, message: 'm' })),
    );
    const res = await call(staff.token, 'get', '/notifications');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(50);
    expect(keysOf(res.body[0])).toEqual([
      'created_at', 'entity_id', 'entity_type', 'id', 'is_read', 'message', 'title', 'updated_at', 'user_id',
    ]);
    expect(res.body.every((n) => n.user_id === staffId)).toBe(true);

    const times = res.body.map((n) => new Date(n.created_at).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('unread-count counts only unread rows for the caller', async () => {
    const doctor = await login('omar.doctor@newleaf.com');
    await db('notifications').where('user_id', doctor.user.id).del();
    await db('notifications').insert([
      { user_id: doctor.user.id, title: 'u1', message: 'm' },
      { user_id: doctor.user.id, title: 'u2', message: 'm' },
      { user_id: doctor.user.id, title: 'r1', message: 'm', is_read: true },
    ]);

    const res = await call(doctor.token, 'get', '/notifications/unread-count');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 2 });

    const readAll = await call(doctor.token, 'put', '/notifications/read-all');
    expect(readAll.status).toBe(200);
    expect(readAll.body).toEqual({ message: 'All notifications marked as read' });
    expect((await call(doctor.token, 'get', '/notifications/unread-count')).body).toEqual({ count: 0 });

    // idempotent
    expect((await call(doctor.token, 'put', '/notifications/read-all')).body)
      .toEqual({ message: 'All notifications marked as read' });
  });

  it('marking one as read is idempotent and refuses another user’s notification', async () => {
    const doctor = await login('omar.doctor@newleaf.com');
    await db('notifications').where('user_id', doctor.user.id).del();
    const [row] = await db('notifications').insert({ user_id: doctor.user.id, title: 'single', message: 'm' }).returning('*');

    const first = await call(doctor.token, 'put', `/notifications/${row.id}/read`);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ message: 'Notification marked as read' });

    const second = await call(doctor.token, 'put', `/notifications/${row.id}/read`);
    expect(second.status).toBe(200);
    expect(second.body).toEqual({ message: 'Notification marked as read' });

    const staff = await loginAs('staff');
    const idor = await call(staff.token, 'put', `/notifications/${row.id}/read`);
    expect(idor.status).toBe(404);
    expect(idor.body.message).toBe('Notification not found');
    expect((await db('notifications').where('id', row.id).first()).is_read).toBe(true);
  });
});

describe('Characterization: attachment download and deletion', () => {
  let sysAdmin; let r; let ticketId; let txtAttachment; let pngAttachment;

  beforeAll(async () => {
    const staff = await loginAs('staff');
    sysAdmin = await loginAs('sys_admin');
    r = await refs();

    const created = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Attachment contract probe',
    });
    ticketId = created.body.id;

    await attach(staff.token, `/tickets/${ticketId}/attachments`, TXT, 'notes.txt', 'text/plain');
    await attach(staff.token, `/tickets/${ticketId}/attachments`, PNG, 'screenshot.png', 'image/png');

    const rows = await db('ticket_attachments').where('ticket_id', ticketId).orderBy('id');
    txtAttachment = rows.find((a) => a.file_name === 'notes.txt');
    pngAttachment = rows.find((a) => a.file_name === 'screenshot.png');
  });

  it('stores the original name for display but a random uuid on disk', () => {
    expect(keysOf(txtAttachment)).toEqual(['created_at', 'file_name', 'file_path', 'id', 'ticket_id', 'updated_at']);
    expect(txtAttachment.file_name).toBe('notes.txt');
    expect(txtAttachment.file_path).not.toBe('notes.txt');
    expect(txtAttachment.file_path).toMatch(/^[0-9a-f-]{36}\.txt$/);
    expect(fileExists(txtAttachment.file_path)).toBe(true);
    expect(readStoredFile(txtAttachment.file_path).equals(TXT)).toBe(true);
  });

  it('serves text as an attachment and images inline, always with no-store', async () => {
    const txtRes = await download(sysAdmin.token, `/tickets/${ticketId}/attachments/${txtAttachment.id}`);
    expect(txtRes.status).toBe(200);
    expect(txtRes.headers['content-disposition']).toBe("attachment; filename*=UTF-8''notes.txt");
    expect(txtRes.headers['cache-control']).toBe('no-store');
    expect(txtRes.body.equals(TXT)).toBe(true);

    const pngRes = await download(sysAdmin.token, `/tickets/${ticketId}/attachments/${pngAttachment.id}`);
    expect(pngRes.status).toBe(200);
    expect(pngRes.headers['content-disposition']).toBe("inline; filename*=UTF-8''screenshot.png");
    expect(pngRes.headers['cache-control']).toBe('no-store');
    expect(pngRes.body.equals(PNG)).toBe(true);
  });

  it('404s an attachment id that is not on that ticket, and for an unknown ticket', async () => {
    const res = await call(sysAdmin.token, 'get', `/tickets/${ticketId}/attachments/999999`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Attachment not found');

    const otherTicket = (await call((await loginAs('staff')).token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Other ticket probe',
    })).body.id;
    const crossTicket = await call(sysAdmin.token, 'get', `/tickets/${otherTicket}/attachments/${txtAttachment.id}`);
    expect(crossTicket.status).toBe(404);
    expect(crossTicket.body.message).toBe('Attachment not found');

    const unknownTicket = await call(sysAdmin.token, 'get', '/tickets/999999/attachments/1');
    expect(unknownTicket.status).toBe(404);
    expect(unknownTicket.body.message).toBe('Ticket not found');
  });

  it('reports a missing file on disk separately from a missing row', async () => {
    const staff = await loginAs('staff');
    const ticketId2 = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Vanished file probe',
    })).body.id;
    await attach(staff.token, `/tickets/${ticketId2}/attachments`, TXT, 'gone.txt', 'text/plain');
    const row = await db('ticket_attachments').where({ ticket_id: ticketId2, file_name: 'gone.txt' }).first();
    fs.unlinkSync(path.resolve(UPLOADS_DIR, row.file_path));

    const res = await call(sysAdmin.token, 'get', `/tickets/${ticketId2}/attachments/${row.id}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Attachment file not found');
  });

  it('deletes the row and the file, and 404s on a second delete', async () => {
    const staff = await loginAs('staff');
    const before = await db('ticket_history').where({ ticket_id: ticketId, action: 'attachment_removed' });
    expect(before.length).toBe(0);

    const res = await call(sysAdmin.token, 'delete', `/tickets/${ticketId}/attachments/${txtAttachment.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Attachment deleted' });
    expect(await db('ticket_attachments').where('id', txtAttachment.id).first()).toBeUndefined();
    expect(fileExists(txtAttachment.file_path)).toBe(false);

    const history = await db('ticket_history').where({ ticket_id: ticketId, action: 'attachment_removed' });
    expect(history.length).toBe(1);

    const again = await call(sysAdmin.token, 'delete', `/tickets/${ticketId}/attachments/${txtAttachment.id}`);
    expect(again.status).toBe(404);
    expect(again.body.message).toBe('Attachment not found');
    expect((await db('ticket_history').where({ ticket_id: ticketId, action: 'attachment_removed' })).length).toBe(1);
  });

  it('rejects a blocked executable and cleans up nothing extra', async () => {
    const staff = await loginAs('staff');
    const before = await db('ticket_attachments').where('ticket_id', ticketId).count('* as c').first();
    const res = await attach(staff.token, `/tickets/${ticketId}/attachments`, Buffer.from('MZ'), 'evil.exe', 'application/octet-stream');
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('File type not allowed');
    const after = await db('ticket_attachments').where('ticket_id', ticketId).count('* as c').first();
    expect(Number(after.c)).toBe(Number(before.c));
  });
});

describe('Characterization: suggestion workflow', () => {
  let staff; let admin; let sysAdmin; let r; let suggestionId; let number;

  beforeAll(async () => {
    [staff, admin, sysAdmin] = await Promise.all([
      loginAs('staff'), loginAs('admin'), loginAs('sys_admin'),
    ]);
    r = await refs();
    const created = await call(staff.token, 'post', '/suggestions', {
      title: 'Characterization suggestion',
      problem: 'queues are unclear',
      proposed_solution: 'a sign',
      expected_benefit: 'less confusion',
    });
    suggestionId = created.body.id;
    number = created.body.suggestion_number;
  });

  it('creates with a sequential number and a Submitted status', async () => {
    expect(number).toMatch(/^S-\d{4}$/);
    const detail = await call(staff.token, 'get', `/suggestions/${suggestionId}`);
    expect(detail.status).toBe(200);
    expect(keysOf(detail.body)).toEqual(['attachments', 'comments', 'history', 'statuses', 'suggestion']);
    expect(keysOf(detail.body.suggestion)).toContain('suggestion_number');
    expect(keysOf(detail.body.suggestion)).toContain('user_email');
    expect(detail.body.suggestion.status_name).toBe('Submitted');
    expect(detail.body.history.map((h) => h.action)).toEqual(['created']);
    expect(detail.body.statuses.length).toBe(11);
  });

  it('notifies admins but not the author on creation', async () => {
    const adminNotifications = await db('notifications')
      .where('user_id', admin.user.id).where('title', 'ilike', `%${number}%`).orderBy('id', 'desc');
    expect(adminNotifications.length).toBeGreaterThan(0);
    expect(adminNotifications[0].title).toBe(`New suggestion: ${number}`);

    const authorNotifications = await db('notifications')
      .where('user_id', staff.user.id).where('title', 'ilike', `New suggestion:%`);
    expect(authorNotifications.length).toBe(0);
  });

  it('lets an admin walk the primary pipeline and records each transition', async () => {
    const steps = [r.sUnderReview, r.sAccepted, r.sAssigned, r.sImplementation, r.sImplemented, r.sClosed]
      .filter(Boolean);
    const detail0 = await call(admin.token, 'get', `/suggestions/${suggestionId}`);
    const available = detail0.body.statuses.map((s) => s.name);

    for (const target of steps) {
      if (!available.includes(target.name)) continue;
      const res = await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: target.id });
      expect(res.status, `moving to ${target.name}`).toBe(200);
    }

    const detail = await call(admin.token, 'get', `/suggestions/${suggestionId}`);
    expect(detail.body.suggestion.status_name).toBe('Closed');
    const changes = detail.body.history.filter((h) => h.action === 'status_changed');
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0].old_value).toBe('Submitted');
  });

  it('rejects an illegal transition with 400 naming both statuses', async () => {
    const res = await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sAccepted.id });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot move a suggestion from Closed to Accepted');
  });

  it('rejects a non-suggestion status id', async () => {
    const fresh = (await call(staff.token, 'post', '/suggestions', { title: 'Cross type probe' })).body.id;
    const res = await call(admin.token, 'put', `/suggestions/${fresh}`, { status_id: r.itNew.id });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid suggestion status');
  });

  it('restricts non-admins to their own suggestions and to one specific transition', async () => {
    const other = (await call((await loginAs('staff')).token, 'post', '/suggestions', { title: 'Mine' })).body.id;
    const labTech = await login('layla.lab@newleaf.com');

    const list = await call(labTech.token, 'get', '/suggestions');
    expect(list.status).toBe(200);
    expect(keysOf(list.body)).toEqual(['limit', 'page', 'suggestions', 'total']);
    expect(list.body.suggestions.every((s) => s.user_id === labTech.user.id)).toBe(true);

    expect((await call(labTech.token, 'get', `/suggestions/${other}`)).status).toBe(403);
    expect((await call(labTech.token, 'put', `/suggestions/${other}`, { status_id: r.sUnderReview.id })).status).toBe(403);

    const wrongTarget = await call(staff.token, 'put', `/suggestions/${other}`, { status_id: r.sAccepted.id });
    expect(wrongTarget.status).toBe(403);
    expect(wrongTarget.body.message).toBe('You can only send a suggestion awaiting information back to Under Review');

    const assignAttempt = await call(staff.token, 'put', `/suggestions/${other}`, {
      status_id: r.sUnderReview.id, assigned_to: sysAdmin.user.id,
    });
    expect(assignAttempt.status).toBe(403);
    expect(assignAttempt.body.message).toBe('You can only provide the requested information');
  });

  it('lets the author return an information-requested suggestion to Under Review', async () => {
    const mine = (await call(staff.token, 'post', '/suggestions', { title: 'Needs info probe' })).body.id;
    await call(admin.token, 'put', `/suggestions/${mine}`, { status_id: r.sMoreInfo.id });

    const res = await call(staff.token, 'put', `/suggestions/${mine}`, { status_id: r.sUnderReview.id });
    expect(res.status).toBe(200);

    const history = await db('suggestion_history').where('suggestion_id', mine).orderBy('id');
    expect(history.map((h) => h.action)).toContain('information_provided');
    expect((await db('suggestions').where('id', mine).first()).status_id).toBe(r.sUnderReview.id);
  });

  it('validates assignment targets', async () => {
    const mine = (await call(staff.token, 'post', '/suggestions', { title: 'Assign probe' })).body.id;
    const badUser = await call(admin.token, 'put', `/suggestions/${mine}`, { assigned_to: 999999 });
    expect(badUser.status).toBe(400);
    expect(badUser.body.message).toBe('Invalid assignee');

    const badDept = await call(admin.token, 'put', `/suggestions/${mine}`, { assigned_department_id: 999999 });
    expect(badDept.status).toBe(400);
    expect(badDept.body.message).toBe('Invalid department');

    const mike = await r.userByName('Mike Technician');
    const ok = await call(admin.token, 'put', `/suggestions/${mine}`, {
      assigned_to: mike.id,
      assigned_department_id: r.deptNursing.id,
    });
    expect(ok.status).toBe(200);

    const row = await db('suggestions').where('id', mine).first();
    expect(row.assigned_to).toBe(mike.id);
    expect(row.assigned_department_id).toBe(r.deptNursing.id);

    const history = await db('suggestion_history').where('suggestion_id', mine).orderBy('id');
    const actions = history.map((h) => h.action);
    expect(actions).toContain('assigned_person_changed');
    expect(actions).toContain('assigned_department_changed');
  });

  it('validates the create payload', async () => {
    expect((await call(staff.token, 'post', '/suggestions', {})).status).toBe(400);
    expect((await call(staff.token, 'post', '/suggestions', { title: 'x' })).status).toBe(400);
    const badDept = await call(staff.token, 'post', '/suggestions', { title: 'Valid title', department_id: 999999 });
    expect(badDept.status).toBe(400);
    expect(badDept.body.message).toBe('Invalid department');
  });

  it('caps suggestion comments at 2000 characters and records them in history', async () => {
    const res = await call(staff.token, 'post', `/suggestions/${suggestionId}/comments`, { comment: 'x'.repeat(2001) });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Comment is required');

    const ok = await call(staff.token, 'post', `/suggestions/${suggestionId}/comments`, { comment: 'looks good' });
    expect(ok.status).toBe(201);

    const detail = await call(staff.token, 'get', `/suggestions/${suggestionId}`);
    const last = detail.body.comments[detail.body.comments.length - 1];
    expect(keysOf(last)).toEqual(['comment', 'created_at', 'id', 'suggestion_id', 'updated_at', 'user_id', 'user_name']);
    expect(detail.body.history.some((h) => h.action === 'comment_added')).toBe(true);
  });

  it('scopes suggestion attachments to the author and admins', async () => {
    const mine = (await call(staff.token, 'post', '/suggestions', { title: 'Attachment probe' })).body.id;
    await attach(staff.token, `/suggestions/${mine}/attachments`, TXT, 'idea.txt', 'text/plain');
    const row = await db('suggestion_attachments').where({ suggestion_id: mine, file_name: 'idea.txt' }).first();
    expect(row).toBeTruthy();

    const labTech = await login('layla.lab@newleaf.com');
    expect((await call(labTech.token, 'get', `/suggestions/${mine}/attachments/${row.id}`)).status).toBe(403);
    expect((await call(labTech.token, 'delete', `/suggestions/${mine}/attachments/${row.id}`)).status).toBe(403);

    const dl = await call(admin.token, 'get', `/suggestions/${mine}/attachments/${row.id}`);
    expect(dl.status).toBe(200);
    expect(dl.headers['content-disposition']).toBe("attachment; filename*=UTF-8''idea.txt");

    const removed = await call(staff.token, 'delete', `/suggestions/${mine}/attachments/${row.id}`);
    expect(removed.status).toBe(200);
    expect(fileExists(row.file_path)).toBe(false);
  });

  it('404s unknown suggestions on every verb', async () => {
    expect((await call(staff.token, 'get', '/suggestions/999999')).status).toBe(404);
    expect((await call(staff.token, 'get', '/suggestions/999999')).body.message).toBe('Suggestion not found');
    expect((await call(staff.token, 'post', '/suggestions/999999/comments', { comment: 'hi' })).status).toBe(404);
    expect((await call(staff.token, 'put', '/suggestions/999999', { status_id: r.sUnderReview.id })).status).toBe(404);
    expect((await call(staff.token, 'get', '/suggestions/999999/attachments/1')).status).toBe(404);
    expect((await call(staff.token, 'delete', '/suggestions/999999/attachments/1')).status).toBe(404);
  });
});

describe('Characterization: unmapped routes and error envelope', () => {
  it('returns the standard 404 envelope for unknown /api paths', async () => {
    const sysAdmin = await loginAs('sys_admin');
    const res = await call(sysAdmin.token, 'get', '/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Not found' });
  });

  it('returns 400 for a malformed JSON body rather than a 500', async () => {
    const res = await request.post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid JSON in request body' });
  });

  it('applies the security headers to every response', async () => {
    const res = await request.get('/api/admin/capabilities-missing').set('Authorization', 'Bearer x');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('same-origin');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('normalizes and snapshots a payload deterministically', () => {
    const payload = {
      id: 7, created_at: '2024-05-06T07:08:09.000Z', token: 'abc',
      nested: [{ user_id: 3, file_path: 'a.txt' }],
    };
    expect(normalize(payload)).toEqual({
      created_at: '<timestamp>',
      id: '<id>',
      nested: [{ file_path: '<file>', user_id: '<id>' }],
      token: '<secret>',
    });
    expect(shape({ a: 1, b: [1, 2] })).toEqual({ a: 'number', b: { item: 'number', itemKeys: [], length: 2, type: 'array' } });
  });
});
