import { useSQLiteContext } from 'expo-sqlite';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { type AppSettings, DEFAULT_SETTINGS, getSettings, saveSettings } from '@/db/settings';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AppSettingsValue {
  settings: AppSettings;
  /** Persist a full settings object and apply it app-wide. */
  save: (next: AppSettings) => Promise<void>;
  /** Re-read settings from the database (e.g. after erase-all-data). */
  reload: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsValue>({
  settings: DEFAULT_SETTINGS,
  save: async () => {},
  reload: async () => {},
});

/** Loads settings once and shares them app-wide; saving applies instantly everywhere. */
export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let live = true;
    getSettings(db).then((loaded) => {
      if (live) setSettings(loaded);
    });
    return () => {
      live = false;
    };
  }, [db]);

  const save = useCallback(
    async (next: AppSettings) => {
      setSettings(next);
      await saveSettings(db, next);
    },
    [db]
  );

  const reload = useCallback(async () => {
    setSettings(await getSettings(db));
  }, [db]);

  const value = useMemo(() => ({ settings, save, reload }), [settings, save, reload]);
  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsValue {
  return useContext(AppSettingsContext);
}

/** The effective color scheme: the user's preference, falling back to the OS. */
export function useAppColorScheme(): 'light' | 'dark' {
  const { settings } = useAppSettings();
  const system = useColorScheme();
  if (settings.theme !== 'system') return settings.theme;
  return system === 'dark' ? 'dark' : 'light';
}
