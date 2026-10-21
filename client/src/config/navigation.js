/**
 * Single source of truth for the sidebar navigation, driven by role.
 * The backend remains authoritative for authorization; this only shapes the UI.
 */
import {
  LayoutDashboard, MonitorCog, Wrench, Lightbulb, ClipboardList, Bell, FileText,
  UserCheck, Inbox, BarChart3, Users, FolderOpen, Building2, Settings, ScrollText,
  CalendarClock,
} from 'lucide-react';

// Icon for every navigation key. Kept next to the nav definition so the
// sidebar and the navigation checks can never drift apart.
export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  it: MonitorCog,
  maintenance: Wrench,
  suggestion: Lightbulb,
  'my-requests': ClipboardList,
  notifications: Bell,
  'it-tickets': FileText,
  'maintenance-tickets': Wrench,
  assigned: UserCheck,
  'all-requests': Inbox,
  suggestions: Lightbulb,
  reports: BarChart3,
  users: Users,
  departments: Building2,
  categories: FolderOpen,
  settings: Settings,
  audit: ScrollText,
  'multimedia-dashboard': LayoutDashboard,
  'multimedia-devices': MonitorCog,
  'multimedia-broadcast': ClipboardList,
  'multimedia-media': FolderOpen,
  'multimedia-groups': Users,
  'multimedia-locations': Building2,
  'multimedia-schedules': CalendarClock,
  'multimedia-history': ScrollText,
  'multimedia-commands': FileText,
  'multimedia-settings': Settings,
};

export const ROLE_HOME = {
  staff: '/dashboard',
  it_staff: '/it',
  it_supervisor: '/it',
  maintenance_staff: '/maintenance',
  maintenance_supervisor: '/maintenance',
  admin: '/admin',
  sys_admin: '/admin',
};

const GENERAL_DASHBOARD = { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' };

const STAFF = [
  {
    title: 'General',
    items: [GENERAL_DASHBOARD],
  },
  {
    title: 'Requests',
    items: [
      { to: '/submit-it', icon: 'it', label: 'New IT Request' },
      { to: '/submit-maintenance', icon: 'maintenance', label: 'New Maintenance Request' },
      { to: '/submit-suggestion', icon: 'suggestion', label: 'New Suggestion' },
    ],
  },
  {
    title: 'My Area',
    items: [
      { to: '/my-requests', icon: 'my-requests', label: 'My Requests' },
      { to: '/my-suggestions', icon: 'suggestions', label: 'My Suggestions' },
      { to: '/notifications', icon: 'notifications', label: 'Notifications' },
    ],
  },
];

function multimediaGroups(canManage) {
  const items = [
    { to: '/multimedia', icon: 'multimedia-dashboard', label: 'Multimedia Home' },
    { to: '/multimedia/devices', icon: 'multimedia-devices', label: 'Devices' },
    { to: '/multimedia/broadcast', icon: 'multimedia-broadcast', label: 'Broadcast' },
    { to: '/multimedia/media', icon: 'multimedia-media', label: 'Media Library' },
    { to: '/multimedia/groups', icon: 'multimedia-groups', label: 'Groups' },
    { to: '/multimedia/locations', icon: 'multimedia-locations', label: 'Locations' },
    { to: '/multimedia/schedules', icon: 'multimedia-schedules', label: 'Schedules' },
    { to: '/multimedia/history', icon: 'multimedia-history', label: 'History' },
    { to: '/multimedia/commands', icon: 'multimedia-commands', label: 'Commands' },
  ];
  if (canManage) {
    items.push({ to: '/multimedia/settings', icon: 'multimedia-settings', label: 'Settings & Audit' });
  }
  return [{ title: 'Digital Signage', items }];
}

const IT_TICKETS = [
  {
    title: 'General',
    items: [{ ...GENERAL_DASHBOARD, to: '/it' }],
  },
  {
    title: 'Tickets',
    items: [
      { to: '/it/tickets', icon: 'it-tickets', label: 'IT Tickets' },
      { to: '/it/my-assigned', icon: 'assigned', label: 'My Assigned Tickets' },
    ],
  },
];

const IT = [...IT_TICKETS, ...multimediaGroups(true)];
const IT_STAFF = [...IT_TICKETS, ...multimediaGroups(false)];

const MAINTENANCE = [
  {
    title: 'General',
    items: [{ ...GENERAL_DASHBOARD, to: '/maintenance' }],
  },
  {
    title: 'Tickets',
    items: [
      { to: '/maintenance/tickets', icon: 'maintenance-tickets', label: 'Maintenance Tickets' },
      { to: '/maintenance/my-assigned', icon: 'assigned', label: 'My Assigned Tickets' },
    ],
  },
];

const ADMIN_BASE = [
  {
    title: 'General',
    items: [{ ...GENERAL_DASHBOARD, to: '/admin' }],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/all-requests', icon: 'all-requests', label: 'All Requests' },
      { to: '/it/tickets', icon: 'it-tickets', label: 'IT Tickets' },
      { to: '/maintenance/tickets', icon: 'maintenance-tickets', label: 'Maintenance Tickets' },
    ],
  },
  {
    title: 'Quality',
    items: [{ to: '/admin/suggestions', icon: 'suggestions', label: 'Suggestions' }],
  },
  {
    title: 'Reporting',
    items: [{ to: '/admin/reports', icon: 'reports', label: 'Reports' }],
  },
  ...multimediaGroups(true),
];

const SYS_ADMIN = [
  ...ADMIN_BASE,
  {
    title: 'Administration',
    items: [
      { to: '/admin/users', icon: 'users', label: 'Users' },
      { to: '/admin/departments', icon: 'departments', label: 'Departments' },
      { to: '/admin/categories', icon: 'categories', label: 'Categories' },
      { to: '/admin/settings', icon: 'settings', label: 'Settings' },
      { to: '/admin/activity-log', icon: 'audit', label: 'Audit Logs' },
    ],
  },
];

const NAV_BY_ROLE = {
  staff: STAFF,
  it_staff: IT_STAFF,
  it_supervisor: IT,
  maintenance_staff: MAINTENANCE,
  maintenance_supervisor: MAINTENANCE,
  admin: ADMIN_BASE,
  sys_admin: SYS_ADMIN,
};

export function getNavGroups(role) {
  return NAV_BY_ROLE[role] || STAFF;
}

export function getNavLabels(role) {
  return getNavGroups(role).flatMap((g) => g.items.map((i) => i.label));
}