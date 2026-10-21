import { describe, it, expect } from 'vitest';
import db from '../src/config/db.js';
import { request, login, loginAs, call } from './helpers.mjs';

/**
 * Dashboard reporting tests.
 *
 * The database is freshly migrated + seeded by test/setup.js before this file.
 * Every ticket/suggestion below is inserted with an explicit created_at offset
 * (in whole days), so all status/critical/overdue/date-range/avg-resolution
 * expectations below are computed from the SAME deterministic records the API
 * reads — verifying "reports use real database data" and that the dashboard
 * calculations match hand-computed values.
 */

const DAY_MS = 86400000;

async function refs() {
  const cat = async (type, name) => db('categories').where({ type, name }).first();
  const prio = async (name) => db('priorities').where('name', name).first();
  const status = async (type, name) => db('statuses').where({ type, name }).first();
  const user = async (email) => db('users').where('email', email).first();
  return {
    it: {
      Printer: await cat('it', 'Printer'),
      Network: await cat('it', 'Network'),
      Computer: await cat('it', 'Computer'),
      Email: await cat('it', 'Email'),
      'Hospital Software': await cat('it', 'Hospital Software'),
    },
    m: {
      Electrical: await cat('maintenance', 'Electrical'),
      Plumbing: await cat('maintenance', 'Plumbing'),
      'Air Conditioning': await cat('maintenance', 'Air Conditioning'),
      'Medical Equipment': await cat('maintenance', 'Medical Equipment'),
      Water: await cat('maintenance', 'Water'),
      Lighting: await cat('maintenance', 'Lighting'),
    },
    prio: {
      Low: await prio('Low'),
      Medium: await prio('Medium'),
      High: await prio('High'),
      Critical: await prio('Critical'),
    },
    st: {
      itNew: await status('it', 'New'),
      itAssigned: await status('it', 'Assigned'),
      itInProg: await status('it', 'In Progress'),
      itWFI: await status('it', 'Waiting for Information'),
      itResolved: await status('it', 'Resolved'),
      itClosed: await status('it', 'Closed'),
      mNew: await status('maintenance', 'New'),
      mInspection: await status('maintenance', 'Inspection'),
      mInProg: await status('maintenance', 'In Progress'),
      mWaitingParts: await status('maintenance', 'Waiting for Parts'),
      mCompleted: await status('maintenance', 'Completed'),
      mClosed: await status('maintenance', 'Closed'),
      sSubmitted: await status('suggestion', 'Submitted'),
      sUnderReview: await status('suggestion', 'Under Review'),
      sImplemented: await status('suggestion', 'Implemented'),
    },
    u: {
      fatima: await user('fatima.nurse@newleaf.com'),
      omar: await user('omar.doctor@newleaf.com'),
      layla: await user('layla.lab@newleaf.com'),
      mike: await user('mike.tech@newleaf.com'),
      sarah: await user('sarah.tech@newleaf.com'),
      ali: await user('ali.maint@newleaf.com'),
    },
  };
}

async function insertTicket(r, t) {
  const created = new Date(Date.now() - t.age * DAY_MS);
  const [row] = await db('tickets').insert({
    ticket_number: t.num,
    type: t.type,
    requester_id: t.req.id,
    department_id: t.req.department_id,
    category_id: t.cat.id,
    priority_id: t.prio.id,
    status_id: t.st.id,
    assigned_to: t.assign ? t.assign.id : null,
    title: t.title,
    created_at: created,
    updated_at: created,
  }).returning('id');
  const updates = {};
  if (t.resolvedAfter != null) updates.resolved_date = new Date(created.getTime() + t.resolvedAfter * DAY_MS);
  if (t.closedAfter != null) updates.closed_date = new Date(created.getTime() + t.closedAfter * DAY_MS);
  if (Object.keys(updates).length) await db('tickets').where('id', row.id).update(updates);
  return row.id;
}

async function insertSuggestion(r, s) {
  const created = new Date(Date.now() - s.age * DAY_MS);
  const [row] = await db('suggestions').insert({
    suggestion_number: s.num,
    user_id: s.author.id,
    department_id: s.author.department_id,
    title: s.title,
    status_id: s.st.id,
    problem: 'problem',
    proposed_solution: 'solution',
    expected_benefit: 'benefit',
    created_at: created,
    updated_at: created,
  }).returning('id');
  return row.id;
}

