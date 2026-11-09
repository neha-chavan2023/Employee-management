import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useCollection } from '../hooks/useCollection';
import { COLLECTIONS } from '../services/db';
import { DEFAULT_SETTINGS, settingsService } from '../services/settingsService';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const settings = useCollection(COLLECTIONS.SETTINGS, DEFAULT_SETTINGS);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme === 'dark' ? 'dark' : 'light');
  }, [settings.theme]);

  const updateSettings = useCallback((patch) => settingsService.update(patch), []);

  const toggleTheme = useCallback(
    () => settingsService.update({ theme: settings.theme === 'dark' ? 'light' : 'dark' }),
    [settings.theme],
  );

  const value = useMemo(
    () => ({ settings, updateSettings, toggleTheme }),
    [settings, updateSettings, toggleTheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}
