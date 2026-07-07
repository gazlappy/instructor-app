import { useSQLiteContext } from 'expo-sqlite';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getSettings, saveSetting, type ThemePreference } from '@/db/settings';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ThemePreferenceValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceValue>({
  preference: 'system',
  setPreference: () => {},
});

/** Loads the stored theme preference and lets the Settings screen change it live. */
export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let live = true;
    getSettings(db).then((settings) => {
      if (live) setPreferenceState(settings.theme);
    });
    return () => {
      live = false;
    };
  }, [db]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      saveSetting(db, 'theme', next);
    },
    [db]
  );

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference(): ThemePreferenceValue {
  return useContext(ThemePreferenceContext);
}

/** The effective color scheme: the user's preference, falling back to the OS. */
export function useAppColorScheme(): 'light' | 'dark' {
  const { preference } = useThemePreference();
  const system = useColorScheme();
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
