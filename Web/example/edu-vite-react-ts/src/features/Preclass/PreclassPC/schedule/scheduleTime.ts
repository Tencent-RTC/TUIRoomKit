import { i18n, t } from '@tencentcloud/roomkit-web-react';

export const DURATIONS = [15, 30, 45, 60, 120, 180] as const;
export const DEFAULT_DURATION = 45;
export const TIMEZONES = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00',
  'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00',
  'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00',
  'UTC+05:30', 'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00',
  'UTC+11:00', 'UTC+12:00',
] as const;
export type Timezone = (typeof TIMEZONES)[number];

const SLOT_MINUTES = 15;
const WEEKDAY_KEYS = ['Schedule.CalSun', 'Schedule.CalMon', 'Schedule.CalTue', 'Schedule.CalWed', 'Schedule.CalThu', 'Schedule.CalFri', 'Schedule.CalSat'];
const pad = (value: number) => String(value).padStart(2, '0');
const locale = () => i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';

export function timezoneOffsetMinutes(timezone: string): number {
  const match = /^UTC([+-])(\d{2}):(\d{2})$/.exec(timezone);
  if (!match) return 0;
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}

export function localTimezone(): Timezone {
  const offset = -new Date().getTimezoneOffset();
  return TIMEZONES.find(zone => timezoneOffsetMinutes(zone) === offset) ?? 'UTC+08:00';
}

export function timezoneLabel(timezone: string): string {
  const key = `Schedule.TZ.${timezone}`;
  const label = t(key);
  return label === key ? timezone : label;
}

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

export function weekStart(date: Date): Date {
  const start = dayStart(date);
  return addDays(start, -start.getDay());
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

export function durationLabel(minutes: number): string {
  if (minutes < 60) return t('Schedule.DurationMinutes', { count: minutes });
  const hours = minutes / 60;
  return t(hours === 1 ? 'Schedule.DurationHour' : 'Schedule.DurationHours', { count: hours });
}

export function normalizeDuration(minutes: number): number {
  const rounded = Math.round(minutes);
  return (DURATIONS as readonly number[]).includes(rounded) ? rounded : DEFAULT_DURATION;
}

export function toEpochSeconds(dateKey: string, clock: string, timezone: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = clock.split(':').map(Number);
  return Math.floor((Date.UTC(year, month - 1, day, hour, minute) - timezoneOffsetMinutes(timezone) * 60000) / 1000);
}

export interface WallTime {
  dateKey: string;
  clock: string;
}

export function fromEpochSeconds(seconds: number, timezone: string): WallTime {
  const shifted = new Date(seconds * 1000 + timezoneOffsetMinutes(timezone) * 60000);
  return {
    dateKey: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    clock: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
  };
}

export function nextSlot(nowMs: number, timezone: string): WallTime {
  const slotMs = SLOT_MINUTES * 60000;
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
