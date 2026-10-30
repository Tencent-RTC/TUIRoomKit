import { i18n, t } from '@tencentcloud/roomkit-web-vue3';

export const DURATIONS = [30, 45, 60, 90] as const;
export const DEFAULT_DURATION = 45;

export const TIMEZONES = ['UTC+08:00', 'UTC+09:00', 'UTC+00:00', 'UTC-05:00'] as const;
export type Timezone = (typeof TIMEZONES)[number];

const SLOT_MINUTES = 15;
const WEEKDAY_KEYS = [
  'Schedule.CalSun',
  'Schedule.CalMon',
  'Schedule.CalTue',
  'Schedule.CalWed',
  'Schedule.CalThu',
  'Schedule.CalFri',
  'Schedule.CalSat',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function locale(): string {
  return i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';
}

export function timezoneOffsetMinutes(timezone: string): number {
  const match = /^UTC([+-])(\d{2}):(\d{2})$/.exec(timezone);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** Falls back to UTC+08:00 when the browser zone is not one of the offered options. */
export function localTimezone(): Timezone {
  const offset = -new Date().getTimezoneOffset();
  return TIMEZONES.find(zone => timezoneOffsetMinutes(zone) === offset) ?? 'UTC+08:00';
}

export function timezoneLabel(timezone: string): string {
  const key = `Schedule.TZ.${timezone}`;
  const label = t(key);
  return label === key ? timezone : label;
}

/** Lists show browser-local times, so this labels the zone they are read in. */
export function browserTimezoneLabel(): string {
  const offset = -new Date().getTimezoneOffset();
  const abs = Math.abs(offset);
  return timezoneLabel(`UTC${offset < 0 ? '-' : '+'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`);
}

export function dayStart(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Weeks start on Sunday, matching the weekday header. */
export function weekStart(date: Date): Date {
  const start = dayStart(date);
  return addDays(start, -start.getDay());
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function clockOptions(): string[] {
  const slots: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += SLOT_MINUTES) {
    slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  return slots;
}

export function snapDuration(minutes: number): number {
  return DURATIONS.reduce<number>(
    (best, item) => (Math.abs(item - minutes) < Math.abs(best - minutes) ? item : best),
    DEFAULT_DURATION,
  );
}

export function toEpochSeconds(dateKey: string, clock: string, timezone: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = clock.split(':').map(Number);
  const offsetMs = timezoneOffsetMinutes(timezone) * 60 * 1000;
  return Math.floor((Date.UTC(year, month - 1, day, hour, minute) - offsetMs) / 1000);
}

export interface WallTime {
  dateKey: string;
  clock: string;
}

export function fromEpochSeconds(seconds: number, timezone: string): WallTime {
  const shifted = new Date(seconds * 1000 + timezoneOffsetMinutes(timezone) * 60 * 1000);
  return {
    dateKey: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    clock: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
  };
}

/** The first whole slot after `nowMs`, read in `timezone`. */
export function nextSlot(nowMs: number, timezone: string): WallTime {
  const slotMs = SLOT_MINUTES * 60 * 1000;
  return fromEpochSeconds(Math.ceil((nowMs + 1) / slotMs) * slotMs / 1000, timezone);
}

export function formatClock(seconds: number): string {
  const date = new Date(seconds * 1000);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDayLabel(date: Date): string {
  const lang = locale();
  const monthDay = date.toLocaleDateString(lang, { month: lang === 'zh-CN' ? 'long' : 'short', day: 'numeric' });
  return `${monthDay} ${date.toLocaleDateString(lang, { weekday: 'short' })}`;
}

export function formatMonth(year: number, month: number): string {
  if (locale() === 'zh-CN') return `${year}年${month}月`;
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (locale() === 'zh-CN') return `${year}年${month}月${day}日`;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRange(start: number, end: number): string {
  return `${formatDayLabel(new Date(start * 1000))} ${formatClock(start)} – ${formatClock(end)}`;
}

export function weekdayLabels(): string[] {
  return WEEKDAY_KEYS.map(key => t(key));
}

export function daysOfWeek(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}
