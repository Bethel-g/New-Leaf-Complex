/**
 * Data-integrity invariants.
 *
 * Unlike the other two suites, these tests do not assert a specific response —
 * they assert properties that must hold in the *database* no matter how the API
 * is called. They cross-check what the API reports against what is actually
 * stored, and they look for rows that reference something that no longer exists
 * (orphans), files with no row, and history that does not match the entity it
 * describes.
 *
 * Anything here that fails is a real data bug, not a contract change.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  UPLOADS_DIR, db, call, login, loginAs, attach, request,
  refs, actors, fileExists, readStoredFile, storedFilePath, cleanupUploads,
} from './helpers.mjs';

const TXT = Buffer.from('invariant attachment\n', 'utf8');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

afterAll(cleanupUploads);

/** Count rows in a table whose foreign key column points at a missing row. */
async function orphans(table, column, parentTable) {
  const row = await db(table)
    .leftJoin(parentTable, `${table}.${column}`, `${parentTable}.id`)
    .whereNotNull(`${table}.${column}`)
    .whereNull(`${parentTable}.id`)
    .count({ n: '*' })
    .first();
  return Number(row.n);
}

/** Every attachment row must still have its file on disk, and vice versa. */
async function attachmentRowsWithMissingFile(table) {
  const rows = await db(table);
  return rows.filter((a) => !fileExists(a.file_path)).map((a) => a.file_path);
}

describe('Invariant: reference data', () => {
  let r;

  beforeAll(async () => {
    r = await refs();
  });

  it('every seeded reference set is present and non-empty', async () => {
    for (const [label, row] of Object.entries({
      itCategory: r.itCat, maintenanceCategory: r.mCat,
      itNew: r.itNew, itResolved: r.itResolved, itClosed: r.itClosed,
      maintenanceCompleted: r.mCompleted, maintenanceClosed: r.mClosed,
      suggestionSubmitted: r.sSubmitted, suggestionClosed: r.sClosed,
      lowPriority: r.prioLow, criticalPriority: r.prioCritical,
      nursingDepartment: r.deptNursing, staffRole: r.roleStaff,
    })) {
      expect(row, label).toBeTruthy();
    }
  });

  it('no reference table has duplicate names within a type', async () => {
    for (const table of ['categories', 'statuses']) {
      const rows = await db(table).select('name', 'type');
      const seen = new Set();
      for (const row of rows) {
        const key = `${row.type}:${row.name}`;
        expect(seen.has(key), `${table} duplicate ${key}`).toBe(false);
        seen.add(key);
      }
    }
    for (const table of ['roles', 'departments', 'priorities']) {
      const rows = await db(table).select('name');
      const names = rows.map((x) => x.name);
      expect(new Set(names).size, `${table} names`).toBe(names.length);
    }
  });

  it('priority levels are a contiguous 1..n ladder with unique levels', async () => {
    const rows = await db('priorities').orderBy('level');
    const levels = rows.map((p) => p.level);
    expect(levels).toEqual(levels.map((_, i) => i + 1));
  });

  it('every workflow status set is internally ordered by sort_order', async () => {
    for (const type of ['it', 'maintenance', 'suggestion']) {
      const rows = await db('statuses').where('type', type).orderBy('sort_order');
      expect(rows.length, type).toBeGreaterThan(0);
      const orders = rows.map((s) => s.sort_order);
      expect(orders, type).toEqual([...orders].sort((a, b) => a - b));
      expect(new Set(orders).size, `${type} sort_order uniqueness`).toBe(orders.length);
    }
  });

  it('every seeded category type matches a workflow that exists', async () => {
    const types = await db('categories').distinct('type');
    expect(types.map((t) => t.type).sort()).toEqual(['it', 'maintenance']);
  });
});

