// Appearance settings are stored as `system_settings` rows and exposed by
// GET /admin/public-settings. These defaults mirror the server fallbacks, so an
// empty settings table behaves exactly like the code defaults.
export const APPEARANCE_DEFAULTS = {
  accent: 'blue',
  density: 'comfortable',
  showRequester: true,
};

export const ACCENT_OPTIONS = [
  { value: 'blue', label: 'Medical blue (default)' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'teal', label: 'Teal' },
  { value: 'violet', label: 'Violet' },
];

export const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable (default)' },
  { value: 'compact', label: 'Compact' },
];
