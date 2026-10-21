import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { APPEARANCE_DEFAULTS } from '../config/appearance';

const SettingsContext = createContext({
  publicSettings: {},
  appearance: APPEARANCE_DEFAULTS,
  refresh: () => {},
});

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [publicSettings, setPublicSettings] = useState({});

  const refresh = useCallback(() => {
    if (!user) return;
    api.get('/admin/public-settings')
      .then((res) => setPublicSettings(res.data || {}))
      .catch(() => {});
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const accent = publicSettings.appearance_accent || APPEARANCE_DEFAULTS.accent;
  const density = publicSettings.appearance_density || APPEARANCE_DEFAULTS.density;
  const showRequester = (publicSettings.appearance_show_requester ?? String(APPEARANCE_DEFAULTS.showRequester)) !== 'false';

  // Appearance is applied to the document root so plain CSS overrides in
  // src/index.css restyle the Tailwind palette tokens and density scale.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', accent);
    root.setAttribute('data-density', density);
  }, [accent, density]);

  return (
    <SettingsContext.Provider
      value={{
        publicSettings,
        appearance: { accent, density, showRequester },
        refresh,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useSettings() {
  return useContext(SettingsContext);
}