describe('Invariant: ticket numbering', () => {
  let staff; let r;

  beforeAll(async () => {
    staff = await loginAs('staff');
    r = await refs();
  });

  it('ticket numbers are unique, prefixed per type, and zero-padded to four digits', async () => {
    await call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Numbering it one' });
    await call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Numbering it two' });
    await call(staff.token, 'post', '/tickets', { type: 'maintenance', category_id: r.mCat.id, title: 'Numbering mt one' });

    const rows = await db('tickets').orderBy('id');
    for (const row of rows) {
      const prefix = row.type === 'it' ? 'IT' : 'MT';
      expect(row.ticket_number, row.ticket_number).toMatch(new RegExp(`^${prefix}-\\d{4}$`));
    }
    const numbers = rows.map((x) => x.ticket_number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('each type has its own independent sequence', async () => {
    const itNumbers = (await db('tickets').where('type', 'it').orderBy('id')).map((t) => t.ticket_number);
    const mtNumbers = (await db('tickets').where('type', 'maintenance').orderBy('id')).map((t) => t.ticket_number);

    expect(itNumbers.every((n) => n.startsWith('IT-'))).toBe(true);
    expect(mtNumbers.every((n) => n.startsWith('MT-'))).toBe(true);
    // IT and MT sequences both start at 0001 — they are independent counters.
    expect(itNumbers[0]).toBe('IT-0001');
    expect(mtNumbers[0]).toBe('MT-0001');
  });

  it('suggestion numbers use their own S- sequence, also from 0001', async () => {
    await call(staff.token, 'post', '/suggestions', { title: 'Numbering suggestion one' });
    await call(staff.token, 'post', '/suggestions', { title: 'Numbering suggestion two' });

    const rows = await db('suggestions').orderBy('id');
    expect(rows.map((s) => s.suggestion_number)).toEqual(['S-0001', 'S-0002']);
    expect(rows.every((s) => /^S-\d{4}$/.test(s.suggestion_number))).toBe(true);
  });
});

describe('Invariant: tickets carry a complete, valid set of references', () => {
  let staff; let r; let ticketId;

  beforeAll(async () => {
    staff = await loginAs('staff');
    r = await refs();
    ticketId = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Integrity probe ticket',
      description: 'body', priority: 'Critical',
    })).body.id;
  });

  it('a new ticket always resolves to a real status, priority, category and department', async () => {
    const ticket = await db('tickets').where('id', ticketId).first();
    expect(ticket.status_id).toBe(r.itNew.id);
    expect(ticket.priority_id).toBe(r.prioCritical.id);
    expect(ticket.category_id).toBe(r.itCat.id);
    expect(ticket.requester_id).toBe(staff.user.id);

    // The inner joins in the list/detail queries depend on this: a NULL in any
    // of these columns would make the row silently vanish from every listing.
    const visible = await db('tickets')
      .join('users as requester', 'tickets.requester_id', 'requester.id')
      .join('departments', 'tickets.department_id', 'departments.id')
      .join('categories', 'tickets.category_id', 'categories.id')
      .join('priorities', 'tickets.priority_id', 'priorities.id')
      .join('statuses', 'tickets.status_id', 'statuses.id')
      .where('tickets.id', ticketId)
      .first();
    expect(visible).toBeTruthy();
  });

  it('the ticket’s status always belongs to the ticket’s own workflow', async () => {
    const rows = await db('tickets')
      .join('statuses', 'tickets.status_id', 'statuses.id')
      .select('tickets.id', 'tickets.type', 'statuses.type as status_type');
    const mismatched = rows.filter((row) => row.type !== row.status_type);
    expect(mismatched).toEqual([]);
  });

  it('a category can only be used by a ticket of its own type', async () => {
    const rows = await db('tickets')
      .join('categories', 'tickets.category_id', 'categories.id')
      .select('tickets.id', 'tickets.type', 'categories.type as category_type');
    expect(rows.filter((row) => row.type !== row.category_type)).toEqual([]);
  });

  it('no ticket anywhere in the table has an orphaned foreign key', async () => {
    expect(await orphans('tickets', 'requester_id', 'users')).toBe(0);
    expect(await orphans('tickets', 'assigned_to', 'users')).toBe(0);
    expect(await orphans('tickets', 'department_id', 'departments')).toBe(0);
    expect(await orphans('tickets', 'category_id', 'categories')).toBe(0);
    expect(await orphans('tickets', 'priority_id', 'priorities')).toBe(0);
    expect(await orphans('tickets', 'status_id', 'statuses')).toBe(0);
  });
});

