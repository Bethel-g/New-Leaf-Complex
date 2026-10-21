import { describe, it, expect } from 'vitest';
import db from '../src/config/db.js';
import { loginAs, call } from './helpers.mjs';

const TECH_EMAIL = 'mike.tech@newleaf.com';

async function refs() {
  const status = (name, type) => db('statuses').where({ name, type }).first();
  return {
    itCat: await db('categories').where({ type: 'it' }).first(),
    techId: (await db('users').where('email', TECH_EMAIL).first()).id,
    sAccepted: await status('Accepted', 'suggestion'),
    sImplementation: await status('Implementation', 'suggestion'),
    sImplemented: await status('Implemented', 'suggestion'),
    sClosed: await status('Closed', 'suggestion'),
    sMoreInfo: await status('Needs More Information', 'suggestion'),
    sUnderReview: await status('Under Review', 'suggestion'),
  };
}

/** The most recent notification addressed to `userId` that points at `entity`. */
function entityNotification(userId, entityType, entityId, titleLike) {
  const q = db('notifications').where({ user_id: userId, entity_type: entityType, entity_id: entityId });
  if (titleLike) q.where('title', 'ilike', `%${titleLike}%`);
  return q.orderBy('id', 'desc').first();
}

describe('Notification task links', () => {
  it('opens a linked ticket with its full context and hides other users’ notifications', async () => {
    const r = await refs();
    const requester = await loginAs('staff');
    const tech = await loginAs('it_staff');
    const sup = await loginAs('it_supervisor');

    const created = await call(requester.token, 'post', '/tickets', {
      type: 'it',
      category_id: r.itCat.id,
      title: 'Monitor flickers at bedside',
      description: 'Blinks whenever the bed is raised',
      priority: 'High',
    });
    const ticketId = created.body.id;

    expect((await call(sup.token, 'put', `/tickets/${ticketId}`, { assigned_to: r.techId })).status).toBe(200);

    const assignment = await entityNotification(r.techId, 'ticket', ticketId, 'assigned to you');
    expect(assignment).toBeTruthy();
    expect(assignment.entity_type).toBe('ticket');
    expect(assignment.entity_id).toBe(ticketId);

    const detail = await call(tech.token, 'get', `/notifications/${assignment.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.notification.id).toBe(assignment.id);

    const { ticket, comments, attachments, history, workNotes } = detail.body.task;
    expect(ticket.id).toBe(ticketId);
    expect(ticket.title).toBe('Monitor flickers at bedside');
    expect(ticket.description).toBe('Blinks whenever the bed is raised');
    expect(ticket.status_name).toBeTruthy();
    expect(ticket.priority_name).toBeTruthy();
    expect(ticket.created_at).toBeTruthy();
    expect(ticket.requester_name).toBeTruthy();
    expect(ticket.assigned_to).toBe(r.techId);
    expect(Array.isArray(comments)).toBe(true);
    expect(Array.isArray(attachments)).toBe(true);
    expect(Array.isArray(history)).toBe(true);
    // Internal notes stay with the managing team.
    expect(workNotes).toEqual([]);

    // A manager's own linked notification does include the internal notes.
    const supRow = await db('notifications').insert({
      user_id: sup.user.id,
      title: `Ticket #${ticketId} assigned`,
      message: 'Monitor flickers at bedside',
      entity_type: 'ticket',
      entity_id: ticketId,
    }).returning('id');
    const supDetail = await call(sup.token, 'get', `/notifications/${supRow[0].id}`);
    expect(supDetail.status).toBe(200);
    expect(Array.isArray(supDetail.body.task.workNotes)).toBe(true);
    expect(Array.isArray(supDetail.body.task.statuses)).toBe(true);

    // Nobody can read or answer a notification that is not theirs.
    expect((await call(requester.token, 'get', `/notifications/${assignment.id}`)).status).toBe(404);
    expect((await call(sup.token, 'get', `/notifications/${assignment.id}`)).status).toBe(404);
    expect((await call(requester.token, 'post', `/notifications/${assignment.id}/reply`, { comment: 'not mine' })).status).toBe(404);
  });

  it('records a notification reply as a task comment and notifies the other party', async () => {
    const r = await refs();
    const requester = await loginAs('staff');
    const tech = await loginAs('it_staff');

    const created = await call(requester.token, 'post', '/tickets', {
      type: 'it',
      category_id: r.itCat.id,
      title: 'Nurse call silent',
      description: 'No alert at all',
      priority: 'Medium',
    });
    const ticketId = created.body.id;
    await db('tickets').where('id', ticketId).update({ assigned_to: r.techId });

    const row = await db('notifications').insert({
      user_id: r.techId,
      title: `Ticket #${ticketId} assigned to you`,
      message: 'Nurse call silent',
      entity_type: 'ticket',
      entity_id: ticketId,
    }).returning('id');

    expect((await call(tech.token, 'post', `/notifications/${row[0].id}/reply`, { comment: '   ' })).status).toBe(400);

    const reply = await call(tech.token, 'post', `/notifications/${row[0].id}/reply`, {
      comment: 'Replaced the faulty handset.',
    });
    expect(reply.status).toBe(201);

    const detail = await call(tech.token, 'get', `/notifications/${row[0].id}`);
    expect(detail.body.task.comments.some((c) => c.comment === 'Replaced the faulty handset.')).toBe(true);
    expect(detail.body.task.history.some((h) => h.action === 'comment_added')).toBe(true);

    const counterparty = await entityNotification(requester.user.id, 'ticket', ticketId, 'New comment');
    expect(counterparty).toBeTruthy();
    expect(counterparty.message).toContain('Replaced the faulty handset.');

    // The same comment is visible from the ticket's own page.
    const page = await call(tech.token, 'get', `/tickets/${ticketId}`);
    expect(page.body.comments.some((c) => c.comment === 'Replaced the faulty handset.')).toBe(true);
  });

  it('lets a suggestion assignee follow, comment and deliver it, but not rewrite the workflow', async () => {
    const r = await refs();
    const requester = await loginAs('staff');
    const admin = await loginAs('admin');
    const tech = await loginAs('it_staff');

    const created = await call(requester.token, 'post', '/suggestions', {
      title: 'Shade sails in the courtyard',
      problem: 'Staff and patients overheat at midday',
    });
    const suggestionId = created.body.id;
    const sAssigned = await db('statuses').where({ name: 'Assigned', type: 'suggestion' }).first();

    expect((await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sUnderReview.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sAccepted.id })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${suggestionId}`, { assigned_to: r.techId })).status).toBe(200);
    expect((await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: sAssigned.id })).status).toBe(200);

    const assigned = await entityNotification(r.techId, 'suggestion', suggestionId, 'assigned to you');
    expect(assigned).toBeTruthy();

    const detail = await call(tech.token, 'get', `/notifications/${assigned.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.task.suggestion.id).toBe(suggestionId);
    expect(detail.body.task.suggestion.problem).toBe('Staff and patients overheat at midday');
    expect(detail.body.task.suggestion.status_name).toBe('Assigned');
    expect(detail.body.task.suggestion.assigned_to).toBe(r.techId);
    expect(Array.isArray(detail.body.task.history)).toBe(true);

    // Can answer from the notification.
    expect((await call(tech.token, 'post', `/notifications/${assigned.id}/reply`, { comment: 'Sail order placed.' })).status).toBe(201);
    const authorComment = await entityNotification(requester.user.id, 'suggestion', suggestionId, 'New comment');
    expect(authorComment.message).toContain('Sail order placed.');

    // Delivery steps only: Assigned -> Implementation -> Implemented.
    expect((await call(tech.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sClosed.id })).status).toBe(403);
    expect((await call(tech.token, 'put', `/suggestions/${suggestionId}`, { assigned_to: null })).status).toBe(403);
    expect((await call(tech.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sAccepted.id })).status).toBe(403);
    expect((await call(tech.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sImplementation.id })).status).toBe(200);
    expect((await call(tech.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sImplemented.id })).status).toBe(200);
    // Closing is a review decision, not the assignee's.
    expect((await call(tech.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sClosed.id })).status).toBe(403);

    // The author keeps their narrow information-return transition.
    const second = await call(requester.token, 'post', '/suggestions', {
      title: 'Quiet alarm at night', problem: 'Night monitors wake the whole ward',
    });
    const secondId = second.body.id;
    expect((await call(admin.token, 'put', `/suggestions/${secondId}`, { status_id: r.sMoreInfo.id })).status).toBe(200);
    expect((await call(requester.token, 'put', `/suggestions/${secondId}`, { status_id: r.sClosed.id })).status).toBe(403);
    expect((await call(requester.token, 'put', `/suggestions/${secondId}`, { status_id: r.sUnderReview.id })).status).toBe(200);

    // An unrelated user still cannot see it.
    expect((await call((await loginAs('maintenance_staff')).token, 'get', `/suggestions/${suggestionId}`)).status).toBe(403);
  });

  it('reports the workflow each viewer may apply on a suggestion', async () => {
    const r = await refs();
    const requester = await loginAs('staff');
    const admin = await loginAs('admin');
    const tech = await loginAs('it_staff');

    const created = await call(requester.token, 'post', '/suggestions', {
      title: 'Lockers in the staff room', problem: 'No secure storage for personal items',
    });
    const suggestionId = created.body.id;
    const sAssigned = await db('statuses').where({ name: 'Assigned', type: 'suggestion' }).first();

    // Submitted: reviewers triage it, the author may do nothing yet.
    expect((await call(admin.token, 'get', `/suggestions/${suggestionId}`)).body.suggestion.allowed_statuses).toEqual([
      'Under Review', 'Rejected', 'Needs More Information', 'Already Planned', 'Forwarded to Department',
    ]);
    expect((await call(requester.token, 'get', `/suggestions/${suggestionId}`)).body.suggestion.allowed_statuses).toEqual([]);

    await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sUnderReview.id });
    await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sAccepted.id });
    await call(admin.token, 'put', `/suggestions/${suggestionId}`, { assigned_to: r.techId });
    await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: sAssigned.id });

    // Assigned: the responsible staff member moves it forward, the author waits.
    const techView = await call(tech.token, 'get', `/suggestions/${suggestionId}`);
    expect(techView.body.suggestion.allowed_statuses).toEqual(['Implementation']);
    expect((await call(requester.token, 'get', `/suggestions/${suggestionId}`)).body.suggestion.allowed_statuses).toEqual([]);

    await call(tech.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sImplementation.id });
    const techProgress = await call(tech.token, 'get', `/suggestions/${suggestionId}`);
    expect(techProgress.body.suggestion.allowed_statuses).toEqual(['Implemented', 'Assigned']);

    // Asked for more information: the author may return it to review.
    await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: sAssigned.id });
    await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sAccepted.id });
    await call(admin.token, 'put', `/suggestions/${suggestionId}`, { status_id: r.sMoreInfo.id });
    expect((await call(requester.token, 'get', `/suggestions/${suggestionId}`)).body.suggestion.allowed_statuses).toEqual(['Under Review']);
  });

  it('keeps notifications about removed tasks readable, without a task to answer on', async () => {
    const requester = await loginAs('staff');
    const row = await db('notifications').insert({
      user_id: requester.user.id,
      title: 'Ticket removed',
      message: 'gone',
      entity_type: 'ticket',
      entity_id: 999999,
    }).returning('id');

    const detail = await call(requester.token, 'get', `/notifications/${row[0].id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.notification.title).toBe('Ticket removed');
    expect(detail.body.task).toBeNull();
    expect((await call(requester.token, 'post', `/notifications/${row[0].id}/reply`, { comment: 'anyone there?' })).status).toBe(404);

    const plain = await db('notifications').insert({
      user_id: requester.user.id, title: 'System notice', message: 'maintenance window',
    }).returning('id');
    const plainDetail = await call(requester.token, 'get', `/notifications/${plain[0].id}`);
    expect(plainDetail.status).toBe(200);
    expect(plainDetail.body.task).toBeNull();
    expect((await call(requester.token, 'post', `/notifications/${plain[0].id}/reply`, { comment: 'hi' })).status).toBe(400);
  });
});
