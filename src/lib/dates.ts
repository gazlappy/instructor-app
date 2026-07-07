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

/** Monday-based start of week. */
export function startOfWeek(key: DateKey): DateKey {
  const date = fromDateKey(key);
  const offset = (date.getDay() + 6) % 7;
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

/** Minutes-past-midnight → "09:30" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeRange(startMinutes: number, durationMinutes: number): string {
  return `${formatMinutes(startMinutes)} – ${formatMinutes(startMinutes + durationMinutes)}`;
}
