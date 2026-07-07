import { type SQLiteDatabase } from 'expo-sqlite';

import type { LessonType } from './types';

export type ThemePreference = 'system' | 'light' | 'dark';
export type WeekStart = 'monday' | 'sunday';
export type StudentSort = 'name' | 'nextLesson';

export interface AppSettings {
  schoolName: string;
  theme: ThemePreference;
  weekStart: WeekStart;
  use12HourTime: boolean;

  defaultDurationMinutes: number;
  defaultLessonType: LessonType;
  /** First bookable slot of the day, minutes past midnight. */
  dayStartMinutes: number;
  /** Last bookable slot of the day, minutes past midnight. */
  dayEndMinutes: number;
  /** Granularity of bookable time slots. */
  slotIntervalMinutes: number;
  /** Hide cancelled and no-show lessons on the schedule. */
  hideCancelled: boolean;

  currency: string;
  hourlyRate: number;

  studentSort: StudentSort;
  showPassedStudents: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  schoolName: '',
  theme: 'system',
  weekStart: 'monday',
  use12HourTime: false,

  defaultDurationMinutes: 60,
  defaultLessonType: 'lesson',
  dayStartMinutes: 6 * 60, // 06:00
  dayEndMinutes: 21 * 60 + 30, // 21:30
  slotIntervalMinutes: 30,
  hideCancelled: false,

  currency: '£',
  hourlyRate: 35,

  studentSort: 'name',
  showPassedStudents: true,
};

export async function getSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const num = (key: keyof AppSettings): number => {
    const parsed = Number(stored[key]);
    return Number.isFinite(parsed) ? parsed : (DEFAULT_SETTINGS[key] as number);
  };
  const bool = (key: keyof AppSettings): boolean =>
    key in stored ? stored[key] === 'true' : (DEFAULT_SETTINGS[key] as boolean);
  const oneOf = <T extends string>(key: keyof AppSettings, values: readonly T[]): T => {
    const value = stored[key] as T | undefined;
    return value !== undefined && values.includes(value) ? value : (DEFAULT_SETTINGS[key] as T);
  };

  return {
    schoolName: stored.schoolName ?? DEFAULT_SETTINGS.schoolName,
    theme: oneOf('theme', ['system', 'light', 'dark']),
    weekStart: oneOf('weekStart', ['monday', 'sunday']),
    use12HourTime: bool('use12HourTime'),

    defaultDurationMinutes: num('defaultDurationMinutes'),
    defaultLessonType: oneOf('defaultLessonType', ['lesson', 'mock_test', 'driving_test']),
    dayStartMinutes: num('dayStartMinutes'),
    dayEndMinutes: num('dayEndMinutes'),
    slotIntervalMinutes: num('slotIntervalMinutes'),
    hideCancelled: bool('hideCancelled'),

    currency: stored.currency ?? DEFAULT_SETTINGS.currency,
    hourlyRate: num('hourlyRate'),

    studentSort: oneOf('studentSort', ['name', 'nextLesson']),
    showPassedStudents: bool('showPassedStudents'),
  };
}

export async function saveSettings(db: SQLiteDatabase, settings: AppSettings): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
      key,
      String(value)
    );
  }
}

/** Lesson duration choices offered in forms and settings. */
export const DURATION_OPTIONS = [30, 45, 60, 90, 120];

export const CURRENCY_OPTIONS = ['£', '€', '$'];

export const HOURLY_RATE_OPTIONS = Array.from({ length: 141 }, (_, i) => 10 + i); // 10–150

export const SLOT_INTERVAL_OPTIONS = [15, 30, 60];
