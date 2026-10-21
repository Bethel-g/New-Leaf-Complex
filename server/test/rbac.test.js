import { describe, it, expect } from 'vitest';
import db from '../src/config/db.js';
import { request, login, loginAs, call, DEFAULT_PASSWORD } from './helpers.mjs';

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
    itResolved: await byName('statuses', 'Resolved', 'it'),
    itClosed: await byName('statuses', 'Closed', 'it'),
    itWFI: await byName('statuses', 'Waiting for Information', 'it'),
    mInProg: await byName('statuses', 'In Progress', 'maintenance'),
    mInspection: await byName('statuses', 'Inspection', 'maintenance'),
    mWaitingParts: await byName('statuses', 'Waiting for Parts', 'maintenance'),
    mCompleted: await byName('statuses', 'Completed', 'maintenance'),
    mClosed: await byName('statuses', 'Closed', 'maintenance'),
    sUnderReview: await byName('statuses', 'Under Review', 'suggestion'),
    low: await byName('priorities', 'Low'),
    high: await byName('priorities', 'High'),
  };
}

describe('RBAC (role-based access control)', () => {
  it('enforces the full permission matrix end-to-end', async () => {
    const r = await refs();
    const staff = await loginAs('staff');             // fatima (requests)
    const doctor = await login('omar.doctor@newleaf.com'); // OTHER staff member
    const supIT = await loginAs('it_supervisor');
    const mike = await loginAs('it_staff');
    const supMT = await loginAs('maintenance_supervisor');
    const ali = await loginAs('maintenance_staff');
    const admin = await loginAs('admin');
    const sys = await loginAs('sys_admin');

    // ── Step 1: staff creates requests ──────────────────────────────────────
    const it1 = await call(staff.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Printer offline Ward B', priority: 'High',
    });
    expect(it1.status).toBe(201);
    const it1Id = it1.body.id;

    const it2 = await call(doctor.token, 'post', '/tickets', {
      type: 'it', category_id: r.itCat.id, title: 'Email not syncing', priority: 'Medium',
    });
    expect(it2.status).toBe(201);
    const it2Id = it2.body.id;

    const mt1 = await call(staff.token, 'post', '/tickets', {
      type: 'maintenance', category_id: r.mCat.id, title: 'AC leaking Ward C', priority: 'High',
    });
    expect(mt1.status).toBe(201);
    const mt1Id = mt1.body.id;

    const s1 = await call(staff.token, 'post', '/suggestions', {
      title: 'Install hand sanitizer dispensers', problem: 'Low compliance',
    });
    expect(s1.status).toBe(201);
    const s1Id = s1.body.id;

    // ── Step 2: staff sees only their own requests ──────────────────────────
    const staffTickets = (await call(staff.token, 'get', '/tickets')).body.tickets;
    expect(staffTickets.map((t) => t.id)).toEqual(expect.arrayContaining([it1Id, mt1Id]));
    expect(staffTickets.map((t) => t.id)).not.toContain(it2Id);
    expect(staffTickets.every((t) => t.requester_id === staff.user.id)).toBe(true);

    const staffSuggestions = (await call(staff.token, 'get', '/suggestions')).body.suggestions;
    expect(staffSuggestions.some((s) => s.id === s1Id)).toBe(true);
    expect(staffSuggestions.every((s) => s.user_id === staff.user.id)).toBe(true);

    // ── Step 3: other staff cannot peek or touch ─────────────────────────────
    expect((await call(doctor.token, 'get', `/tickets/${it1Id}`)).status).toBe(403);
    expect((await call(doctor.token, 'get', `/tickets/${mt1Id}`)).status).toBe(403);
    expect((await call(doctor.token, 'get', `/suggestions/${s1Id}`)).status).toBe(403);
    expect((await call(doctor.token, 'post', `/tickets/${it1Id}/comments`, { comment: 'sneak peak' })).status).toBe(403);
    expect((await call(doctor.token, 'put', `/suggestions/${s1Id}`, { status_id: r.itInProg.id })).status).toBe(403);

    // Staff can comment on own ticket only
    expect((await call(staff.token, 'post', `/tickets/${it1Id}/comments`, { comment: 'Please help' })).status).toBe(201);
    // Staff cannot use internal work notes
    expect((await call(staff.token, 'post', `/tickets/${it1Id}/work-notes`, { notes: 'N/A' })).status).toBe(403);
    // Staff (requester) cannot prioritize/assign/edit their own ticket
    expect((await call(staff.token, 'put', `/tickets/${it1Id}`, { priority_id: r.low.id })).status).toBe(403);
    expect((await call(staff.token, 'put', `/tickets/${it1Id}`, { title: 'Renamed' })).status).toBe(403);
    expect((await call(staff.token, 'put', `/tickets/${it1Id}`, { assigned_to: mike.user.id })).status).toBe(403);

    // ── Step 4: supervisor manages IT queue ──────────────────────────────────
    const supList = (await call(supIT.token, 'get', '/tickets')).body.tickets;
    expect(supList.map((t) => t.id)).toEqual(expect.arrayContaining([it1Id, it2Id]));
    expect(supList.map((t) => t.id)).not.toContain(mt1Id);
    expect(supList.every((t) => t.type === 'it')).toBe(true);

    expect((await call(supIT.token, 'get', `/tickets/${it1Id}`)).status).toBe(200);
    // supervisor can change priority
    expect((await call(supIT.token, 'put', `/tickets/${it2Id}`, { priority_id: r.low.id })).status).toBe(200);
    // supervisor assigns it1 to Mike and moves to In Progress
    expect((await call(supIT.token, 'put', `/tickets/${it1Id}`, {
      assigned_to: mike.user.id, status_id: r.itInProg.id,
    })).status).toBe(200);
    // supervisor cannot manage the other team's tickets
    expect((await call(supIT.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mInProg.id })).status).toBe(403);

    // ── Step 5: IT technician sees/updates only assigned tickets ─────────────
    const mikeList = (await call(mike.token, 'get', '/tickets')).body.tickets;
    expect(mikeList.map((t) => t.id)).toEqual([it1Id]);
    expect(mikeList.map((t) => t.id)).not.toContain(it2Id);

    expect((await call(mike.token, 'get', `/tickets/${it1Id}`)).status).toBe(200);
    expect((await call(mike.token, 'get', `/tickets/${it2Id}`)).status).toBe(403);

    expect((await call(mike.token, 'post', `/tickets/${it1Id}/work-notes`, { notes: 'Reseated RAM' })).status).toBe(201);
    expect((await call(mike.token, 'post', `/tickets/${it2Id}/work-notes`, { notes: 'not mine' })).status).toBe(403);
    expect((await call(mike.token, 'post', `/tickets/${it1Id}/comments`, { comment: 'Working on it' })).status).toBe(201);

    // technicians cannot assign/prioritize
    expect((await call(mike.token, 'put', `/tickets/${it1Id}`, { priority_id: r.low.id })).status).toBe(403);
    expect((await call(mike.token, 'put', `/tickets/${it1Id}`, { assigned_to: ali.user.id })).status).toBe(403);
    // resolving an IT ticket requires a resolution description
    expect((await call(mike.token, 'put', `/tickets/${it1Id}`, { status_id: r.itResolved.id })).status).toBe(400);
    // but they can resolve assigned tickets with a description
    expect((await call(mike.token, 'put', `/tickets/${it1Id}`, { status_id: r.itResolved.id, resolution_note: 'Replaced toner and reset printer queue.' })).status).toBe(200);
    expect((await call(mike.token, 'get', `/tickets/${it2Id}`)).status).toBe(403);

    // ── Step 6: requester confirms / reopens a resolved ticket ──────────────
    const detail = (await call(staff.token, 'get', `/tickets/${it1Id}`)).body;
    expect(detail.workNotes.length).toBe(0); // internal notes hidden from requester
    expect(detail.ticket.resolution_notes).toContain('toner'); // resolution visible to requester
    // requester says "Problem not solved" → back to In Progress; cannot jump straight to Resolved
    expect((await call(staff.token, 'put', `/tickets/${it1Id}`, { status_id: r.itInProg.id })).status).toBe(200);
    expect((await call(staff.token, 'put', `/tickets/${it1Id}`, { status_id: r.itResolved.id })).status).toBe(403);
    // tech re-resolves (with description) and requester confirms solved → Closed
    expect((await call(mike.token, 'put', `/tickets/${it1Id}`, { status_id: r.itResolved.id, resolution_note: 'Printer queue cleared and test page printed.' })).status).toBe(200);
    expect((await call(staff.token, 'put', `/tickets/${it1Id}`, { status_id: r.itClosed.id })).status).toBe(200);
    const history = (await call(staff.token, 'get', `/tickets/${it1Id}`)).body.history;
    expect(history.map((h) => h.action).filter((a, i, arr) => arr.indexOf(a) === i)).toEqual(
      expect.arrayContaining(['created', 'assigned', 'status_changed', 'comment_added', 'resolved', 'reopened', 'closed'])
    );
    // supervisor puts a ticket Waiting for Information; requester provides info → In Progress
    expect((await call(supIT.token, 'put', `/tickets/${it2Id}`, { status_id: r.itWFI.id })).status).toBe(200);
    expect((await call(doctor.token, 'put', `/tickets/${it2Id}`, { status_id: r.itInProg.id })).status).toBe(200);
    expect((await call(doctor.token, 'put', `/tickets/${it2Id}`, { status_id: r.itWFI.id })).status).toBe(403);
    // supervisor monitor shows unresolved tickets, including the WFI one
    const supDash = (await call(supIT.token, 'get', '/dashboard')).body;
    expect(supDash.unresolvedTickets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: it2Id, status_name: 'In Progress' }),
    ]));

    // ── Step 7: maintenance supervisor + technician (full workflow) ────────
    const mtSupList = (await call(supMT.token, 'get', '/tickets')).body.tickets;
    expect(mtSupList.map((t) => t.id)).toEqual([mt1Id]);

    // supervisor assigns and sends the ticket for inspection
    expect((await call(supMT.token, 'put', `/tickets/${mt1Id}`, {
      assigned_to: ali.user.id, status_id: r.mInspection.id,
    })).status).toBe(200);

    // supervisor monitor shows the unresolved maintenance request
    const mtSupDash = (await call(supMT.token, 'get', '/dashboard')).body;
    expect(mtSupDash.unresolvedTickets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: mt1Id, type: 'maintenance' }),
    ]));

    const aliList = (await call(ali.token, 'get', '/tickets')).body.tickets;
    expect(aliList.map((t) => t.id)).toEqual([mt1Id]);

    // maintenance technicians cannot assign/prioritize or close tickets
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { assigned_to: mike.user.id })).status).toBe(403);
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { priority_id: r.low.id })).status).toBe(403);
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mClosed.id })).status).toBe(403);

    expect((await call(ali.token, 'post', `/tickets/${mt1Id}/work-notes`, { notes: 'Found cracked pipe below sink', parts_used: 'pipe sealant' })).status).toBe(201);
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mInProg.id })).status).toBe(200);
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mWaitingParts.id })).status).toBe(200);
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mInProg.id })).status).toBe(200);
    // completing requires a resolution description
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mCompleted.id })).status).toBe(400);
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mCompleted.id, resolution_note: 'Replaced cracked pipe section and resealed joints.' })).status).toBe(200);

    // requester says the problem is NOT fixed → reopen to In Progress
    expect((await call(staff.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mInProg.id })).status).toBe(200);
    expect((await call(staff.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mClosed.id })).status).toBe(403);
    // supervisor monitor picks the reopened ticket back up
    expect((await call(supMT.token, 'get', '/dashboard')).body.unresolvedTickets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: mt1Id }),
    ]));
    // tech re-completes; requester confirms fixed → Closed
    expect((await call(ali.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mCompleted.id, resolution_note: 'Verified no further leakage after repair.' })).status).toBe(200);
    expect((await call(staff.token, 'put', `/tickets/${mt1Id}`, { status_id: r.mClosed.id })).status).toBe(200);

    const mtHistory = (await call(staff.token, 'get', `/tickets/${mt1Id}`)).body.history;
    expect(mtHistory.map((h) => h.action).filter((a, i, arr) => arr.indexOf(a) === i)).toEqual(
      expect.arrayContaining(['created', 'assigned', 'status_changed', 'work_notes_added', 'resolved', 'reopened', 'closed'])
    );
    // wrong-team access fails both ways
    expect((await call(mike.token, 'get', `/tickets/${mt1Id}`)).status).toBe(403);
    expect((await call(ali.token, 'get', `/tickets/${it1Id}`)).status).toBe(403);
    expect((await call(ali.token, 'put', `/tickets/${it1Id}`, { status_id: r.itClosed.id })).status).toBe(403);

    // ── Step 8: admin can view everything + suggestions, but not manage system
    const adminList = (await call(admin.token, 'get', '/tickets')).body.tickets;
    expect(adminList.map((t) => t.id)).toEqual(expect.arrayContaining([it1Id, it2Id, mt1Id]));
    expect((await call(admin.token, 'get', `/suggestions/${s1Id}`)).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${s1Id}`, { assigned_department_id: 1 })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${s1Id}`, { status_id: r.sUnderReview.id })).status).toBe(200);
    expect((await call(admin.token, 'post', `/suggestions/${s1Id}/comments`, { comment: 'Reviewed - good idea' })).status).toBe(201);
    expect((await call(admin.token, 'get', '/dashboard')).status).toBe(200);

    // admin cannot manage users / departments / categories / roles / settings
    expect((await call(admin.token, 'post', '/users', {
      name: 'X', email: 'x@newleaf.com', password: DEFAULT_PASSWORD, department_id: 1, role_id: 1,
    })).status).toBe(403);
    expect((await call(admin.token, 'post', '/admin/departments', { name: 'New Dept' })).status).toBe(403);
    expect((await call(admin.token, 'post', '/admin/categories', { name: 'New', type: 'it' })).status).toBe(403);
    expect((await call(admin.token, 'post', '/admin/roles', { name: 'new_role' })).status).toBe(403);
    expect((await call(admin.token, 'get', '/admin/settings')).status).toBe(403);

    // ── Step 9: sys_admin manages the system ─────────────────────────────────
    expect((await call(sys.token, 'get', '/admin/settings')).status).toBe(200);
    expect((await call(sys.token, 'put', '/admin/settings/system_name', { value: 'NL ops' })).status).toBe(200);

    const createdUser = await call(sys.token, 'post', '/users', {
      name: 'New Sysuser', email: 'new.user@newleaf.com', password: DEFAULT_PASSWORD,
      employee_id: 'EMP-111', department_id: 1, role_id: 1,
    });
    expect(createdUser.status).toBe(201);
    // validation on user creation
    expect((await call(sys.token, 'post', '/users', {
      name: 'Bad', email: 'bad@newleaf.com', password: 'short', department_id: 1, role_id: 1,
    })).status).toBe(400);

    const usersList = (await call(sys.token, 'get', '/users')).body;
    expect(usersList.some((u) => u.email === 'new.user@newleaf.com')).toBe(true);

    const newDept = await call(sys.token, 'post', '/admin/departments', { name: 'Security' });
    expect(newDept.status).toBe(201);
    const newCat = await call(sys.token, 'post', '/admin/categories', { name: 'Biometrics', type: 'it' });
    expect(newCat.status).toBe(201);
    const newRole = await call(sys.token, 'post', '/admin/roles', { name: 'temp_role_x' });
    expect(newRole.status).toBe(201);
    expect((await call(sys.token, 'post', '/admin/roles', { name: 'staff' })).status).toBe(400); // duplicate
    // role in use cannot be deleted
    expect((await call(sys.token, 'delete', `/admin/roles/${newRole.body.id}`)).status).toBe(200);

    // ── Step 10: reference data is readable by all; management lists are not ─
    expect((await call(staff.token, 'get', '/admin/categories')).status).toBe(200);
    expect((await call(mike.token, 'get', '/admin/statuses?type=it')).status).toBe(200);
    expect((await call(doctor.token, 'get', '/admin/priorities')).status).toBe(200);
    expect((await call(staff.token, 'get', '/admin/departments')).status).toBe(403);
    expect((await call(mike.token, 'get', '/admin/roles')).status).toBe(403);
    expect((await call(staff.token, 'get', '/users')).status).toBe(403);
    expect((await call(mike.token, 'get', '/users')).status).toBe(403);
    expect((await call(staff.token, 'get', '/admin/activity-logs')).status).toBe(403);

    // ── Step 11: dashboards are role-scoped (no cross-role leakage) ──────────
    const staffDash = (await call(staff.token, 'get', '/dashboard')).body;
    expect(staffDash.totalTickets).toBe(2); // IT1 + MT1 (own)
    expect(staffDash.itCount).toBe(1);
    expect(staffDash.mCount).toBe(1);

    const mikeDash = (await call(mike.token, 'get', '/dashboard')).body;
    expect(mikeDash.totalTickets).toBe(1); // only the ticket assigned to Mike
    expect(mikeDash.itCount).toBe(1);

    const adminDash = (await call(admin.token, 'get', '/dashboard')).body;
    expect(adminDash.totalTickets).toBe(3);
  }, 60000);

  it('exposes only non-sensitive settings to any signed-in user', async () => {
    const staff = await loginAs('staff');
    const sys = await loginAs('sys_admin');

    const publicKeys = [
      'system_name', 'hospital_name', 'hospital_address', 'hospital_phone', 'hospital_email',
      'appearance_accent', 'appearance_density', 'appearance_show_requester',
    ];

    for (const session of [staff, sys]) {
      const res = await call(session.token, 'get', '/admin/public-settings');
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).every((k) => publicKeys.includes(k))).toBe(true);
      // Administrator-level settings never leak to the public payload.
      expect(res.body).not.toHaveProperty('multimedia_allow_it_staff_commands');
      expect(res.body).not.toHaveProperty('multimedia_device_limit');
    }

    // Unauthenticated callers get nothing.
    expect((await call(null, 'get', '/admin/public-settings')).status).toBe(401);
  });

  it('rejects requests without a token (401) on protected routes', async () => {
    const paths = [
      '/tickets', '/tickets/1', '/suggestions', '/dashboard',
      '/notifications', '/users', '/admin/categories', '/admin/departments',
    ];
    for (const p of paths) {
      const res = await call(null, 'get', p);
      expect(res.status).toBe(401);
    }
  });

  it('rejects an invalid/tampered token everywhere (401)', async () => {
    const r = await call('malformed.token.value', 'get', '/tickets');
    expect(r.status).toBe(401);
  });
});