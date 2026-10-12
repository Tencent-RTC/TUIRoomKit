import { i18n, t } from '../../../i18n';

export const TIMEZONE_VALUES = [
  'UTC-12:00',
  'UTC-11:00',
  'UTC-10:00',
  'UTC-09:00',
  'UTC-08:00',
  'UTC-07:00',
  'UTC-06:00',
  'UTC-05:00',
  'UTC-04:00',
  'UTC-03:00',
  'UTC-02:00',
  'UTC-01:00',
  'UTC+00:00',
  'UTC+01:00',
  'UTC+02:00',
  'UTC+03:00',
  'UTC+04:00',
  'UTC+05:00',
  'UTC+05:30',
  'UTC+06:00',
  'UTC+07:00',
  'UTC+08:00',
  'UTC+09:00',
  'UTC+10:00',
  'UTC+11:00',
  'UTC+12:00',
] as const;

export type TimezoneValue = (typeof TIMEZONE_VALUES)[number];

export const DURATION_MINUTES = [
  15, 30, 45, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 780, 840, 900, 960, 1020,
  1080, 1140, 1200, 1260, 1320, 1380, 1440,
] as const;

export const WEEKDAY_SHORT_KEYS = [
  'Schedule.CalSun',
  'Schedule.CalMon',
  'Schedule.CalTue',
  'Schedule.CalWed',
  'Schedule.CalThu',
  'Schedule.CalFri',
  'Schedule.CalSat',
] as const;

const OFFSET_PATTERN = /^UTC([+-])(\d{2}):(\d{2})$/;

export function parseTimezoneOffsetMs(value: string): number {
  const match = OFFSET_PATTERN.exec(value);
  if (!match) {
    return 0;
  }
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3])) * 60 * 1000;
}

export function localTimezone(): TimezoneValue {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const hours = String(Math.floor(abs / 60)).padStart(2, '0');
  const minutes = String(abs % 60).padStart(2, '0');
  const value = `UTC${sign}${hours}:${minutes}`;
  return (TIMEZONE_VALUES as readonly string[]).includes(value)
    ? (value as TimezoneValue)
    : 'UTC+08:00';
}

export function timezoneLabel(value: string): string {
  return t(`Schedule.TZ.${value}`, { value });
}

export function durationLabel(minutes: number): string {
  if (minutes < 60) {
    return t('Schedule.DurationMinutes', { count: minutes });
  }
  const hours = minutes / 60;
  return hours === 1
    ? t('Schedule.DurationHour', { count: 1 })
    : t('Schedule.DurationHours', { count: hours });
}

export function timeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return slots;
}

export function formatScheduleDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) {
    return date;
  }
  if (i18n.language === 'zh-CN') {
    return `${year}年${month}月${day}日`;
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatScheduleMonth(year: number, month: number): string {
  if (i18n.language === 'zh-CN') {
    return `${year}年${month}月`;
  }
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function wallTimeToEpochMs(date: string, time: string, timezone: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) - parseTimezoneOffsetMs(timezone);
}

export function epochMsToWall(time: number, timezone: string): { date: string; time: string } {
  const shifted = new Date(time + parseTimezoneOffsetMs(timezone));
  const date = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
  const clock = `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
  return { date, time: clock };
}

function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Share card: both ends keep the numeric date, matching the pre-conference prototype. */
export function formatScheduleRange(startSeconds: number, endSeconds: number): string {
  const start = new Date(startSeconds * 1000);
  const end = new Date(endSeconds * 1000);
  return `${dateKey(start)} ${formatClock(start)} - ${dateKey(end)} ${formatClock(end)}`;
}

export function roomShareLink(roomId: string): string {
  if (typeof window === 'undefined') {
    return roomId;
  }
  const url = new URL(window.location.href);
  url.search = '';
  const hashPath = url.hash.split('?')[0];
  if (hashPath.startsWith('#/')) {
    url.hash = `${hashPath}?roomId=${encodeURIComponent(roomId)}`;
  } else {
    url.searchParams.set('roomId', roomId);
  }
  return url.toString();
}

export interface CalendarCell {
  iso: string;
  day: number;
  muted: boolean;
}

export function calendarCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const count = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1, index - first.getDay() + 1);
    return { iso: dateKey(date), day: date.getDate(), muted: date.getMonth() !== month - 1 };
  });
}

/** Calendar keys use local time, matching the native date/time inputs. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Days that still have a meeting the calendar list would show. */
export function eventDayKeys(
  meetings: Array<{ scheduledStartTime: number; scheduledEndTime: number }>,
  nowMs: number,
): Set<string> {
  return new Set(
    meetings
      .filter(meeting => meeting.scheduledEndTime * 1000 > nowMs)
      .map(meeting => dateKey(new Date(meeting.scheduledStartTime * 1000))),
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Scheduled list: today through the next 4 weeks. Past days are not viewable. */
export const SCHEDULE_DATE_HORIZON_DAYS = 28;

export function scheduleSelectableRange(now = new Date()): { min: string; max: string } {
  const start = startOfLocalDay(now);
  return { min: dateKey(start), max: dateKey(addDays(start, SCHEDULE_DATE_HORIZON_DAYS)) };
}

export function isScheduleDateSelectable(iso: string, min: string, max?: string): boolean {
  if (iso < min) {
    return false;
  }
  return max === undefined || iso <= max;
}

/** True when the target month still overlaps [min, max]. Omit max for an open future. */
export function canShiftScheduleMonth(
  year: number,
  month: number,
  offset: number,
  min: string,
  max?: string,
): boolean {
  const cursor = new Date(year, month - 1 + offset, 1);
  const nextYear = cursor.getFullYear();
  const nextMonth = cursor.getMonth() + 1;
  const start = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(nextYear, nextMonth, 0).getDate();
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  if (max !== undefined && start > max) {
    return false;
  }
  return end >= min;
}

/** Schedule panel: reject past dates, keep any future date. */
export function clampScheduleDate(iso: string, now = new Date()): string {
  const min = dateKey(now);
  return iso < min ? min : iso;
}

export function clampScheduleListFirstDay(date: Date, now = new Date()): Date {
  const { min, max } = scheduleSelectableRange(now);
  const [maxYear, maxMonth, maxDay] = max.split('-').map(Number);
  const minFirst = startOfLocalDay(now);
  const maxFirst = addDays(new Date(maxYear, maxMonth - 1, maxDay), -6);
  const start = startOfLocalDay(date);
  const key = dateKey(start);
  if (key < min) {
    return minFirst;
  }
  if (key > dateKey(maxFirst)) {
    return maxFirst;
  }
  return start;
}

export function canShiftScheduleListWeek(firstDay: Date, offset: number, now = new Date()): boolean {
  const next = addDays(startOfLocalDay(firstDay), offset);
  return dateKey(clampScheduleListFirstDay(next, now)) === dateKey(next);
}

export function formatTime(time: number): string {
  return new Date(time).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
