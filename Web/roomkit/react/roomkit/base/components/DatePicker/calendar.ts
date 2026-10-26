export interface CalendarCell {
  iso: string;
  day: number;
  muted: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Local-time `YYYY-MM-DD`; string order matches date order. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whole weeks covering the month, Sunday first; days outside it are muted. */
export function calendarCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const count = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1, index - first.getDay() + 1);
    return { iso: toDateKey(date), day: date.getDate(), muted: date.getMonth() !== month - 1 };
  });
}

export function isDateInRange(iso: string, min?: string, max?: string): boolean {
  return (!min || iso >= min) && (!max || iso <= max);
}

/** True when the target month still overlaps [min, max]. */
export function canShiftMonth(
  year: number,
  month: number,
  offset: number,
  min?: string,
  max?: string,
): boolean {
  const cursor = new Date(year, month - 1 + offset, 1);
  const nextYear = cursor.getFullYear();
  const nextMonth = cursor.getMonth() + 1;
  const start = `${nextYear}-${pad(nextMonth)}-01`;
  const end = `${nextYear}-${pad(nextMonth)}-${pad(new Date(nextYear, nextMonth, 0).getDate())}`;
  return (!max || start <= max) && (!min || end >= min);
}
