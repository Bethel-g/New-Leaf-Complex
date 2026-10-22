import { createFormatters, getActiveLang, statusLabel, translate } from '../../i18n';

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
  const { formatDateTime: fmt } = createFormatters(getActiveLang());
  return fmt(iso, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
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

// Module-level translator for helpers that run outside a React render.
const t = (key, vars) => translate(getActiveLang(), key, vars);

/**
 * Statuses that the shared `status.*` dictionary does not cover. Everything
 * else is resolved through `statusLabel`, so the two never drift apart.
 */
const STATUS_KEYS = {
  error: 'multimedia.status.error',
  success: 'multimedia.status.success',
};

export function statusText(status, translateFn = t) {
  if (!status) return '';
  const key = STATUS_KEYS[status];
  return key ? translateFn(key) : statusLabel(status, translateFn);
}

const ACTION_KEYS = {
  play: 'multimedia.action.play',
  stop: 'multimedia.action.stop',
  broadcast: 'multimedia.action.broadcast',
  schedule_start: 'multimedia.action.scheduleStart',
  schedule_stop: 'multimedia.action.scheduleStop',
  heartbeat_online: 'multimedia.action.heartbeatOnline',
  heartbeat_offline: 'multimedia.action.heartbeatOffline',
};

export function actionText(action, translateFn = t) {
  if (!action) return '';
  const key = ACTION_KEYS[action];
  return key ? translateFn(key) : String(action);
}

const CATEGORY_KEYS = {
  image: 'multimedia.media.form.category.image',
  announcement: 'multimedia.media.form.category.announcement',
  safety: 'multimedia.media.form.category.safety',
  awareness: 'multimedia.media.form.category.awareness',
  event: 'multimedia.media.form.category.event',
  video: 'multimedia.media.form.category.video',
  other: 'multimedia.media.form.category.other',
};

export function categoryText(category, translateFn = t) {
  if (!category) return '';
  const key = CATEGORY_KEYS[category];
  return key ? translateFn(key) : String(category);
}

const LEVEL_KEYS = {
  campus: 'multimedia.locations.level.campus',
  building: 'multimedia.locations.level.building',
  floor: 'multimedia.locations.level.floor',
  ward: 'multimedia.locations.level.ward',
  location: 'multimedia.locations.level.location',
  room: 'multimedia.locations.level.room',
};

export function levelText(level, translateFn = t) {
  if (!level) return '';
  const key = LEVEL_KEYS[level];
  return key ? translateFn(key) : String(level);
}

const CONNECTION_KEYS = {
  wifi: 'multimedia.devices.modal.form.connection.wifi',
  ethernet: 'multimedia.devices.modal.form.connection.ethernet',
};

export function connectionText(connection, translateFn = t) {
  if (!connection) return '';
  const key = CONNECTION_KEYS[connection];
  return key ? translateFn(key) : String(connection);
}