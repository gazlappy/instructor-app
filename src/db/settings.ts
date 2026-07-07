import { type SQLiteDatabase } from 'expo-sqlite';

export type ThemePreference = 'system' | 'light' | 'dark';
export type WeekStart = 'monday' | 'sunday';

export interface AppSettings {
  schoolName: string;
  defaultDurationMinutes: number;
  /** First bookable slot of the day, minutes past midnight. */
  dayStartMinutes: number;
  /** Last bookable slot of the day, minutes past midnight. */
  dayEndMinutes: number;
  theme: ThemePreference;
  weekStart: WeekStart;
}

export const DEFAULT_SETTINGS: AppSettings = {
  schoolName: '',
  defaultDurationMinutes: 60,
  dayStartMinutes: 6 * 60, // 06:00
  dayEndMinutes: 21 * 60 + 30, // 21:30
  theme: 'system',
  weekStart: 'monday',
};

export async function getSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const num = (key: keyof AppSettings): number => {
    const parsed = Number(stored[key]);
    return Number.isFinite(parsed) ? parsed : (DEFAULT_SETTINGS[key] as number);
  };
  const theme = stored.theme;
  const weekStart = stored.weekStart;
  return {
    schoolName: stored.schoolName ?? DEFAULT_SETTINGS.schoolName,
    defaultDurationMinutes: num('defaultDurationMinutes'),
    dayStartMinutes: num('dayStartMinutes'),
    dayEndMinutes: num('dayEndMinutes'),
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
    weekStart: weekStart === 'sunday' ? 'sunday' : 'monday',
  };
}

export async function saveSetting<K extends keyof AppSettings>(
  db: SQLiteDatabase,
  key: K,
  value: AppSettings[K]
): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    key,
    String(value)
  );
}

/** Lesson duration choices offered in forms and settings. */
export const DURATION_OPTIONS = [30, 45, 60, 90, 120];
