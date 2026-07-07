/** Local-timezone date helpers. Dates are passed around as 'YYYY-MM-DD' keys. */

export type DateKey = string;

export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Start of the week containing `key`. */
export function startOfWeek(key: DateKey, weekStart: 'monday' | 'sunday' = 'monday'): DateKey {
  const date = fromDateKey(key);
  const offset = weekStart === 'monday' ? (date.getDay() + 6) % 7 : date.getDay();
  return addDays(key, -offset);
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export function weekdayShort(key: DateKey): string {
  const date = fromDateKey(key);
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

export function dayOfMonth(key: DateKey): number {
  return fromDateKey(key).getDate();
}

export function monthTitle(key: DateKey): string {
  const date = fromDateKey(key);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** e.g. "Mon 7 Jul" */
export function shortDayTitle(key: DateKey): string {
  const date = fromDateKey(key);
  return `${weekdayShort(key)} ${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`;
}

/** Minutes-past-midnight → "09:30" (24h) or "9:30 am" (12h). */
export function formatMinutes(minutes: number, use12Hour = false): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  if (!use12Hour) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const suffix = h < 12 ? 'am' : 'pm';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatTimeRange(startMinutes: number, durationMinutes: number, use12Hour = false): string {
  return `${formatMinutes(startMinutes, use12Hour)} – ${formatMinutes(startMinutes + durationMinutes, use12Hour)}`;
}
