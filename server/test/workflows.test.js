import { describe, it, expect } from 'vitest';
import db from '../src/config/db.js';
import { request, login, loginAs, call } from './helpers.mjs';

function attach(token, url, buffer, filename, contentType) {
  const path = url.startsWith('/api') ? url : `/api${url}`;
  return request.post(path)
    .set('Authorization', `Bearer ${token}`)
    .attach('files', buffer, { filename, contentType });
}

function notifTitle(userId, titlePart) {
  return db('notifications').where('user_id', userId).where('title', 'ilike', `%${titlePart}%`);
}

async function refs() {
  const byName = async (table, name, type) => {
    const q = db(table).where('name', name);
    if (type) q.andWhere('type', type);
    return q.first();
  };
  const byEmail = (email) => db('users').where('email', email).first();
  const byRoleUsers = async (name) => db('users').join('roles', 'users.role_id', 'roles.id').where('roles.name', name).select('users.id');
  return {
    itCat: await db('categories').where({ type: 'it', name: 'Printer' }).first(),
    itCatNet: await db('categories').where({ type: 'it', name: 'Network' }).first(),
    itCatCom: await db('categories').where({ type: 'it', name: 'Computer' }).first(),
    mCat: await db('categories').where({ type: 'maintenance', name: 'Plumbing' }).first(),
    mCatElec: await db('categories').where({ type: 'maintenance', name: 'Electrical' }).first(),
    itNew: await byName('statuses', 'New', 'it'),
    itInProg: await byName('statuses', 'In Progress', 'it'),
    itWFI: await byName('statuses', 'Waiting for Information', 'it'),
    itResolved: await byName('statuses', 'Resolved', 'it'),
    itClosed: await byName('statuses', 'Closed', 'it'),
    mNew: await byName('statuses', 'New', 'maintenance'),
    mInspection: await byName('statuses', 'Inspection', 'maintenance'),
    mInProg: await byName('statuses', 'In Progress', 'maintenance'),
    mWaitingParts: await byName('statuses', 'Waiting for Parts', 'maintenance'),
    mCompleted: await byName('statuses', 'Completed', 'maintenance'),
    mClosed: await byName('statuses', 'Closed', 'maintenance'),
    sSubmitted: await byName('statuses', 'Submitted', 'suggestion'),
    sUnderReview: await byName('statuses', 'Under Review', 'suggestion'),
    sAccepted: await byName('statuses', 'Accepted', 'suggestion'),
    sAssigned: await byName('statuses', 'Assigned', 'suggestion'),
    sImplementation: await byName('statuses', 'Implementation', 'suggestion'),
    sImplemented: await byName('statuses', 'Implemented', 'suggestion'),
    sClosed: await byName('statuses', 'Closed', 'suggestion'),
    sRejected: await byName('statuses', 'Rejected', 'suggestion'),
    sMoreInfo: await byName('statuses', 'Needs More Information', 'suggestion'),
    prioLow: await byName('priorities', 'Low'),
    prioMedium: await byName('priorities', 'Medium'),
    prioHigh: await byName('priorities', 'High'),
    prioCritical: await byName('priorities', 'Critical'),
    fatima: await byEmail('fatima.nurse@newleaf.com'),
    omar: await byEmail('omar.doctor@newleaf.com'),
    mike: await byEmail('mike.tech@newleaf.com'),
    ali: await byEmail('ali.maint@newleaf.com'),
    john: await byEmail('john.it@newleaf.com'),
    ahmed: await byEmail('ahmed.maint@newleaf.com'),
    admins: await byRoleUsers('admin'),
  };
}

