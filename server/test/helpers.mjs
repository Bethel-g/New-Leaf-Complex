import * as supertestModule from 'supertest';
import createApp from '../src/app.js';

const supertest = supertestModule.default || supertestModule;

const app = createApp();
// supertest(app) → a Test base exposing .get/.post/.put/.delete/...
const request = supertest(app);

const ROLES = {
  staff: 'fatima.nurse@newleaf.com',
  it_staff: 'mike.tech@newleaf.com',
  it_supervisor: 'john.it@newleaf.com',
  maintenance_staff: 'ali.maint@newleaf.com',
  maintenance_supervisor: 'ahmed.maint@newleaf.com',
  admin: 'hospital.admin@newleaf.com',
  sys_admin: 'admin@newleaf.com',
};

const DEFAULT_PASSWORD = 'password123';

async function login(email, password = DEFAULT_PASSWORD) {
  const res = await request.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login(${email}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function loginAs(role) {
  return login(ROLES[role]);
}

function call(token, method, url, body) {
  const target = request[method];
  if (!target) throw new Error(`Unsupported method: ${method}`);
  const path = url.startsWith('/api') ? url : `/api${url}`;
  const r = target.call(request, path);
  if (token) r.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) r.send(body);
  return r;
}

export { app, request, ROLES, DEFAULT_PASSWORD, login, loginAs, call };