describe('Invariant: ticket history matches the ticket state', () => {
  let staff; let itSup; let sysAdmin; let r; let ticketId;

  beforeAll(async () => {
    [staff, itSup, sysAdmin] = await Promise.all([
      loginAs('staff'), loginAs('it_supervisor'), loginAs('sys_admin'),
    ]);
    r = await refs();
    const mike = await r.userByName('Mike Technician');

    ticketId = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'History invariant ticket', priority: 'High',
    })).body.id;

    await call(itSup.token, 'put', `/tickets/${ticketId}`, { assigned_to: mike.id });
    const itTech = await loginAs('it_staff');
    await call(itTech.token, 'put', `/tickets/${ticketId}`, { status_id: r.itInProg.id, resolution_note: '' });
    await call(itTech.token, 'put', `/tickets/${ticketId}`, {
      status_id: r.itResolved.id, resolution_note: 'replaced the faulty drive',
    });
  });

  it('the first history entry is always the creation event', async () => {
    const history = await db('ticket_history').where('ticket_id', ticketId).orderBy('id');
    expect(history[0].action).toBe('created');
    expect(history[0].old_value).toBeNull();
    expect(history[0].new_value).toContain('Ticket created with status New');
  });

  it('every status change is recorded with the correct old and new values', async () => {
    const history = await db('ticket_history').where('ticket_id', ticketId).orderBy('id');
    const changes = history.filter((h) => h.action === 'status_changed');

    // Assigning moved New -> Assigned, then the technician moved to In Progress
    // and finally to Resolved.
    expect(changes.map((c) => [c.old_value, c.new_value])).toEqual([
      ['New', 'Assigned'],
      ['Assigned', 'In Progress'],
      ['In Progress', 'Resolved'],
    ]);

    // The chain must be continuous: each old value is the previous new value.
    for (let i = 1; i < changes.length; i += 1) {
      expect(changes[i].old_value).toBe(changes[i - 1].new_value);
    }
  });

  it('the final recorded status equals the ticket’s stored status', async () => {
    const ticket = await db('tickets').where('id', ticketId).first();
    const history = await db('ticket_history').where('ticket_id', ticketId).orderBy('id');
    const last = [...history].reverse().find((h) => h.action === 'status_changed');
    expect(ticket.status_id).toBe(r.itResolved.id);
    expect(last.new_value).toBe('Resolved');
  });

  it('assignment is recorded, and the assignee matches the ticket', async () => {
    const history = await db('ticket_history').where({ ticket_id: ticketId, action: 'assigned' });
    expect(history.length).toBe(1);
    expect(history[0].old_value).toBeNull();
    expect(history[0].new_value).toBe('Mike Technician');

    const ticket = await db('tickets').where('id', ticketId).first();
    const mike = await r.userByName('Mike Technician');
    expect(ticket.assigned_to).toBe(mike.id);
  });

  it('resolving sets resolved_date and stores the resolution note exactly once', async () => {
    const ticket = await db('tickets').where('id', ticketId).first();
    expect(ticket.resolved_date).not.toBeNull();
    expect(ticket.resolution_notes).toBe('replaced the faulty drive');
    expect(ticket.closed_date).toBeNull();

    const resolved = await db('ticket_history').where({ ticket_id: ticketId, action: 'resolved' });
    expect(resolved.length).toBe(1);
    expect(resolved[0].new_value).toBe('replaced the faulty drive');
  });

  it('reopening clears both resolution timestamps and is recorded', async () => {
    await call((await loginAs('staff')).token, 'put', `/tickets/${ticketId}`, { status_id: r.itInProg.id });

    const ticket = await db('tickets').where('id', ticketId).first();
    expect(ticket.resolved_date).toBeNull();
    expect(ticket.closed_date).toBeNull();
    expect(ticket.resolution_notes).toBe('replaced the faulty drive');

    const reopened = await db('ticket_history').where({ ticket_id: ticketId, action: 'reopened' });
    expect(reopened.length).toBe(1);
    expect([reopened[0].old_value, reopened[0].new_value]).toEqual(['Resolved', 'In Progress']);
  });

  it('closing sets closed_date exactly once', async () => {
    const itSupNow = await loginAs('it_supervisor');
    await call(itSupNow.token, 'put', `/tickets/${ticketId}`, { status_id: r.itClosed.id });

    const ticket = await db('tickets').where('id', ticketId).first();
    expect(ticket.closed_date).not.toBeNull();

    const closed = await db('ticket_history').where({ ticket_id: ticketId, action: 'closed' });
    expect(closed.length).toBe(1);
    expect(closed[0].new_value).toBe('Closed');
  });

  it('a no-op update writes no history at all', async () => {
    const before = await db('ticket_history').where('ticket_id', ticketId).count({ n: '*' }).first();
    const ticket = await db('tickets').where('id', ticketId).first();

    await call((await loginAs('it_supervisor')).token, 'put', `/tickets/${ticketId}`, {
      status_id: ticket.status_id,
      assigned_to: ticket.assigned_to,
    });

    const after = await db('ticket_history').where('ticket_id', ticketId).count({ n: '*' }).first();
    expect(Number(after.n)).toBe(Number(before.n));
  });

  it('no history row anywhere references a missing ticket or a missing user', async () => {
    expect(await orphans('ticket_history', 'ticket_id', 'tickets')).toBe(0);
    expect(await orphans('ticket_history', 'user_id', 'users')).toBe(0);
    expect(await orphans('ticket_comments', 'ticket_id', 'tickets')).toBe(0);
    expect(await orphans('ticket_comments', 'user_id', 'users')).toBe(0);
    expect(await orphans('ticket_work_notes', 'ticket_id', 'tickets')).toBe(0);
    expect(await orphans('ticket_work_notes', 'user_id', 'users')).toBe(0);
    expect(await orphans('ticket_attachments', 'ticket_id', 'tickets')).toBe(0);
  });
});