describe('Dashboard reporting', () => {
  it('computes role-scoped dashboards from known database records', async () => {
    const r = await refs();

    // ── Deterministic dataset (created_at offsets in days) ───────────────────
    const IT_TICKETS = [
      { num: 'IT-9001', type: 'it', cat: r.it.Printer, prio: r.prio.High, st: r.st.itNew, req: r.u.fatima, age: 0, title: 'Printer offline Ward B' },
      { num: 'IT-9002', type: 'it', cat: r.it.Network, prio: r.prio.Critical, st: r.st.itAssigned, req: r.u.omar, assign: r.u.mike, age: 40, title: 'Network down in ER' },
      { num: 'IT-9003', type: 'it', cat: r.it.Computer, prio: r.prio.Medium, st: r.st.itInProg, req: r.u.layla, assign: r.u.sarah, age: 5, title: 'Slow laboratory PC' },
      { num: 'IT-9004', type: 'it', cat: r.it.Email, prio: r.prio.High, st: r.st.itWFI, req: r.u.fatima, age: 20, title: 'Email not syncing' },
      { num: 'IT-9005', type: 'it', cat: r.it.Computer, prio: r.prio.Low, st: r.st.itResolved, req: r.u.fatima, age: 30, resolvedAfter: 5, title: 'Monitor flicker fixed' },
      { num: 'IT-9006', type: 'it', cat: r.it['Hospital Software'], prio: r.prio.Medium, st: r.st.itClosed, req: r.u.layla, age: 25, closedAfter: 3, title: 'Software password reset' },
    ];

    const MT_TICKETS = [
      { num: 'MT-9001', type: 'maintenance', cat: r.m.Electrical, prio: r.prio.Critical, st: r.st.mNew, req: r.u.fatima, age: 0, title: 'Power trip Ward B' },
      { num: 'MT-9002', type: 'maintenance', cat: r.m.Plumbing, prio: r.prio.Medium, st: r.st.mInspection, req: r.u.omar, age: 40, title: 'Leaking sink ER' },
      { num: 'MT-9003', type: 'maintenance', cat: r.m['Air Conditioning'], prio: r.prio.High, st: r.st.mInProg, req: r.u.layla, assign: r.u.ali, age: 2, title: 'AC not cooling lab' },
      { num: 'MT-9004', type: 'maintenance', cat: r.m['Medical Equipment'], prio: r.prio.Medium, st: r.st.mWaitingParts, req: r.u.fatima, age: 12, title: 'Bed wheels waiting for parts' },
      { num: 'MT-9005', type: 'maintenance', cat: r.m.Water, prio: r.prio.Low, st: r.st.mCompleted, req: r.u.omar, age: 28, resolvedAfter: 3, title: 'Water pipe repaired' },
      { num: 'MT-9006', type: 'maintenance', cat: r.m.Lighting, prio: r.prio.Medium, st: r.st.mClosed, req: r.u.layla, age: 20, closedAfter: 4, title: 'Corridor lights fixed' },
    ];

    const SUGGESTIONS = [
      { num: 'S-9001', author: r.u.fatima, st: r.st.sSubmitted, age: 0, title: 'Hand sanitizer dispensers' },
      { num: 'S-9002', author: r.u.omar, st: r.st.sImplemented, age: 15, title: 'Digital patient queue' },
      { num: 'S-9003', author: r.u.layla, st: r.st.sUnderReview, age: 8, title: 'Lab turnaround dashboard' },
    ];

    for (const t of IT_TICKETS) await insertTicket(r, t);
    for (const t of MT_TICKETS) await insertTicket(r, t);
    for (const s of SUGGESTIONS) await insertSuggestion(r, s);
    // Make IT-9001 the single most-recently-updated record for Fatima.
    await db('tickets').where('ticket_number', 'IT-9001').update({ updated_at: new Date(Date.now() + 60000) });

    // ── Expected values derived from the same records, not the API ──────────
    const ALL_TICKETS = [...IT_TICKETS, ...MT_TICKETS];
    const TERMINAL = ['Resolved', 'Completed', 'Closed'];
    const sla = (t) => (t.prio.name === 'Critical' ? 1 : t.prio.name === 'High' ? 3 : 7);
    const overdue = (t) => !TERMINAL.includes(t.st.name) && t.age > sla(t);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const withinMonth = (age) => Date.now() - age * DAY_MS >= monthStart.getTime();
    const todayAge = 0;

    // ── Admin: everything, all time ─────────────────────────────────────────
    const admin = await loginAs('admin');
    const adash = (await call(admin.token, 'get', '/dashboard')).body;
    expect(adash.totalTickets).toBe(ALL_TICKETS.length); // 12
    expect(adash.itCount).toBe(IT_TICKETS.length);       // 6
    expect(adash.mCount).toBe(MT_TICKETS.length);        // 6
    expect(adash.sCount).toBe(SUGGESTIONS.length);       // 3
    expect(adash.openTickets).toBe(ALL_TICKETS.filter((t) => !TERMINAL.includes(t.st.name) && t.st.name !== 'Closed').length); // 8
    expect(adash.resolvedTickets).toBe(2);
    expect(adash.closedTickets).toBe(2);
    expect(adash.criticalTickets).toBe(2);
    expect(adash.overdueCount).toBe(ALL_TICKETS.filter(overdue).length); // 4
    expect(adash.avgResolutionTimeDays).toBe(4); // (IT-9005: 5d + MT-9005: 3d) / 2

    const deptCounts = Object.fromEntries(adash.byDepartment.map((d) => [d.name, parseInt(d.count, 10)]));
    expect(deptCounts).toMatchObject({ Nursing: 5, Emergency: 3, Laboratory: 4 });
    expect(adash.byCategory.find((c) => c.name === 'Computer')).toMatchObject({ count: '2' });
    expect(adash.itStatusCounts).toEqual({
      New: 1, Assigned: 1, 'In Progress': 1, 'Waiting for Information': 1, Resolved: 1, Closed: 1,
    });
    expect(adash.mStatusCounts).toEqual({
      New: 1, Assigned: 0, Inspection: 1, 'In Progress': 1, 'Waiting for Parts': 1, Completed: 1, Closed: 1,
    });

    // ── IT supervisor: only IT data ─────────────────────────────────────────
    const supIT = await loginAs('it_supervisor');
    const itd = (await call(supIT.token, 'get', '/dashboard')).body;
    expect(itd.totalTickets).toBe(IT_TICKETS.length); // 6
    expect(itd.itCount).toBe(IT_TICKETS.length);
    expect(itd.mCount).toBe(0); // no cross-team leakage
    expect(itd.itCritical).toBe(1);
    expect(itd.itOverdue).toBe(IT_TICKETS.filter(overdue).length); // 2
    expect(itd.unresolvedTickets).toHaveLength(4);
    expect(itd.byCategoryIt[0].name).toBe('Computer'); // count 2 > 1
    // The IT supervisor must not see maintenance categories.
    expect(itd.byCategory.every((c) => Object.keys(r.it).includes(c.name))).toBe(true);

    // ── Maintenance supervisor: only maintenance data ───────────────────────
    const supMT = await loginAs('maintenance_supervisor');
    const mtd = (await call(supMT.token, 'get', '/dashboard')).body;
    expect(mtd.totalTickets).toBe(MT_TICKETS.length); // 6
    expect(mtd.mCount).toBe(MT_TICKETS.length);
    expect(mtd.itCount).toBe(0); // no cross-team leakage
    expect(mtd.mCritical).toBe(1);
    expect(mtd.mOverdue).toBe(MT_TICKETS.filter(overdue).length); // 2
    expect(mtd.mStatusCounts['Waiting for Parts']).toBe(1);
    expect(mtd.unresolvedTickets).toHaveLength(4);

    // ── Staff: own requests + suggestions only ──────────────────────────────
    const fatima = await loginAs('staff');
    const fdash = (await call(fatima.token, 'get', '/dashboard')).body;
    const fatimaTickets = ALL_TICKETS.filter((t) => t.req.email === 'fatima.nurse@newleaf.com');
    expect(fdash.totalTickets).toBe(fatimaTickets.length); // 5
    expect(fdash.itCount).toBe(fatimaTickets.filter((t) => t.type === 'it').length); // 3
    expect(fdash.mCount).toBe(fatimaTickets.filter((t) => t.type === 'maintenance').length); // 2
    expect(fdash.sCount).toBe(1);
    expect(fdash.myOpenRequests).toHaveLength(fatimaTickets.filter((t) => !TERMINAL.includes(t.st.name) && t.st.name !== 'Closed').length); // 4
    expect(fdash.myResolvedRequests).toHaveLength(1); // IT-9005
    expect(fdash.mySuggestions.map((s) => s.suggestion_number)).toEqual(['S-9001']);
    expect(fdash.recentlyUpdated.map((t) => t.ticket_number)[0]).toBe('IT-9001'); // most recently updated
    // No cross-user leakage in staff lists:
    for (const list of [fdash.myOpenRequests, fdash.myResolvedRequests, fdash.recentlyUpdated]) {
      expect(list.every((t) => t.requester_name === 'Fatima Nurse')).toBe(true);
    }

    const doctor = await login('omar.doctor@newleaf.com');
    const ddash = (await call(doctor.token, 'get', '/dashboard')).body;
    expect(ddash.totalTickets).toBe(ALL_TICKETS.filter((t) => t.req.email === 'omar.doctor@newleaf.com').length); // 2
    expect(ddash.sCount).toBe(1);
    expect(ddash.myOpenRequests.every((t) => t.requester_name === 'Omar Doctor')).toBe(true);

    // ── Date filters ─────────────────────────────────────────────────────────
    const dToday = (await call(admin.token, 'get', '/dashboard?period=today')).body;
    expect(dToday.totalTickets).toBe(ALL_TICKETS.filter((t) => t.age === todayAge).length); // 2
    expect(dToday.itCount).toBe(IT_TICKETS.filter((t) => t.age === todayAge).length); // 1
    expect(dToday.mCount).toBe(MT_TICKETS.filter((t) => t.age === todayAge).length); // 1
    expect(dToday.sCount).toBe(SUGGESTIONS.filter((s) => s.age === todayAge).length); // 1
    expect(dToday.criticalTickets).toBe(1); // MT-9001
    expect(dToday.openTickets).toBe(2);

    const dMonth = (await call(admin.token, 'get', '/dashboard?period=month')).body;
    expect(dMonth.itCount).toBe(IT_TICKETS.filter((t) => withinMonth(t.age)).length);
    expect(dMonth.mCount).toBe(MT_TICKETS.filter((t) => withinMonth(t.age)).length);
    expect(dMonth.sCount).toBe(SUGGESTIONS.filter((s) => withinMonth(s.age)).length);
    expect(dMonth.overdueCount).toBe(ALL_TICKETS.filter((t) => withinMonth(t.age) && overdue(t)).length);

    // Custom single-day range for the known MT-9004 creation date.
    const twelveAgo = new Date(Date.now() - 12 * DAY_MS);
    const iso12 = `${twelveAgo.getFullYear()}-${String(twelveAgo.getMonth() + 1).padStart(2, '0')}-${String(twelveAgo.getDate()).padStart(2, '0')}`;
    const dCustom = (await call(admin.token, 'get', `/dashboard?from=${iso12}&to=${iso12}`)).body;
    expect(dCustom.totalTickets).toBe(1);
    expect(dCustom.mCount).toBe(1);
    expect(dCustom.itCount).toBe(0);
    expect(dCustom.byCategory[0].name).toBe('Medical Equipment');

    // Wider custom range (45 days) captures every record; only the known 4 are overdue.
    const iso45 = `${new Date(Date.now() - 45 * DAY_MS).getFullYear()}-${String(new Date(Date.now() - 45 * DAY_MS).getMonth() + 1).padStart(2, '0')}-${String(new Date(Date.now() - 45 * DAY_MS).getDate()).padStart(2, '0')}`;
    const todayIsoDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const d45 = (await call(admin.token, 'get', `/dashboard?from=${iso45}&to=${todayIsoDate}`)).body;
    expect(d45.totalTickets).toBe(ALL_TICKETS.length); // 12
    expect(d45.overdueCount).toBe(4);

    // Last 7 days: only the recent records, none overdue.
    const iso7 = `${new Date(Date.now() - 7 * DAY_MS).getFullYear()}-${String(new Date(Date.now() - 7 * DAY_MS).getMonth() + 1).padStart(2, '0')}-${String(new Date(Date.now() - 7 * DAY_MS).getDate()).padStart(2, '0')}`;
    const d7 = (await call(admin.token, 'get', `/dashboard?from=${iso7}&to=${todayIsoDate}`)).body;
    expect(d7.totalTickets).toBe(ALL_TICKETS.filter((t) => t.age < 7).length); // 4
    expect(d7.overdueCount).toBe(0);
  }, 60000);

  it('requires authentication for the dashboard endpoint', async () => {
    const res = await request.get('/api/dashboard');
    expect(res.status).toBe(401);
  });
});