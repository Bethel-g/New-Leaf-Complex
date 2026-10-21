export const MANAGE_ROLES = ['it_supervisor', 'admin', 'sys_admin'];

export const DEVICE_STATUS_COLORS = {
  online: 'green',
  offline: 'red',
  playing: 'blue',
  idle: 'gray',
  error: 'orange',
  disabled: 'gray',
};

export const PLAYBACK_STATUS_COLORS = {
  success: 'green',
  failed: 'red',
  offline: 'orange',
  pending: 'yellow',
  not_supported: 'gray',
  sent: 'blue',
  online: 'green',
};

export function deviceStatusColor(status) {
  return DEVICE_STATUS_COLORS[status] || 'gray';
}

export const MEDIA_STATUS_COLORS = {
  draft: 'gray',
  active: 'green',
  archived: 'orange',
};

export function mediaStatusColor(status) {
  return MEDIA_STATUS_COLORS[status] || 'gray';
}

export function playbackStatusColor(status) {
  return PLAYBACK_STATUS_COLORS[status] || 'gray';
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isManageRole(role) {
  return MANAGE_ROLES.includes(role);
}