describe('Invariant: notification fan-out matches the action', () => {
  let staff; let r;

  beforeAll(async () => {
    staff = await loginAs('staff');
    r = await refs();
  });

  const titles = (userId) => db('notifications').where('user_id', userId).orderBy('id');

  it('creating an IT ticket notifies only the IT supervisor', async () => {
    await db('notifications').del();
    const created = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Fan-out IT probe',
    });
    const number = created.body.ticket_number;

    const john = await r.userByName('John IT Supervisor');
    const ahmed = await r.userByName('Ahmed Maint Supervisor');

    expect((await titles(john.id)).map((n) => n.title)).toContain(`New IT ticket: ${number}`);
    expect((await titles(ahmed.id)).map((n) => n.title)).not.toContain(`New IT ticket: ${number}`);
  });

  it('creating a maintenance ticket notifies only the maintenance supervisor', async () => {
    await db('notifications').del();
    const created = await call(staff.token, 'post', '/tickets', {
      type: 'maintenance', category_id: r.mCat.id, title: 'Fan-out maintenance probe',
    });
    const number = created.body.ticket_number;

    const john = await r.userByName('John IT Supervisor');
    const ahmed = await r.userByName('Ahmed Maint Supervisor');

    expect((await titles(ahmed.id)).map((n) => n.title)).toContain(`New MAINTENANCE ticket: ${number}`);
    expect((await titles(john.id)).map((n) => n.title)).not.toContain(`New MAINTENANCE ticket: ${number}`);
  });

  it('exactly one notification is created per supervisor, not one per ticket', async () => {
    await db('notifications').del();
    const created = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Single notification probe',
    });
    const number = created.body.ticket_number;
    const john = await r.userByName('John IT Supervisor');
    const matching = (await titles(john.id)).filter((n) => n.title === `New IT ticket: ${number}`);
    expect(matching.length).toBe(1);
  });

  it('the requester is not notified about their own ticket', async () => {
    await db('notifications').del();
    await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'No self notification probe',
    });
    expect((await titles(staff.user.id)).length).toBe(0);
  });

  it('assigning notifies the assignee exactly once', async () => {
    const ticketId = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Assign notification probe',
    })).body.id;
    await db('notifications').del();

    const mike = await r.userByName('Mike Technician');
    await call((await loginAs('it_supervisor')).token, 'put', `/tickets/${ticketId}`, { assigned_to: mike.id });

    const mine = await titles(mike.id);
    expect(mine.filter((n) => n.title === 'Ticket assigned to you').length).toBe(1);
  });

  it('re-resolving notifies the requester, and only the requester', async () => {
    const ticketId = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Resolve notification probe',
    })).body.id;
    const mike = await r.userByName('Mike Technician');
    const itSup = await loginAs('it_supervisor');
    await call(itSup.token, 'put', `/tickets/${ticketId}`, { assigned_to: mike.id });

    await db('notifications').del();
    await call((await loginAs('it_staff')).token, 'put', `/tickets/${ticketId}`, {
      status_id: r.itResolved.id, resolution_note: 'done',
    });

    const ticket = await db('tickets').where('id', ticketId).first();
    const requester = await titles(staff.user.id);
    expect(requester.filter((n) => n.title === `Ticket ${ticket.ticket_number} - Resolved`).length).toBe(1);
    expect((await titles(mike.id)).filter((n) => n.title.includes('- Resolved')).length).toBe(0);
  });

  it('no notification is ever orphaned', async () => {
    expect(await orphans('notifications', 'user_id', 'users')).toBe(0);
  });
});

