import { type SQLiteDatabase } from 'expo-sqlite';

import type { LessonType } from './types';

export type ThemePreference = 'system' | 'light' | 'dark';
export type WeekStart = 'monday' | 'sunday';
export type StudentSort = 'name' | 'nextLesson';

/** A block-booking deal, e.g. 10 hours for £320. */
export interface BlockPrice {
  hours: number;
  price: number;
}

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

  /** Which lesson lengths are offered when booking. */
  durationOptions: number[];

  currency: string;
  hourlyRate: number;
  /** Discounted multi-hour packages. */
  blockPrices: BlockPrice[];

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

  durationOptions: [30, 45, 60, 90, 120],

  currency: '£',
  hourlyRate: 35,
  blockPrices: [],

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
  const numArray = (key: keyof AppSettings): number[] => {
    try {
      const parsed = JSON.parse(stored[key]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((n) => typeof n === 'number')) {
        return parsed;
      }
    } catch {}
    return DEFAULT_SETTINGS[key] as number[];
  };
  const blockPrices = (): BlockPrice[] => {
    try {
      const parsed = JSON.parse(stored.blockPrices);
      if (
        Array.isArray(parsed) &&
        parsed.every((p) => typeof p?.hours === 'number' && typeof p?.price === 'number')
      ) {
        return parsed;
      }
    } catch {}
    return DEFAULT_SETTINGS.blockPrices;
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

    durationOptions: numArray('durationOptions'),

    currency: stored.currency ?? DEFAULT_SETTINGS.currency,
    hourlyRate: num('hourlyRate'),
    blockPrices: blockPrices(),

    studentSort: oneOf('studentSort', ['name', 'nextLesson']),
    showPassedStudents: bool('showPassedStudents'),
  };
}

export async function saveSettings(db: SQLiteDatabase, settings: AppSettings): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
      key,
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    );
  }
}

/** Every lesson length that can be toggled on in Settings. */
export const DURATION_CANDIDATES = [30, 45, 60, 75, 90, 105, 120, 150, 180];

export const CURRENCY_OPTIONS = ['£', '€', '$'];

export const HOURLY_RATE_OPTIONS = Array.from({ length: 141 }, (_, i) => 10 + i); // 10–150

export const SLOT_INTERVAL_OPTIONS = [15, 30, 60];