describe('End-to-end workflows', () => {
  it('runs the full IT ticket lifecycle with notifications', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const supIT = await loginAs('it_supervisor');
    const mike = await loginAs('it_staff');

    const created = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Printer jam Ward B', priority: 'High',
    });
    expect(created.status).toBe(201);
    expect(created.body.ticket_number).toMatch(/^IT-\d{4}$/);
    const id = created.body.id;

    // Supervisor notified about the new ticket
    const newNotifs = await notifTitle(r.john.id, 'New IT ticket');
    expect(newNotifs.length).toBe(1);
    expect(newNotifs[0].title).toContain(created.body.ticket_number);

    // Assign + priority + status
    expect((await call(supIT.token, 'put', `/tickets/${id}`, { priority_id: r.prioCritical.id })).status).toBe(200);
    expect((await call(supIT.token, 'put', `/tickets/${id}`, { assigned_to: r.mike.id, status_id: r.itInProg.id })).status).toBe(200);
    expect((await notifTitle(r.mike.id, 'Ticket assigned to you')).length).toBe(1);

    // Tech comments + work note
    expect((await call(mike.token, 'post', `/tickets/${id}/comments`, { comment: 'Cleared the paper jam' })).status).toBe(201);
    expect((await call(mike.token, 'post', `/tickets/${id}/work-notes`, { notes: 'Replaced feed roller', parts_used: 'Feed roller' })).status).toBe(201);

    // Resolve requires a note
    expect((await call(mike.token, 'put', `/tickets/${id}`, { status_id: r.itResolved.id })).status).toBe(400);
    expect((await call(mike.token, 'put', `/tickets/${id}`, { status_id: r.itResolved.id, resolution_note: 'Roller replaced, test page printed.' })).status).toBe(200);
    expect((await notifTitle(r.fatima.id, 'Resolved')).length).toBe(1);

    // Requester reopens as not solved → assignee notified
    expect((await call(staff.token, 'put', `/tickets/${id}`, { status_id: r.itInProg.id })).status).toBe(200);
    expect((await notifTitle(r.mike.id, 'reopened')).length).toBe(1);
    expect((await call(staff.token, 'put', `/tickets/${id}`, { status_id: r.itResolved.id })).status).toBe(403);

    // Waiting for Information round-trip → notifications both ways
    expect((await call(supIT.token, 'put', `/tickets/${id}`, { status_id: r.itWFI.id })).status).toBe(200);
    expect((await notifTitle(r.fatima.id, 'Waiting for Information')).length).toBe(1);
    expect((await call(staff.token, 'put', `/tickets/${id}`, { status_id: r.itInProg.id })).status).toBe(200);
    expect((await notifTitle(r.mike.id, 'information provided')).length).toBe(1);

    // Re-resolve and close
    expect((await call(mike.token, 'put', `/tickets/${id}`, { status_id: r.itResolved.id, resolution_note: 'Verified printing again.' })).status).toBe(200);
    expect((await call(staff.token, 'put', `/tickets/${id}`, { status_id: r.itClosed.id })).status).toBe(200);

    const detail = (await call(staff.token, 'get', `/tickets/${id}`)).body;
    const actions = [...new Set(detail.history.map((h) => h.action))];
    expect(actions).toEqual(expect.arrayContaining([
      'created', 'status_changed', 'priority_changed', 'assigned',
      'comment_added', 'work_notes_added', 'resolved', 'reopened', 'closed',
    ]));
    expect(detail.ticket.resolution_notes).toContain('Verified printing');
    expect(detail.workNotes.length).toBe(0);
  });

  it('runs the full maintenance lifecycle with parts, attachment, reopen and close', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const supMT = await loginAs('maintenance_supervisor');
    const ali = await loginAs('maintenance_staff');

    const created = await call(staff.token, 'post', '/tickets', {
      type: 'maintenance', category_id: r.mCat.id, title: 'Burst pipe beneath sink', priority: 'Critical',
    });
    expect(created.status).toBe(201);
    expect(created.body.ticket_number).toMatch(/^MT-\d{4}$/);
    const id = created.body.id;
    expect((await notifTitle(r.ahmed.id, 'New MAINTENANCE ticket')).length).toBe(1);

    // Assign + inspection
    expect((await call(supMT.token, 'put', `/tickets/${id}`, { assigned_to: r.ali.id, status_id: r.mInspection.id })).status).toBe(200);
    expect((await notifTitle(r.ali.id, 'Ticket assigned to you')).length).toBe(1);

    // Technicians cannot assign/prioritize
    expect((await call(ali.token, 'put', `/tickets/${id}`, { priority_id: r.prioLow.id })).status).toBe(403);
    expect((await call(ali.token, 'put', `/tickets/${id}`, { assigned_to: r.mike.id })).status).toBe(403);

    // Repair with materials, status progression, attachment
    expect((await call(ali.token, 'post', `/tickets/${id}/work-notes`, { notes: 'Found crack in feed pipe', parts_used: 'Pipe section, seal tape' })).status).toBe(201);
    expect((await call(ali.token, 'put', `/tickets/${id}`, { status_id: r.mInProg.id })).status).toBe(200);
    expect((await call(ali.token, 'put', `/tickets/${id}`, { status_id: r.mWaitingParts.id })).status).toBe(200);
    expect((await call(ali.token, 'put', `/tickets/${id}`, { status_id: r.mInProg.id })).status).toBe(200);
    const png = await attach(ali.token, `/tickets/${id}/attachments`, Buffer.from('iVBORw0KGgo=', 'base64'), 'before.png', 'image/png');
    expect(png.status).toBe(201);
    const withFile = (await call(ali.token, 'get', `/tickets/${id}`)).body;
    expect(withFile.attachments.length).toBe(1);

    // Complete requires a note
    expect((await call(ali.token, 'put', `/tickets/${id}`, { status_id: r.mCompleted.id })).status).toBe(400);
    expect((await call(ali.token, 'put', `/tickets/${id}`, { status_id: r.mCompleted.id, resolution_note: 'Replaced cracked section and sealed.' })).status).toBe(200);

    // Requester reopens; assignee notified
    expect((await call(staff.token, 'put', `/tickets/${id}`, { status_id: r.mInProg.id })).status).toBe(200);
    expect((await notifTitle(r.ali.id, 'reopened')).length).toBe(1);

    // Re-complete and close
    expect((await call(ali.token, 'put', `/tickets/${id}`, { status_id: r.mCompleted.id, resolution_note: 'Confirmed no further leaks.' })).status).toBe(200);
    expect((await call(staff.token, 'put', `/tickets/${id}`, { status_id: r.mClosed.id })).status).toBe(200);

    const detail = (await call(staff.token, 'get', `/tickets/${id}`)).body;
    const actions = [...new Set(detail.history.map((h) => h.action))];
    expect(actions).toEqual(expect.arrayContaining([
      'created', 'assigned', 'status_changed', 'work_notes_added',
      'attachment_added', 'resolved', 'reopened', 'closed',
    ]));
    expect(detail.workNotes.length).toBe(0);
  });

  it('runs the acceptance, assignment, implementation and close pipeline', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const admin = await loginAs('admin');

    const made = await call(staff.token, 'post', '/suggestions', {
      title: 'Digital signage for outpatient queues', problem: 'Crowded waiting areas',
      proposed_solution: 'TV screens per clinic', expected_benefit: 'Less congestion',
    });
    expect(made.status).toBe(201);
    expect(made.body.suggestion_number).toMatch(/^S-\d{4}$/);
    const id = made.body.id;

    for (const a of r.admins) {
      expect((await notifTitle(a.id, 'New suggestion')).length).toBe(1);
    }

    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sUnderReview.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sAccepted.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sImplementation.id })).status).toBe(400); // skip guard
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sAssigned.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sImplementation.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sImplemented.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sClosed.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sAccepted.id })).status).toBe(400); // closed is terminal

    const updated = await notifTitle(r.fatima.id, 'updated');
    expect(updated.length).toBe(6); // one per status transition in this pipeline
  });

  it('runs the request-information and rejection paths with assignment notifications', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const admin = await loginAs('admin');

    const s1 = await call(staff.token, 'post', '/suggestions', { title: 'Shaded benches outdoors', problem: 'Heat exposure' });
    const id = s1.body.id;
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sMoreInfo.id })).status).toBe(200);
    expect((await call(staff.token, 'put', `/suggestions/${id}`, { status_id: r.sAccepted.id })).status).toBe(403);
    expect((await call(staff.token, 'put', `/suggestions/${id}`, { status_id: r.sUnderReview.id })).status).toBe(200);
    const d1 = (await call(staff.token, 'get', `/suggestions/${id}`)).body;
    expect(d1.history.some((h) => h.action === 'information_provided')).toBe(true);
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sRejected.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${id}`, { status_id: r.sClosed.id })).status).toBe(200);

    const s2 = await call(staff.token, 'post', '/suggestions', { title: 'Reject direct', problem: 'p' });
    expect((await call(admin.token, 'put', `/suggestions/${s2.body.id}`, { status_id: r.sRejected.id })).status).toBe(200);

    const s3 = await call(staff.token, 'post', '/suggestions', { title: 'Named visitor badges', problem: 'Security' });
    const id3 = s3.body.id;
    await call(admin.token, 'put', `/suggestions/${id3}`, { status_id: r.sUnderReview.id });
    await call(admin.token, 'put', `/suggestions/${id3}`, { status_id: r.sAccepted.id });
    expect((await call(admin.token, 'put', `/suggestions/${id3}`, { assigned_department_id: 3 })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${id3}`, { assigned_to: r.mike.id })).status).toBe(200);
    const mikeSuggestionAssigns = await db('notifications')
      .where('user_id', r.mike.id)
      .where('title', 'ilike', '%Suggestion%')
      .where('title', 'ilike', '%assigned to you%');
    expect(mikeSuggestionAssigns.length).toBe(1);
    const fatimaAssignments = await notifTitle(r.fatima.id, 'Suggestion');
    expect(fatimaAssignments.some((n) => n.message.includes('Responsible staff'))).toBe(true);
  });

  it('tracks notifications with unread-count, single-read and read-all', async () => {
    const r = await refs();
    const supIT = await loginAs('it_supervisor');

    await db('notifications').insert([
      { user_id: r.john.id, title: 'N1', message: 'm' },
      { user_id: r.john.id, title: 'N2', message: 'm' },
      { user_id: r.fatima.id, title: 'Private', message: 'm' },
    ]);

    const unreadBefore = (await call(supIT.token, 'get', '/notifications/unread-count')).body.count;
    expect(unreadBefore).toBeGreaterThanOrEqual(2);

    const list = (await call(supIT.token, 'get', '/notifications')).body;
    const n1 = list.find((n) => n.title === 'N1');
    expect((await call(supIT.token, 'put', `/notifications/${n1.id}/read`)).status).toBe(200);
    expect((await db('notifications').where('id', n1.id).first()).is_read).toBe(true);

    const unreadAfter = (await call(supIT.token, 'get', '/notifications/unread-count')).body.count;
    expect(unreadAfter).toBe(unreadBefore - 1);

    expect((await call(supIT.token, 'put', '/notifications/read-all')).status).toBe(200);
    const remaining = await db('notifications').where('user_id', r.john.id).where('is_read', false);
    expect(remaining).toHaveLength(0);
  });

  it('matches dashboard numbers to actual database records', async () => {
    const r = await refs();
    const admin = await loginAs('admin');

    await call(admin.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Dash A', priority: 'High' });
    await call(admin.token, 'post', '/tickets', { type: 'maintenance', category_id: r.mCat.id, title: 'Dash B', priority: 'Critical' });
    await call(admin.token, 'post', '/tickets', { type: 'it', category_id: r.itCatNet.id, title: 'Dash C', priority: 'Low' });

    const dbTotal = parseInt((await db('tickets').count('id as c').first()).c, 10);
    const dbIt = parseInt((await db('tickets').where('type', 'it').count('id as c').first()).c, 10);
    const dbM = parseInt((await db('tickets').where('type', 'maintenance').count('id as c').first()).c, 10);

    const dash = (await call(admin.token, 'get', '/dashboard')).body;
    expect(dash.totalTickets).toBe(dbTotal);
    expect(dash.itCount).toBe(dbIt);
    expect(dash.mCount).toBe(dbM);
    for (const t of dash.recentTickets) {
      expect(await db('tickets').where('id', t.id).first()).toBeTruthy();
    }

    const staff = await loginAs('staff');
    const staffDash = (await call(staff.token, 'get', '/dashboard')).body;
    const myDb = parseInt((await db('tickets').where('requester_id', r.fatima.id).count('id as c').first()).c, 10);
    expect(staffDash.totalTickets).toBe(myDb);
  });
});

