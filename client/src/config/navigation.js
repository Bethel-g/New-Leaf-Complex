/**
 * Single source of truth for the sidebar navigation, driven by role.
 * The backend remains authoritative for authorization; this only shapes the UI.
 *
 * Labels are translation keys — the shell resolves them through the i18n
 * dictionary, so every locale gets its own wording.
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

const GENERAL_DASHBOARD = { to: '/dashboard', icon: 'dashboard', labelKey: 'nav.dashboard' };

const STAFF = [
  {
    titleKey: 'nav.group.general',
    items: [GENERAL_DASHBOARD],
  },
  {
    titleKey: 'nav.group.requests',
    items: [
      { to: '/submit-it', icon: 'it', labelKey: 'nav.newItRequest' },
      { to: '/submit-maintenance', icon: 'maintenance', labelKey: 'nav.newMaintenanceRequest' },
      { to: '/submit-suggestion', icon: 'suggestion', labelKey: 'nav.newSuggestion' },
    ],
  },
  {
    titleKey: 'nav.group.myArea',
    items: [
      { to: '/my-requests', icon: 'my-requests', labelKey: 'nav.myRequests' },
      { to: '/my-suggestions', icon: 'suggestions', labelKey: 'nav.mySuggestions' },
      { to: '/notifications', icon: 'notifications', labelKey: 'nav.notifications' },
    ],
  },
];

function multimediaGroups(canManage) {
  const items = [
    { to: '/multimedia', icon: 'multimedia-dashboard', labelKey: 'nav.multimediaHome' },
    { to: '/multimedia/devices', icon: 'multimedia-devices', labelKey: 'nav.devices' },
    { to: '/multimedia/broadcast', icon: 'multimedia-broadcast', labelKey: 'nav.broadcast' },
    { to: '/multimedia/media', icon: 'multimedia-media', labelKey: 'nav.mediaLibrary' },
    { to: '/multimedia/groups', icon: 'multimedia-groups', labelKey: 'nav.groups' },
    { to: '/multimedia/locations', icon: 'multimedia-locations', labelKey: 'nav.locations' },
    { to: '/multimedia/schedules', icon: 'multimedia-schedules', labelKey: 'nav.schedules' },
    { to: '/multimedia/history', icon: 'multimedia-history', labelKey: 'nav.history' },
    { to: '/multimedia/commands', icon: 'multimedia-commands', labelKey: 'nav.commands' },
  ];
  if (canManage) {
    items.push({ to: '/multimedia/settings', icon: 'multimedia-settings', labelKey: 'nav.settingsAudit' });
  }
  return [{ titleKey: 'nav.group.signage', items }];
}

const IT_TICKETS = [
  {
    titleKey: 'nav.group.general',
    items: [{ ...GENERAL_DASHBOARD, to: '/it' }],
  },
  {
    titleKey: 'nav.group.tickets',
    items: [
      { to: '/it/tickets', icon: 'it-tickets', labelKey: 'nav.itTickets' },
      { to: '/it/my-assigned', icon: 'assigned', labelKey: 'nav.myAssignedTickets' },
    ],
  },
];

const IT = [...IT_TICKETS, ...multimediaGroups(true)];
const IT_STAFF = [...IT_TICKETS, ...multimediaGroups(false)];

const MAINTENANCE = [
  {
    titleKey: 'nav.group.general',
    items: [{ ...GENERAL_DASHBOARD, to: '/maintenance' }],
  },
  {
    titleKey: 'nav.group.tickets',
    items: [
      { to: '/maintenance/tickets', icon: 'maintenance-tickets', labelKey: 'nav.maintenanceTickets' },
      { to: '/maintenance/my-assigned', icon: 'assigned', labelKey: 'nav.myAssignedTickets' },
    ],
  },
];

const ADMIN_BASE = [
  {
    titleKey: 'nav.group.general',
    items: [{ ...GENERAL_DASHBOARD, to: '/admin' }],
  },
  {
    titleKey: 'nav.group.operations',
    items: [
      { to: '/admin/all-requests', icon: 'all-requests', labelKey: 'nav.allRequests' },
      { to: '/it/tickets', icon: 'it-tickets', labelKey: 'nav.itTickets' },
      { to: '/maintenance/tickets', icon: 'maintenance-tickets', labelKey: 'nav.maintenanceTickets' },
    ],
  },
  {
    titleKey: 'nav.group.quality',
    items: [{ to: '/admin/suggestions', icon: 'suggestions', labelKey: 'nav.suggestions' }],
  },
  {
    titleKey: 'nav.group.reporting',
    items: [{ to: '/admin/reports', icon: 'reports', labelKey: 'nav.reports' }],
  },
  ...multimediaGroups(true),
];

const SYS_ADMIN = [
  ...ADMIN_BASE,
  {
    titleKey: 'nav.group.administration',
    items: [
      { to: '/admin/users', icon: 'users', labelKey: 'nav.users' },
      { to: '/admin/departments', icon: 'departments', labelKey: 'nav.departments' },
      { to: '/admin/categories', icon: 'categories', labelKey: 'nav.categories' },
      { to: '/admin/settings', icon: 'settings', labelKey: 'nav.settings' },
      { to: '/admin/activity-log', icon: 'audit', labelKey: 'nav.auditLogs' },
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

export function getNavLabelKeys(role) {
  return getNavGroups(role).flatMap((g) => g.items.map((i) => i.labelKey));
}
