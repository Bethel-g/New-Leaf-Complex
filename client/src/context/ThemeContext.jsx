import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'nl.theme';

export const THEME_PREFERENCES = ['light', 'dark', 'system'];

function readStoredPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (THEME_PREFERENCES.includes(saved)) return saved;
  } catch {
    /* storage unavailable — fall back to the system preference */
  }
  return 'system';
}

function systemPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const ThemeContext = createContext(null);

/**
 * Personal appearance preference for the signed-in user. The choice is kept in
 * local storage (it is a device preference, not a shared system setting) and
 * mirrored onto <html data-theme> so the CSS token overrides can react to it.
 */
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readStoredPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* ignore */
    }
  }, [theme, preference]);

  const toggleTheme = useCallback(() => {
    setPreference((current) => {
      const effective = current === 'system' ? (systemDark ? 'dark' : 'light') : current;
      return effective === 'dark' ? 'light' : 'dark';
    });
  }, [systemDark]);

  const value = useMemo(
    () => ({ theme, preference, setPreference, toggleTheme }),
    [theme, preference, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside a ThemeProvider');
  return ctx;
}