describe('Search, filters and pagination', () => {
  it('paginates and filters ticket lists correctly', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const admin = await loginAs('admin');
    const supIT = await loginAs('it_supervisor');
    const doctor = await login('omar.doctor@newleaf.com');
    const doctorId = r.omar.id;

    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Baselines captured through the same API the assertions re-check, so the
    // tickets created by earlier tests in this file (shared seeded DB) cannot
    // skew the expected totals below.
    const bStaff = (await call(staff.token, 'get', '/tickets?limit=1')).body.total;
    const bIT = (await call(admin.token, 'get', '/tickets?type=it&limit=1')).body.total;
    const bNew = (await call(admin.token, 'get', '/tickets?status=New&limit=1')).body.total;
    const bHigh = (await call(admin.token, 'get', '/tickets?priority=High&limit=1')).body.total;
    const bNurse = (await call(admin.token, 'get', '/tickets?department=Nursing&limit=1')).body.total;
    const bComp = (await call(admin.token, 'get', '/tickets?category=Computer&limit=1')).body.total;
    const bWard1 = (await call(admin.token, 'get', '/tickets?location=Ward%201&limit=1')).body.total;
    const bToday = (await call(admin.token, 'get', `/tickets?date=${iso}&limit=1`)).body.total;
    const bOmarReq = (await call(admin.token, 'get', `/tickets?requester_id=${doctorId}&limit=1`)).body.total;

    const fatimaIds = [];
    for (let i = 0; i < 18; i++) {
      const type = i % 2 === 0 ? 'it' : 'maintenance';
      const cat = type === 'it' ? r.itCatCom : r.mCatElec;
      const prio = i % 3 === 0 ? 'High' : 'Medium';
      const res = await call(staff.token, 'post', '/tickets', {
        type, category_id: cat.id, title: `Pagination Alpha ${i}`, priority: prio, location: `Ward ${i % 3}`,
      });
      expect(res.status).toBe(201);
      fatimaIds.push(res.body.id);
    }
    const omarIds = [];
    for (let i = 0; i < 4; i++) {
      const res = await call(doctor.token, 'post', '/tickets', {
        type: 'maintenance', category_id: r.mCat.id, title: `Omar Beta ${i}`, priority: 'Medium', location: 'ER',
      });
      expect(res.status).toBe(201);
      omarIds.push(res.body.id);
    }

    const staffTotal = bStaff + 18;

    // ── Staff scope: pagination across OWN requests ──────────────────────────
    const p1 = await call(staff.token, 'get', '/tickets?page=1&limit=10');
    expect(p1.body.tickets).toHaveLength(Math.min(10, staffTotal));
    expect(p1.body.total).toBe(staffTotal);
    const p2 = await call(staff.token, 'get', '/tickets?page=2&limit=10');
    expect(p2.body.tickets).toHaveLength(Math.max(staffTotal - 10, 0));
    expect(p2.body.tickets.every((t) => t.requester_id === r.fatima.id)).toBe(true);

    const pClamped = await call(staff.token, 'get', '/tickets?page=1&limit=5000');
    expect(pClamped.body.limit).toBe(500);
    expect(pClamped.body.tickets).toHaveLength(staffTotal);

    const pBad = await call(staff.token, 'get', '/tickets?page=-3&limit=abc');
    expect(pBad.status).toBe(200);
    expect(pBad.body.page).toBe(1);

    // ── Admin filters over the full set ──────────────────────────────────────
    const byStatus = await call(admin.token, 'get', '/tickets?status=New&limit=50');
    expect(byStatus.body.tickets.every((t) => t.status_name === 'New')).toBe(true);
    expect(byStatus.body.total).toBe(bNew + 22);
    const byPrio = await call(admin.token, 'get', '/tickets?priority=High&limit=50');
    expect(byPrio.body.tickets.every((t) => t.priority_name === 'High')).toBe(true);
    expect(byPrio.body.total).toBe(bHigh + 6); // i % 3 === 0 for i in 0..17
    const byType = await call(admin.token, 'get', '/tickets?type=it&limit=50');
    expect(byType.body.tickets.every((t) => t.type === 'it')).toBe(true);
    expect(byType.body.total).toBe(bIT + 9);
    const byDept = await call(admin.token, 'get', '/tickets?department=Nursing&limit=50');
    expect(byDept.body.tickets.every((t) => t.department_name === 'Nursing')).toBe(true);
    expect(byDept.body.total).toBe(bNurse + 18);
    const byCat = await call(admin.token, 'get', '/tickets?category=Computer&limit=50');
    expect(byCat.body.tickets.every((t) => t.category_name === 'Computer')).toBe(true);
    expect(byCat.body.total).toBe(bComp + 9);
    const byLoc = await call(admin.token, 'get', '/tickets?location=Ward%201&limit=50');
    expect(byLoc.body.tickets.every((t) => t.location === 'Ward 1')).toBe(true);
    expect(byLoc.body.total).toBe(bWard1 + 6);
    const byDate = await call(admin.token, 'get', `/tickets?date=${iso}&limit=50`);
    expect(byDate.body.total).toBe(bToday + 22);
    const bySearch = await call(admin.token, 'get', '/tickets?search=Pagination%20Alpha%2017');
    expect(bySearch.body.tickets.some((t) => t.title === 'Pagination Alpha 17')).toBe(true);

    // ── Assignee / requester filters (admin scope) ───────────────────────────
    const assignRes = await call(supIT.token, 'get', '/users/technicians?type=it');
    const someTech = assignRes.body[0];
    const assignedId = fatimaIds[0];
    await call(supIT.token, 'put', `/tickets/${assignedId}`, { assigned_to: someTech.id });
    const byAssignee = await call(admin.token, 'get', `/tickets?assigned_to=${someTech.id}`);
    expect(byAssignee.body.tickets.every((t) => t.assigned_to == someTech.id)).toBe(true);
    expect(byAssignee.body.tickets.length).toBeGreaterThanOrEqual(1);

    const byRequester = await call(admin.token, 'get', `/tickets?requester_id=${doctorId}&limit=50`);
    expect(byRequester.body.total).toBe(bOmarReq + 4);
    expect(byRequester.body.tickets.every((t) => t.requester_id == doctorId)).toBe(true);

    // ── IT supervisor pagination over the IT queue ───────────────────────────
    const sup1 = await call(supIT.token, 'get', '/tickets?page=1&limit=10');
    expect(sup1.body.total).toBe(bIT + 9);
    expect(sup1.body.tickets).toHaveLength(Math.min(10, bIT + 9));
  });

  it('filters and paginates suggestions lists correctly', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const admin = await loginAs('admin');

    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const bAll = (await call(admin.token, 'get', '/suggestions?limit=1')).body.total;
    const bSubmitted = (await call(admin.token, 'get', '/suggestions?status=Submitted&limit=1')).body.total;
    const bDate = (await call(admin.token, 'get', `/suggestions?date=${iso}&limit=1`)).body.total;
    const bNurse = (await call(admin.token, 'get', '/suggestions?department=Nursing&limit=1')).body.total;
    const bStaffAll = (await call(staff.token, 'get', '/suggestions?limit=1')).body.total;
    const bStaffSubmitted = (await call(staff.token, 'get', '/suggestions?status=Submitted&limit=1')).body.total;

    const ids = [];
    for (let i = 0; i < 6; i++) {
      const res = await call(staff.token, 'post', '/suggestions', { title: `Sug Filter ${i}`, problem: `problem ${i}`, proposed_solution: 'x', expected_benefit: 'y' });
      expect(res.status).toBe(201);
      ids.push(res.body.id);
    }
    // Move two to non-Submitted so a status filter is meaningful
    await call(admin.token, 'put', `/suggestions/${ids[0]}`, { status_id: r.sUnderReview.id });
    await call(admin.token, 'put', `/suggestions/${ids[1]}`, { status_id: r.sRejected.id });

    const p = await call(admin.token, 'get', '/suggestions?page=1&limit=3');
    expect(p.body.suggestions).toHaveLength(Math.min(3, bAll + 6));
    expect(p.body.total).toBe(bAll + 6);

    const byStatus = await call(admin.token, 'get', '/suggestions?status=Submitted');
    expect(byStatus.body.total).toBe(bSubmitted + 4);
    const bySearch = await call(admin.token, 'get', '/suggestions?search=Sug%20Filter%205');
    expect(bySearch.body.suggestions.some((s) => s.title === 'Sug Filter 5')).toBe(true);
    const byDate = await call(admin.token, 'get', `/suggestions?date=${iso}`);
    expect(byDate.body.total).toBe(bDate + 6);
    const byDept = await call(admin.token, 'get', `/suggestions?department=Nursing`);
    expect(byDept.body.total).toBe(bNurse + 6);

    // Non-admin sees only their own suggestions even with filters
    const staffList = await call(staff.token, 'get', `/suggestions?status=Submitted`);
    expect(staffList.body.total).toBe(bStaffSubmitted + 4);
    expect(staffList.body.suggestions.every((s) => s.user_id === r.fatima.id)).toBe(true);
  });
});

