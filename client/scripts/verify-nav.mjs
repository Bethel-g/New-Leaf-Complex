/**
 * Verifies that getNavGroups returns the correct per-role sidebar navigation.
 * Run: node scripts/verify-nav.mjs
 */
import { getNavGroups, getNavLabels, ROLE_HOME, NAV_ICONS } from '../src/config/navigation.js';

let failures = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  PASS  ${msg}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${msg}`);
  }
}

function labels(role) {
  return [...getNavLabels(role)];
}

function has(role, label) {
  return labels(role).includes(label);
}

console.log('Role home routes');
for (const [role, home] of [
  ['staff', '/dashboard'],
  ['it_staff', '/it'],
  ['it_supervisor', '/it'],
  ['maintenance_staff', '/maintenance'],
  ['maintenance_supervisor', '/maintenance'],
  ['admin', '/admin'],
  ['sys_admin', '/admin'],
]) {
  assert(ROLE_HOME[role] === home, `${role} home -> ${home}`);
}

console.log('\nStaff navigation');
['staff'].forEach((r) => {
  assert(has(r, 'Dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'New IT Request'), `${r} sees New IT Request`);
  assert(has(r, 'New Maintenance Request'), `${r} sees New Maintenance Request`);
  assert(has(r, 'New Suggestion'), `${r} sees New Suggestion`);
  assert(has(r, 'My Requests'), `${r} sees My Requests`);
  assert(has(r, 'Notifications'), `${r} sees Notifications`);
  assert(!has(r, 'IT Tickets'), `${r} does NOT see IT Tickets`);
  assert(!has(r, 'Maintenance Tickets'), `${r} does NOT see Maintenance Tickets`);
  assert(!has(r, 'Users'), `${r} does NOT see Users`);
  assert(!has(r, 'Settings'), `${r} does NOT see Settings`);
});

console.log('\nIT navigation (staff + supervisor)');
['it_staff', 'it_supervisor'].forEach((r) => {
  assert(has(r, 'Dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'IT Tickets'), `${r} sees IT Tickets`);
  assert(has(r, 'My Assigned Tickets'), `${r} sees My Assigned Tickets`);
  assert(!has(r, 'All Requests'), `${r} does NOT see All Requests`);
  assert(!has(r, 'Suggestions'), `${r} does NOT see Suggestions`);
  assert(!has(r, 'Users'), `${r} does NOT see Users`);
  assert(!has(r, 'New IT Request'), `${r} does NOT see New IT Request`);
});

console.log('\nMaintenance navigation (staff + supervisor)');
['maintenance_staff', 'maintenance_supervisor'].forEach((r) => {
  assert(has(r, 'Dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'Maintenance Tickets'), `${r} sees Maintenance Tickets`);
  assert(has(r, 'My Assigned Tickets'), `${r} sees My Assigned Tickets`);
  assert(!has(r, 'IT Tickets'), `${r} does NOT see IT Tickets`);
  assert(!has(r, 'All Requests'), `${r} does NOT see All Requests`);
  assert(!has(r, 'Users'), `${r} does NOT see Users`);
  assert(!has(r, 'New Maintenance Request'), `${r} does NOT see New Maintenance Request`);
});

console.log('\nAdmin navigation');
['admin'].forEach((r) => {
  assert(has(r, 'Dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'All Requests'), `${r} sees All Requests`);
  assert(has(r, 'IT Tickets'), `${r} sees IT Tickets`);
  assert(has(r, 'Maintenance Tickets'), `${r} sees Maintenance Tickets`);
  assert(has(r, 'Suggestions'), `${r} sees Suggestions`);
  assert(has(r, 'Reports'), `${r} sees Reports`);
  assert(!has(r, 'Users'), `${r} does NOT see Users`);
  assert(!has(r, 'Settings'), `${r} does NOT see Settings`);
  assert(!has(r, 'Audit Logs'), `${r} does NOT see Audit Logs`);
  assert(!has(r, 'My Assigned Tickets'), `${r} does NOT see My Assigned Tickets`);
});

console.log('\nSys Admin navigation');
['sys_admin'].forEach((r) => {
  assert(has(r, 'Dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'All Requests'), `${r} sees All Requests`);
  assert(has(r, 'IT Tickets'), `${r} sees IT Tickets`);
  assert(has(r, 'Maintenance Tickets'), `${r} sees Maintenance Tickets`);
  assert(has(r, 'Suggestions'), `${r} sees Suggestions`);
  assert(has(r, 'Reports'), `${r} sees Reports`);
  assert(has(r, 'Users'), `${r} sees Users`);
  assert(has(r, 'Departments'), `${r} sees Departments`);
  assert(has(r, 'Categories'), `${r} sees Categories`);
  assert(has(r, 'Settings'), `${r} sees Settings`);
  assert(has(r, 'Audit Logs'), `${r} sees Audit Logs`);
});

console.log('\nEvery nav item uses a known icon key');
const knownIcons = new Set(Object.keys(NAV_ICONS));
for (const role of Object.keys(ROLE_HOME)) {
  for (const { items } of getNavGroups(role)) {
    for (const item of items) {
      assert(knownIcons.has(item.icon), `${role} item "${item.label}" has known icon "${item.icon}"`);
    }
  }
}

console.log('\nEvery role has a non-empty navigation');
for (const role of Object.keys(ROLE_HOME)) {
  assert(getNavGroups(role).length > 0, `${role} has navigation groups`);
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log('\nAll navigation checks passed');