describe('Invariant: attachments stay consistent on disk and in the database', () => {
  let staff; let sysAdmin; let r; let ticketId;

  beforeAll(async () => {
    [staff, sysAdmin] = await Promise.all([loginAs('staff'), loginAs('sys_admin')]);
    r = await refs();
    ticketId = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Attachment invariant ticket',
    })).body.id;
  });

  it('an uploaded file gets a row, and the row points at a file that exists', async () => {
    await attach(staff.token, `/tickets/${ticketId}/attachments`, TXT, 'report.txt', 'text/plain');
    const rows = await db('ticket_attachments').where('ticket_id', ticketId);
    expect(rows.length).toBe(1);
    expect(fileExists(rows[0].file_path)).toBe(true);
    expect(readStoredFile(rows[0].file_path).equals(TXT)).toBe(true);
  });

  it('the stored path never leaks the original file name', async () => {
    const rows = await db('ticket_attachments').where('ticket_id', ticketId);
    for (const row of rows) {
      expect(row.file_path).not.toBe(row.file_name);
      expect(row.file_path).toMatch(/^[0-9a-f-]{36}\.[a-z0-9]+$/);
    }
  });

  it('deleting an attachment removes both the row and the file', async () => {
    const row = await db('ticket_attachments').where('ticket_id', ticketId).first();
    expect((await call(sysAdmin.token, 'delete', `/tickets/${ticketId}/attachments/${row.id}`)).status).toBe(200);
    expect(await db('ticket_attachments').where('id', row.id).first()).toBeUndefined();
    expect(fileExists(row.file_path)).toBe(false);
  });

  it('a ticket cannot be deleted through the API — there is no such endpoint', async () => {
    const id = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'No ticket delete probe',
    })).body.id;

    const res = await call(sysAdmin.token, 'delete', `/tickets/${id}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not found');
    expect(await db('tickets').where('id', id).first()).toBeTruthy();
  });

  it('a database-level ticket delete cascades attachment rows but leaves the file behind', async () => {
    const id = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Cascade attachment probe',
    })).body.id;
    await attach(staff.token, `/tickets/${id}/attachments`, PNG, 'shot.png', 'image/png');
    const row = await db('ticket_attachments').where('ticket_id', id).first();
    expect(fileExists(row.file_path)).toBe(true);

    await db('tickets').where('id', id).del();

    // The foreign key cascades, so no attachment row is orphaned...
    expect(await db('ticket_attachments').where('id', row.id).first()).toBeUndefined();
    // ...but the file on disk survives: nothing in the delete path unlinks it.
    // Unreachable through the API today because tickets cannot be deleted at
    // all; pinned so that adding a delete endpoint has to deal with it.
    expect(fileExists(row.file_path)).toBe(true);
  });

  it('a failed validation leaves neither a row nor a file behind', async () => {
    const id = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Validation cleanup probe',
    })).body.id;

    const res = await request.post(`/api/tickets/${id}/attachments`)
      .set('Authorization', `Bearer ${staff.token}`)
      .attach('files', Buffer.from('x'), { filename: 'blocked.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);

    expect((await db('ticket_attachments').where('ticket_id', id)).length).toBe(0);
    // The file must never have been written: multer's fileFilter rejects it
    // before the destination callback runs.
    const stray = await db('ticket_attachments').where('file_name', 'blocked.exe');
    expect(stray.length).toBe(0);
  });

  it('every attachment row in the database still has its file on disk', async () => {
    expect(await attachmentRowsWithMissingFile('ticket_attachments')).toEqual([]);
    expect(await attachmentRowsWithMissingFile('suggestion_attachments')).toEqual([]);
  });
});

describe('Invariant: cascade deletes leave no orphans behind', () => {
  let staff; let r;

  beforeAll(async () => {
    staff = await loginAs('staff');
    r = await refs();
  });

  it('deleting a user cascades their notifications and nulls their authorship columns', async () => {
    const sysAdmin = await loginAs('sys_admin');
    const id = (await call(sysAdmin.token, 'post', '/users', {
      name: 'Cascade Probe', email: `cascade.probe.${Date.now()}@newleaf.com`,
      password: 'password123', department_id: r.deptNursing.id, role_id: r.roleStaff.id,
    })).body.id;

    const ticketId = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Cascade orphan probe',
    })).body.id;
    const note = await db('ticket_work_notes').insert({
      ticket_id: ticketId, user_id: id, notes: 'internal',
    }).returning('id');
    const history = await db('ticket_history').insert({
      ticket_id: ticketId, user_id: id, action: 'comment_added',
    }).returning('id');
    await db('notifications').insert({ user_id: id, title: 'probe', message: 'm' });

    expect((await call(sysAdmin.token, 'delete', `/users/${id}`)).status).toBe(200);

    // ON DELETE CASCADE: the notification is gone.
    expect((await db('notifications').where('user_id', id)).length).toBe(0);
    // ON DELETE SET NULL: the rows survive, the authorship is blanked.
    expect((await db('ticket_work_notes').where('id', note[0].id).first()).user_id).toBeNull();
    expect((await db('ticket_history').where('id', history[0].id).first()).user_id).toBeNull();
  });

  it('deleting a requester leaves the ticket row orphaned and invisible in the list', async () => {
    // Documented behaviour: tickets.requester_id is ON DELETE SET NULL, but the
    // ticket list INNER JOINs users as requester (src/routes/tickets.js), so a
    // ticket whose requester was deleted disappears from every listing while the
    // row still exists. Pinned so a switch to LEFT JOIN is a conscious change.
    const sysAdmin = await loginAs('sys_admin');
    const id = (await call(sysAdmin.token, 'post', '/users', {
      name: 'Doomed Requester', email: `doomed.probe.${Date.now()}@newleaf.com`,
      password: 'password123', department_id: r.deptNursing.id, role_id: r.roleStaff.id,
    })).body.id;

    const ticketId = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Orphaning ticket probe',
    })).body.id;
    await db('tickets').where('id', ticketId).update({ requester_id: id });

    expect((await call(sysAdmin.token, 'delete', `/users/${id}`)).status).toBe(200);

    // The row survives with a NULL requester...
    const orphan = await db('tickets').where('id', ticketId).first();
    expect(orphan).toBeTruthy();
    expect(orphan.requester_id).toBeNull();

    // ...but it is now invisible to the API because of the inner join.
    const list = (await call(sysAdmin.token, 'get', '/tickets?limit=500')).body;
    expect(list.total).toBe(
      Number((await db('tickets').join('users as requester', 'tickets.requester_id', 'requester.id')
        .count({ n: '*' }).first()).n),
    );
    expect(list.tickets.some((t) => t.title === 'Orphaning ticket probe')).toBe(false);
    expect((await call(sysAdmin.token, 'get', `/tickets/${ticketId}`)).status).toBe(404);
  });

  it('but the dashboard LEFT JOINs the requester, so it still counts the orphan', async () => {
    // The direct consequence of the inner/left join asymmetry: the admin
    // dashboard total is one higher than the ticket list total. Both numbers are
    // individually correct for their query; they disagree with each other.
    const sysAdmin = await loginAs('sys_admin');
    const dash = (await call(sysAdmin.token, 'get', '/dashboard')).body;
    const list = (await call(sysAdmin.token, 'get', '/tickets?limit=500')).body;

    const orphans = Number((await db('tickets').whereNull('requester_id').count({ n: '*' }).first()).n);
    expect(orphans).toBeGreaterThan(0);
    expect(dash.totalTickets).toBe(list.total + orphans);
  });
});

describe('Invariant: suggestion data integrity', () => {
  let staff; let admin; let r;

  beforeAll(async () => {
    [staff, admin] = await Promise.all([loginAs('staff'), loginAs('admin')]);
    r = await refs();
  });

  it('a new suggestion resolves to the Submitted status of the suggestion workflow', async () => {
    const id = (await call(staff.token, 'post', '/suggestions', { title: 'Integrity probe suggestion' })).body.id;
    const row = await db('suggestions').where('id', id).first();
    expect(row.status_id).toBe(r.sSubmitted.id);
    expect(row.department_id).toBe(staff.user.department_id);
    expect(row.assigned_to).toBeNull();
    expect(row.assigned_department_id).toBeNull();
  });

  it('every status transition is recorded once, with the right old value', async () => {
    const id = (await call(staff.token, 'post', '/suggestions', { title: 'History probe suggestion' })).body.id;
    await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sUnderReview.id });
    await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sAccepted.id });
    await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sAssigned.id });

    const history = await db('suggestion_history').where('suggestion_id', id).orderBy('id');
    expect(history[0].action).toBe('created');
    const changes = history.filter((h) => h.action === 'status_changed');
    expect(changes.map((c) => [c.old_value, c.new_value])).toEqual([
      ['Submitted', 'Under Review'],
      ['Under Review', 'Accepted'],
      ['Accepted', 'Assigned'],
    ]);
    expect((await db('suggestions').where('id', id).first()).status_id).toBe(r.sAssigned.id);
  });

  it('a rejected transition leaves the suggestion and its history untouched', async () => {
    const id = (await call(staff.token, 'post', '/suggestions', { title: 'Rejected transition probe' })).body.id;
    const before = await db('suggestion_history').where('suggestion_id', id).count({ n: '*' }).first();

    const res = await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sClosed.id });
    expect(res.status).toBe(400);

    const after = await db('suggestion_history').where('suggestion_id', id).count({ n: '*' }).first();
    expect(Number(after.n)).toBe(Number(before.n));
    expect((await db('suggestions').where('id', id).first()).status_id).toBe(r.sSubmitted.id);
  });

  it('no suggestion or child row anywhere has an orphaned foreign key', async () => {
    expect(await orphans('suggestions', 'user_id', 'users')).toBe(0);
    expect(await orphans('suggestions', 'department_id', 'departments')).toBe(0);
    expect(await orphans('suggestions', 'assigned_department_id', 'departments')).toBe(0);
    expect(await orphans('suggestions', 'assigned_to', 'users')).toBe(0);
    expect(await orphans('suggestions', 'status_id', 'statuses')).toBe(0);
    expect(await orphans('suggestion_comments', 'suggestion_id', 'suggestions')).toBe(0);
    expect(await orphans('suggestion_history', 'suggestion_id', 'suggestions')).toBe(0);
    expect(await orphans('suggestion_attachments', 'suggestion_id', 'suggestions')).toBe(0);
  });
});

describe('Invariant: dashboard totals equal the underlying row counts', () => {
  let staff; let sysAdmin; let r;

  beforeAll(async () => {
    [staff, sysAdmin] = await Promise.all([loginAs('staff'), loginAs('sys_admin')]);
    r = await refs();
  });

  it('the admin dashboard headline counts match a direct database count', async () => {
    // One open, one resolved ticket so the numbers are non-trivial.
    const open = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Dashboard open probe', priority: 'High',
    })).body.id;
    const resolved = (await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Dashboard resolved probe', priority: 'Medium',
    })).body.id;
    await call((await loginAs('it_supervisor')).token, 'put', `/tickets/${resolved}`, { assigned_to: (await r.userByName('Mike Technician')).id });
    await call((await loginAs('it_staff')).token, 'put', `/tickets/${resolved}`, {
      status_id: r.itResolved.id, resolution_note: 'fixed',
    });

    const dash = (await call(sysAdmin.token, 'get', '/dashboard')).body;

    const total = await db('tickets').count({ n: '*' }).first();
    expect(dash.totalTickets).toBe(Number(total.n));

    const itCount = await db('tickets').where('type', 'it').count({ n: '*' }).first();
    expect(dash.itCount).toBe(Number(itCount.n));

    const mtCount = await db('tickets').where('type', 'maintenance').count({ n: '*' }).first();
    expect(dash.mCount).toBe(Number(mtCount.n));

    const critical = await db('tickets')
      .join('priorities', 'tickets.priority_id', 'priorities.id')
      .where('priorities.name', 'Critical').count({ n: '*' }).first();
    expect(dash.criticalTickets).toBe(Number(critical.n));
    expect(dash.itCritical).toBe(Number(critical.n));
    expect(dash.mCritical).toBe(0);
  });

  it('the per-status breakdowns sum to the total for each workflow', async () => {
    const dash = (await call(sysAdmin.token, 'get', '/dashboard')).body;
    const itSum = Object.values(dash.itStatusCounts).reduce((a, b) => a + b, 0);
    const mSum = Object.values(dash.mStatusCounts).reduce((a, b) => a + b, 0);
    expect(itSum + mSum).toBe(dash.totalTickets);
  });

  it('the staff dashboard counts only that staff member’s own tickets', async () => {
    const mine = (await call(staff.token, 'get', '/tickets')).body;
    const dash = (await call(staff.token, 'get', '/dashboard')).body;
    expect(dash.totalTickets).toBe(mine.total);

    const othersTotal = await db('tickets')
      .whereNot('requester_id', staff.user.id).count({ n: '*' }).first();
    if (Number(othersTotal.n) > 0) {
      expect(dash.totalTickets).toBeLessThan((await call(sysAdmin.token, 'get', '/dashboard')).body.totalTickets);
    }
  });

  it('the department and category breakdowns account for every visible ticket', async () => {
    const dash = (await call(sysAdmin.token, 'get', '/dashboard')).body;
    const deptSum = dash.byDepartment.reduce((sum, d) => sum + Number(d.count), 0);
    expect(deptSum).toBe(dash.totalTickets);
  });

  it('overdue tickets exclude resolved and closed work', async () => {
    const dash = (await call(sysAdmin.token, 'get', '/dashboard')).body;
    const excluded = new Set(['Resolved', 'Completed', 'Closed']);
    for (const ticket of dash.overdueTickets) {
      expect(excluded.has(ticket.status_name), ticket.status_name).toBe(false);
    }
  });
});

describe('Invariant: role scoping cannot be bypassed by the API', () => {
  let a; let r;

  beforeAll(async () => {
    a = await actors();
    r = await refs();
  });

  it('a staff member’s ticket list contains only tickets they requested', async () => {
    const res = await call(a.staff.token, 'get', '/tickets?limit=500');
    expect(res.body.tickets.every((t) => t.requester_id === a.staff.user.id)).toBe(true);
  });

  it('an IT supervisor sees only IT tickets, a maintenance supervisor only maintenance', async () => {
    const it = (await call(a.it_supervisor.token, 'get', '/tickets?limit=500')).body;
    expect(it.tickets.every((t) => t.type === 'it')).toBe(true);

    const mt = (await call(a.maintenance_supervisor.token, 'get', '/tickets?limit=500')).body;
    expect(mt.tickets.every((t) => t.type === 'maintenance')).toBe(true);
  });

  it('a technician sees only tickets of their team assigned to them', async () => {
    const res = await call(a.it_staff.token, 'get', '/tickets?limit=500');
    expect(res.body.tickets.every((t) => t.type === 'it' && t.assigned_to === a.it_staff.user.id)).toBe(true);
  });

  it('admins and sys_admins see every ticket', async () => {
    const forAdmin = (await call(a.admin.token, 'get', '/tickets?limit=500')).body;
    const forSys = (await call(a.sys_admin.token, 'get', '/tickets?limit=500')).body;
    expect(forAdmin.total).toBe(forSys.total);
    const dbTotal = await db('tickets')
      .join('users as requester', 'tickets.requester_id', 'requester.id')
      .count({ n: '*' }).first();
    expect(forSys.total).toBe(Number(dbTotal.n));
  });

  it('the dashboard obeys the same scoping as the ticket list', async () => {
    // Both endpoints scope by the same rules, so their totals agree — except for
    // orphaned tickets, which the dashboard's LEFT JOIN still counts. Which
    // orphans fall inside a role's scope depends on how that role is scoped:
    // requester-scoped and assignee-scoped roles cannot see them at all.
    const orphanCount = async (where) => Number(
      (await db('tickets').whereNull('requester_id').modify(where || (() => {}))
        .count({ n: '*' }).first()).n,
    );
    const all = await orphanCount();
    const it = await orphanCount((q) => q.where('type', 'it'));
    const mt = await orphanCount((q) => q.where('type', 'maintenance'));

    const visible = {
      staff: 0,
      it_staff: 0,
      maintenance_staff: 0,
      it_supervisor: it,
      maintenance_supervisor: mt,
      admin: all,
      sys_admin: all,
    };

    for (const [role, orphans] of Object.entries(visible)) {
      const list = (await call(a[role].token, 'get', '/tickets?limit=500')).body;
      const dash = (await call(a[role].token, 'get', '/dashboard')).body;
      expect(dash.totalTickets, role).toBe(list.total + orphans);
    }
  });

  it('requesters cannot reach a ticket that belongs to someone else', async () => {
    const doctor = await login('omar.doctor@newleaf.com');
    const foreign = (await call(doctor.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Doctor private ticket',
    })).body.id;

    const res = await call(a.staff.token, 'get', `/tickets/${foreign}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Insufficient permissions');
    // and the scoped list does not contain it either
    const list = (await call(a.staff.token, 'get', '/tickets?limit=500')).body;
    expect(list.tickets.some((t) => t.title === 'Doctor private ticket')).toBe(false);
  });
});
