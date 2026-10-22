/**
 * Verifies that getNavGroups returns the correct per-role sidebar navigation
 * and that every navigation label resolves in the translation dictionaries.
 * Run: node scripts/verify-nav.mjs
 */
import { getNavGroups, getNavLabelKeys, ROLE_HOME, NAV_ICONS } from '../src/config/navigation.js';
import { DICTIONARIES, LOCALES } from '../src/i18n/locales/index.js';

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
  return [...getNavLabelKeys(role)];
}

function has(role, key) {
  return labels(role).includes(key);
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
  assert(has(r, 'nav.dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'nav.newItRequest'), `${r} sees New IT Request`);
  assert(has(r, 'nav.newMaintenanceRequest'), `${r} sees New Maintenance Request`);
  assert(has(r, 'nav.newSuggestion'), `${r} sees New Suggestion`);
  assert(has(r, 'nav.myRequests'), `${r} sees My Requests`);
  assert(has(r, 'nav.notifications'), `${r} sees Notifications`);
  assert(!has(r, 'nav.itTickets'), `${r} does NOT see IT Tickets`);
  assert(!has(r, 'nav.maintenanceTickets'), `${r} does NOT see Maintenance Tickets`);
  assert(!has(r, 'nav.users'), `${r} does NOT see Users`);
  assert(!has(r, 'nav.settings'), `${r} does NOT see Settings`);
});

console.log('\nIT navigation (staff + supervisor)');
['it_staff', 'it_supervisor'].forEach((r) => {
  assert(has(r, 'nav.dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'nav.itTickets'), `${r} sees IT Tickets`);
  assert(has(r, 'nav.myAssignedTickets'), `${r} sees My Assigned Tickets`);
  assert(!has(r, 'nav.allRequests'), `${r} does NOT see All Requests`);
  assert(!has(r, 'nav.suggestions'), `${r} does NOT see Suggestions`);
  assert(!has(r, 'nav.users'), `${r} does NOT see Users`);
  assert(!has(r, 'nav.newItRequest'), `${r} does NOT see New IT Request`);
});

console.log('\nMaintenance navigation (staff + supervisor)');
['maintenance_staff', 'maintenance_supervisor'].forEach((r) => {
  assert(has(r, 'nav.dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'nav.maintenanceTickets'), `${r} sees Maintenance Tickets`);
  assert(has(r, 'nav.myAssignedTickets'), `${r} sees My Assigned Tickets`);
  assert(!has(r, 'nav.itTickets'), `${r} does NOT see IT Tickets`);
  assert(!has(r, 'nav.allRequests'), `${r} does NOT see All Requests`);
  assert(!has(r, 'nav.users'), `${r} does NOT see Users`);
  assert(!has(r, 'nav.newMaintenanceRequest'), `${r} does NOT see New Maintenance Request`);
});

console.log('\nAdmin navigation');
['admin'].forEach((r) => {
  assert(has(r, 'nav.dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'nav.allRequests'), `${r} sees All Requests`);
  assert(has(r, 'nav.itTickets'), `${r} sees IT Tickets`);
  assert(has(r, 'nav.maintenanceTickets'), `${r} sees Maintenance Tickets`);
  assert(has(r, 'nav.suggestions'), `${r} sees Suggestions`);
  assert(has(r, 'nav.reports'), `${r} sees Reports`);
  assert(!has(r, 'nav.users'), `${r} does NOT see Users`);
  assert(!has(r, 'nav.settings'), `${r} does NOT see Settings`);
  assert(!has(r, 'nav.auditLogs'), `${r} does NOT see Audit Logs`);
  assert(!has(r, 'nav.myAssignedTickets'), `${r} does NOT see My Assigned Tickets`);
});

console.log('\nSys Admin navigation');
['sys_admin'].forEach((r) => {
  assert(has(r, 'nav.dashboard'), `${r} sees Dashboard`);
  assert(has(r, 'nav.allRequests'), `${r} sees All Requests`);
  assert(has(r, 'nav.itTickets'), `${r} sees IT Tickets`);
  assert(has(r, 'nav.maintenanceTickets'), `${r} sees Maintenance Tickets`);
  assert(has(r, 'nav.suggestions'), `${r} sees Suggestions`);
  assert(has(r, 'nav.reports'), `${r} sees Reports`);
  assert(has(r, 'nav.users'), `${r} sees Users`);
  assert(has(r, 'nav.departments'), `${r} sees Departments`);
  assert(has(r, 'nav.categories'), `${r} sees Categories`);
  assert(has(r, 'nav.settings'), `${r} sees Settings`);
  assert(has(r, 'nav.auditLogs'), `${r} sees Audit Logs`);
});

console.log('\nEvery nav item uses a known icon key');
const knownIcons = new Set(Object.keys(NAV_ICONS));
for (const role of Object.keys(ROLE_HOME)) {
  for (const { items } of getNavGroups(role)) {
    for (const item of items) {
      assert(knownIcons.has(item.icon), `${role} item "${item.labelKey}" has known icon "${item.icon}"`);
    }
  }
}

console.log('\nEvery role has a non-empty navigation');
for (const role of Object.keys(ROLE_HOME)) {
  assert(getNavGroups(role).length > 0, `${role} has navigation groups`);
}

console.log('\nEvery navigation label is translated in every locale');
for (const locale of LOCALES) {
  const table = DICTIONARIES[locale.code] || {};
  for (const role of Object.keys(ROLE_HOME)) {
    for (const group of getNavGroups(role)) {
      assert(
        typeof table[group.titleKey] === 'string' && table[group.titleKey].length > 0,
        `${locale.code}: group "${group.titleKey}" is translated`,
      );
      for (const item of group.items) {
        assert(
          typeof table[item.labelKey] === 'string' && table[item.labelKey].length > 0,
          `${locale.code}: ${role} label "${item.labelKey}" is translated`,
        );
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log('\nAll navigation checks passed');
