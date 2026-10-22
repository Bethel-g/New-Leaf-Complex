import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DICTIONARIES, DEFAULT_LANG, LOCALES } from './locales';

const STORAGE_KEY = 'nl.lang';

/**
 * Look a key up in the active locale, falling back to English and finally to
 * the key itself (so a missing translation is visible but never fatal).
 */
export function translate(lang, key, vars) {
  if (typeof key !== 'string' || !key) return '';
  const table = DICTIONARIES[lang] || {};
  const fallback = DICTIONARIES[DEFAULT_LANG] || {};
  let value = table[key];
  if (value === undefined) value = fallback[key];
  if (value === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing translation for "${key}"`);
    return key;
  }
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match);
}

function readStoredLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTIONARIES[saved]) return saved;
  } catch {
    /* storage unavailable — fall back to the default locale */
  }
  return DEFAULT_LANG;
}

const I18nContext = createContext(null);

let activeLang = readStoredLang();

/**
 * The language currently rendered, for helpers that live outside React
 * (date formatting helpers, for instance).
 */
export function getActiveLang() {
  return activeLang;
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  useEffect(() => {
    activeLang = lang;
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('data-lang', lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (DICTIONARIES[next]) setLangState(next);
  }, []);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      locales: LOCALES,
      statusLabel: (status) => statusLabel(status, t),
      roleLabel: (role) => roleLabel(role, t),
      priorityLabel: (priority) => labelFor('priority', priority, t),
      typeLabel: (type) => labelFor('type', type, t),
      ...createFormatters(lang),
    }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used inside an I18nProvider');
  return ctx;
}

function hasKey(key) {
  const table = DICTIONARIES[DEFAULT_LANG] || {};
  return Object.prototype.hasOwnProperty.call(table, key);
}

function toKeySegment(value) {
  return String(value)
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Translate a workflow status ("Waiting for Information") using its
 * `status.*` dictionary entry, falling back to the raw backend value.
 */
export function statusLabel(status, t) {
  if (!status) return '';
  const key = `status.${toKeySegment(status)}`;
  return hasKey(key) ? t(key) : String(status);
}

/**
 * Translate a role name ("it_staff"), falling back to the raw value.
 */
export function roleLabel(role, t) {
  if (!role) return '';
  const key = `role.${role}`;
  return hasKey(key) ? t(key) : String(role).replace(/_/g, ' ');
}

/**
 * Translate any enumerated value ("High" -> `priority.high`), falling back to
 * the raw value when the dictionary has no entry for it.
 */
export function labelFor(prefix, value, t) {
  if (!value) return '';
  const key = `${prefix}.${toKeySegment(value)}`;
  return hasKey(key) ? t(key) : String(value);
}

/**
 * Locale aware date/number helpers. Amharic keeps the Gregorian calendar so
 * ticket timestamps stay comparable with the backend records.
 */
export function createFormatters(lang) {
  const tag = LOCALE_TAGS[lang] || LOCALE_TAGS[DEFAULT_LANG];
  const toDate = (value) => (value instanceof Date ? value : new Date(value));

  return {
    formatDate: (value, options) => {
      if (!value) return '';
      const date = toDate(value);
      if (Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(tag, options || { dateStyle: 'medium' }).format(date);
    },
    formatDateTime: (value, options) => {
      if (!value) return '';
      const date = toDate(value);
      if (Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(
        tag,
        options || { dateStyle: 'medium', timeStyle: 'short' },
      ).format(date);
    },
    formatNumber: (value, options) => {
      if (value === null || value === undefined || value === '') return '';
      const number = Number(value);
      if (Number.isNaN(number)) return String(value);
      return new Intl.NumberFormat(tag, options).format(number);
    },
  };
}

export const LOCALE_TAGS = {
  en: 'en-GB',
  am: 'am-ET-u-ca-gregory',
};
