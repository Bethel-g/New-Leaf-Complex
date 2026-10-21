import { describe, it, expect } from 'vitest';
import db from '../src/config/db.js';
import { request, login, loginAs, ROLES, DEFAULT_PASSWORD } from './helpers.mjs';

describe('Authentication', () => {
  describe('POST /api/auth/login', () => {
    it('logs in every seeded role with valid credentials', async () => {
      for (const role of Object.keys(ROLES)) {
        const r = await request
          .post('/api/auth/login')
          .send({ email: ROLES[role], password: DEFAULT_PASSWORD });
        expect(r.status).toBe(200);
        expect(r.body.token).toBeTruthy();
        expect(r.body.user.role_name).toBe(role);
        expect(r.body.user.password).toBeUndefined();
      }
    });

    it('rejects a wrong password', async () => {
      const r = await request
        .post('/api/auth/login')
        .send({ email: ROLES.staff, password: 'wrong-password' });
      expect(r.status).toBe(401);
      expect(r.body.message).toMatch(/invalid credentials/i);
    });

    it('rejects an unknown email', async () => {
      const r = await request
        .post('/api/auth/login')
        .send({ email: 'nobody@newleaf.com', password: DEFAULT_PASSWORD });
      expect(r.status).toBe(401);
    });

    it('rejects a deactivated account', async () => {
      const sysAdmin = await login(ROLES.sys_admin);
      const created = await request
        .post('/api/users')
        .set('Authorization', `Bearer ${sysAdmin.token}`)
        .send({
          name: 'Temp Disabled', email: 'tmp.disabled@newleaf.com',
          password: DEFAULT_PASSWORD, employee_id: 'EMP-999',
          department_id: 1, role_id: 1,
        });
      expect(created.status).toBe(201);
      const userId = created.body.id;

      await request
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${sysAdmin.token}`)
        .send({ is_active: false });

      const disabled = await request
        .post('/api/auth/login')
        .send({ email: 'tmp.disabled@newleaf.com', password: DEFAULT_PASSWORD });
      expect(disabled.status).toBe(401);
      expect(disabled.body.message).toMatch(/deactivated/i);
    });

    it('validates input (missing/invalid fields → 400)', async () => {
      const missing = await request.post('/api/auth/login').send({ email: ROLES.staff });
      expect(missing.status).toBe(400);

      const badEmail = await request
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: DEFAULT_PASSWORD });
      expect(badEmail.status).toBe(400);

      const emptyPassword = await request
        .post('/api/auth/login')
        .send({ email: ROLES.staff, password: '' });
      expect(emptyPassword.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out a valid session', async () => {
      const { token } = await loginAs('staff');
      const r = await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(200);
    });

    it('logout is idempotent / never fails', async () => {
      const r = await request.post('/api/auth/logout');
      expect(r.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user without the password hash', async () => {
      const { token, user } = await loginAs('staff');
      const r = await request.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(200);
      expect(r.body.id).toBe(user.id);
      expect(r.body.role_name).toBe('staff');
      expect(r.body.password).toBeUndefined();
    });

    it('rejects requests without a token', async () => {
      const r = await request.get('/api/auth/me');
      expect(r.status).toBe(401);
    });

    it('rejects an invalid or tampered token', async () => {
      const r = await request.get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
      expect(r.status).toBe(401);
    });

    it('rejects a token issued to a user who was later deactivated', async () => {
      const { token } = await loginAs('it_staff');
      await db('users').where('email', ROLES.it_staff).update({ is_active: false });
      const r = await request.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(401);
      await db('users').where('email', ROLES.it_staff).update({ is_active: true });
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('requires authentication', async () => {
      const r = await request
        .post('/api/auth/change-password')
        .send({ current_password: DEFAULT_PASSWORD, new_password: 'NewPass!234' });
      expect(r.status).toBe(401);
    });

    it('enforces password rules and rotates the password', async () => {
      const { token } = await loginAs('staff');

      const wrongCurrent = await request
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: 'totally-wrong', new_password: 'NewPass!234' });
      expect(wrongCurrent.status).toBe(400);

      const tooShort = await request
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: DEFAULT_PASSWORD, new_password: 'short' });
      expect(tooShort.status).toBe(400);

      const ok = await request
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: DEFAULT_PASSWORD, new_password: 'NewPass!234' });
      expect(ok.status).toBe(200);

      const oldPasswordLogin = await request
        .post('/api/auth/login')
        .send({ email: ROLES.staff, password: DEFAULT_PASSWORD });
      expect(oldPasswordLogin.status).toBe(401);

      const newPasswordLogin = await request
        .post('/api/auth/login')
        .send({ email: ROLES.staff, password: 'NewPass!234' });
      expect(newPasswordLogin.status).toBe(200);

      // restore the fixture password for the rest of the suite
      await request
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${newPasswordLogin.body.token}`)
        .send({ current_password: 'NewPass!234', new_password: DEFAULT_PASSWORD });
    });
  });
});