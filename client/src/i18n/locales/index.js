/**
 * Locale registry.
 *
 * Every domain owns one fragment file that exports `{ en, am }` so English
 * and Amharic always sit side by side and can be reviewed together. The
 * fragments are merged here into one flat dictionary per language.
 */
import shell from './shell.js';
import auth from './auth.js';
import common from './common.js';
import staff from './staff.js';
import it from './it.js';
import maintenance from './maintenance.js';
import admin from './admin.js';
import multimedia from './multimedia.js';

const FRAGMENTS = [shell, auth, common, staff, it, maintenance, admin, multimedia];

export const DEFAULT_LANG = 'en';

export const LOCALES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'am', label: 'አማርኛ', short: 'አማ' },
];

function merge(lang) {
  const merged = {};
  for (const fragment of FRAGMENTS) {
    Object.assign(merged, fragment[lang] || {});
  }
  return merged;
}

export const DICTIONARIES = {
  en: merge('en'),
  am: merge('am'),
};
