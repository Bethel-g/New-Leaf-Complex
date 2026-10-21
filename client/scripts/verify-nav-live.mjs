const nav = await import('../src/config/navigation.js');

const USERS = {
  staff: ['fatima.nurse@newleaf.com', ['Dashboard', 'New IT Request', 'New Maintenance Request', 'New Suggestion', 'My Requests', 'Notifications']],
  it_staff: ['mike.tech@newleaf.com', ['Dashboard', 'IT Tickets', 'My Assigned Tickets']],
  it_supervisor: ['john.it@newleaf.com', ['Dashboard', 'IT Tickets', 'My Assigned Tickets']],
  maintenance_staff: ['ali.maint@newleaf.com', ['Dashboard', 'Maintenance Tickets', 'My Assigned Tickets']],
  maintenance_supervisor: ['ahmed.maint@newleaf.com', ['Dashboard', 'Maintenance Tickets', 'My Assigned Tickets']],
  admin: ['hospital.admin@newleaf.com', ['Dashboard', 'All Requests', 'IT Tickets', 'Maintenance Tickets', 'Suggestions', 'Reports']],
};

const SYS_ADMIN_EXTRA = ['Users', 'Departments', 'Categories', 'Settings', 'Audit Logs'];

async function login(email, password) {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed ${res.status}`);
  return res.json();
}

let failures = 0;
for (const [role, [email, required]] of Object.entries(USERS)) {
  const { user } = await login(email, 'password123');
  const labels = nav.getNavLabels(user.role_name);
  const home = nav.ROLE_HOME[user.role_name];
  const expected = role === 'sys_admin' ? [...required, ...SYS_ADMIN_EXTRA] : required;
  const missing = expected.filter((l) => !labels.includes(l));
  const extra = labels.filter((l) => !expected.includes(l));
  const roleOk = user.role_name === role;
  const status = roleOk && missing.length === 0 && extra.length === 0 ? 'PASS' : 'FAIL';
  if (status === 'FAIL') failures += 1;
  console.log(status === 'PASS' ? `PASS` : `FAIL`, `${email} (server said role=${user.role_name}) home=${home}`);
  console.log('   visible:', labels.join(' | '));
  if (missing.length) console.log('   MISSING:', missing.join(' | '));
  if (extra.length) console.log('   EXTRA  :', extra.join(' | '));
}

console.log('\n>>> live sys_admin check');
const sa = await login('admin@newleaf.com', 'password123');
const saLabels = nav.getNavLabels(sa.user.role_name);
const saExpected = [...USERS.admin[0] === undefined ? [] : Object.entries(USERS).find(([r]) => r === 'admin')[1][1], ...SYS_ADMIN_EXTRA];
const saMissing = saExpected.filter((l) => !saLabels.includes(l));
if (sa.user.role_name !== 'sys_admin' || saMissing.length) {
  failures += 1;
  console.log('FAIL sys_admin:', sa.user.role_name, 'missing', saMissing.join(', '));
} else {
  console.log('PASS admin@newleaf.com (server said role=sys_admin) home=' + nav.ROLE_HOME.sys_admin);
  console.log('   visible:', saLabels.join(' | '));
}

console.log(failures === 0 ? '\nAll live navigation checks passed' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