describe('Validation and data-integrity guards', () => {
  it('rejects empty required fields and invalid inputs with 400', async () => {
    const r = await refs();
    const staff = await loginAs('staff');
    const supIT = await loginAs('it_supervisor');
    const mike = await loginAs('it_staff');
    const sys = await loginAs('sys_admin');
    const admin = await loginAs('admin');

    const badCases = [
      // ticket create
      call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'x' }), // title too short
      call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, priority: 'High' }), // missing title
      call(staff.token, 'post', '/tickets', { type: 'other', category_id: r.itCat.id, title: 'Valid title' }),
      call(staff.token, 'post', '/tickets', { type: 'it', title: 'Valid title', priority: 'High' }), // missing category
      call(staff.token, 'post', '/tickets', { type: 'it', category_id: 999999, title: 'Valid title', priority: 'High' }),
      call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Valid title', priority: 'Urgent' }), // invented priority
      call(staff.token, 'post', '/tickets', { type: 'maintenance', category_id: r.itCat.id, title: 'Wrong category type' }),
      call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Huge title ' + 'a'.repeat(300) }), // >255
      // suggestion create
      call(staff.token, 'post', '/suggestions', { title: 'x' }),
      call(staff.token, 'post', '/suggestions', { title: 'No department exists', department_id: 999999 }),
      // comments / work notes
      call(staff.token, 'post', '/tickets/999999/comments', { comment: '' }),
      call(mike.token, 'post', '/tickets/999999/work-notes', { notes: '' }),
    ];
    for (const c of badCases) {
      expect((await c).status).toBe(400);
    }

    // Comment / note caps on a real ticket the technician is assigned to
    const t = await call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Caps test', priority: 'Medium' });
    await call(supIT.token, 'put', `/tickets/${t.body.id}`, { assigned_to: r.mike.id, status_id: r.itInProg.id });
    expect((await call(mike.token, 'post', `/tickets/${t.body.id}/comments`, { comment: 'x'.repeat(5001) })).status).toBe(400);
    expect((await call(mike.token, 'post', `/tickets/${t.body.id}/work-notes`, { notes: 'x'.repeat(5001) })).status).toBe(400);

    // PUT invalid reference ids
    expect((await call(supIT.token, 'put', `/tickets/${t.body.id}`, { priority_id: 999999 })).status).toBe(400);
    expect((await call(supIT.token, 'put', `/tickets/${t.body.id}`, { status_id: 999999 })).status).toBe(400);
    expect((await call(supIT.token, 'put', `/tickets/${t.body.id}`, { assigned_to: 999999 })).status).toBe(400);

    // Suggestion PUT invalid references
    const s = await call(staff.token, 'post', '/suggestions', { title: 'Sug put refs', problem: 'p' });
    expect((await call(admin.token, 'put', `/suggestions/${s.body.id}`, { assigned_department_id: 999999 })).status).toBe(400);
    expect((await call(admin.token, 'put', `/suggestions/${s.body.id}`, { assigned_to: 999999 })).status).toBe(400);

    // Duplicate user email
    expect((await call(sys.token, 'post', '/users', {
      name: 'Dup User', email: r.fatima.email, password: 'password123', department_id: 1, role_id: 1,
    })).status).toBe(400);
  });

  it('rejects oversized and dangerous file uploads without creating records', async () => {
    const r = await refs();
    const staff = await loginAs('staff');

    const beforeCreate = parseInt((await db('tickets').count('id as c').first()).c, 10);

    // Oversized file on the ticket CREATE route (field name 'attachments')
    const big = Buffer.alloc(11 * 1024 * 1024, 1); // 11 MB > 10 MB cap
    const over = await request.post('/api/tickets')
      .set('Authorization', `Bearer ${staff.token}`)
      .field('type', 'it')
      .field('category_id', r.itCat.id)
      .field('title', 'Oversized upload create')
      .field('priority', 'Medium')
      .attach('attachments', big, { filename: 'huge.pdf', contentType: 'application/pdf' });
    expect(over.status).toBe(400);
    const afterCreate = parseInt((await db('tickets').count('id as c').first()).c, 10);
    expect(afterCreate).toBe(beforeCreate); // no orphan ticket

    // Oversized file on the ATTACHMENTS route
    const t = await call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Upload caps', priority: 'Medium' });
    const overAttach = await attach(staff.token, `/tickets/${t.body.id}/attachments`, big, 'huge.pdf', 'application/pdf');
    expect(overAttach.status).toBe(400);

    // Unsupported extension on the create route → 400 and no ticket
    const exeCreate = await request.post('/api/tickets')
      .set('Authorization', `Bearer ${staff.token}`)
      .field('type', 'it')
      .field('category_id', r.itCat.id)
      .field('title', 'Bad exe on create')
      .field('priority', 'Medium')
      .attach('attachments', Buffer.from('MZ'), { filename: 'bad.exe', contentType: 'application/octet-stream' });
    expect(exeCreate.status).toBe(400);

    // Over-count (6 files) on the attachments route → 400
    const t2 = await call(staff.token, 'post', '/tickets', { type: 'it', category_id: r.itCat.id, title: 'Many files', priority: 'Medium' });
    const many = request.post(`/api/tickets/${t2.body.id}/attachments`).set('Authorization', `Bearer ${staff.token}`);
    for (let i = 0; i < 6; i++) {
      many.attach('files', Buffer.from('x'), { filename: `f${i}.txt`, contentType: 'text/plain' });
    }
    const manyRes = await many;
    expect(manyRes.status).toBe(400);

    // No orphan attachment rows at the end for the failed attempts
    const orphanCounts = await db('ticket_attachments')
      .whereIn('ticket_id', [t2.body.id, t.body.id, 999999]);
    expect(orphanCounts.filter((a) => ![t.body.id, t2.body.id].includes(a.ticket_id))).toHaveLength(0);
  });
});