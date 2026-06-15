/**
 * 时区和时间相关的工具函数
 */

import { RoomType } from 'tuikit-atomicx-vue3';

/**
 * 获取指定时区的当前时间
 */
export const getCurrentTimeInTimezone = (timezone: string): Date => {
  try {
    const now = new Date();
    // 使用 Intl.DateTimeFormat 获取指定时区的时间
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const partsObj = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as any);

    return new Date(
      parseInt(partsObj.year, 10),
      parseInt(partsObj.month, 10) - 1,
      parseInt(partsObj.day, 10),
      parseInt(partsObj.hour, 10),
      parseInt(partsObj.minute, 10),
      parseInt(partsObj.second, 10),
    );
  } catch (error) {
    console.warn('Timezone conversion failed, using local time:', error);
    return new Date();
  }
};

/**
 * 获取下一个15分钟间隔时间
 */
export const getNext15MinuteInterval = (date: Date): Date => {
  const minutes = date.getMinutes();
  const nextInterval = Math.ceil(minutes / 15) * 15;
  const result = new Date(date);

  if (nextInterval >= 60) {
    result.setHours(result.getHours() + 1, 0, 0, 0);
  } else {
    result.setMinutes(nextInterval, 0, 0);
  }

  return result;
};

/**
 * 将指定时区的时间转换为UTC时间戳
 * @param year 年
 * @param month 月（0-11）
 * @param day 日
 * @param hours 小时
 * @param minutes 分钟
 * @param timezone 时区
 * @returns UTC时间戳（秒）
 */
export const convertTimezoneToUTC = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timezone: string,
): number => {
  try {
    // 创建一个临时的Date对象来获取时区偏移
    const tempDate = new Date();

    // 使用Intl.DateTimeFormat获取指定时区的当前时间各部分
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // 获取当前时间在指定时区的表示
    const parts = formatter.formatToParts(tempDate);
    const partsObj = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as any);

    // 计算时区偏移量（毫秒）
    const localTime = new Date(
      parseInt(partsObj.year, 10),
      parseInt(partsObj.month, 10) - 1,
      parseInt(partsObj.day, 10),
      parseInt(partsObj.hour, 10),
      parseInt(partsObj.minute, 10),
    );

    const utcTime = new Date(tempDate.getTime());
    const offsetMs = localTime.getTime() - utcTime.getTime();

    // 创建用户选择的时间（假设在指定时区）
    const userSelectedTime = new Date(year, month, day, hours, minutes);

    // 转换为UTC时间
    const utcTimestamp = userSelectedTime.getTime() - offsetMs;

    return Math.floor(utcTimestamp / 1000);
  } catch (error) {
    console.warn('Timezone conversion failed, using local time:', error);
    // 降级处理：直接使用本地时间
    const localDateTime = new Date(year, month, day, hours, minutes);
    return Math.floor(localDateTime.getTime() / 1000);
  }
};

/**
 * 将时间从一个时区转换到另一个时区
 * @param dateTimestamp 日期时间戳（秒）
 * @param timeTimestamp 时间时间戳（秒）
 * @param fromTimezone 源时区
 * @param toTimezone 目标时区
 * @returns 转换后的日期和时间时间戳对象
 */
export const convertTimeBetweenTimezones = (
  dateTimestamp: number,
  timeTimestamp: number,
  fromTimezone: string,
  toTimezone: string,
): { startDate: number; startTime: number } => {
  try {
    // 将日期和时间时间戳转换为Date对象
    const dateObj = new Date(dateTimestamp * 1000);
    const timeObj = new Date(timeTimestamp * 1000);

    // 先将源时区的时间转换为UTC
    const utcTimestamp = convertTimezoneToUTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      timeObj.getHours(),
      timeObj.getMinutes(),
      fromTimezone,
    );

    // 将UTC时间转换为目标时区的本地时间
    const utcDate = new Date(utcTimestamp * 1000);

    // 使用Intl.DateTimeFormat获取目标时区的时间表示
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: toTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(utcDate);
    const partsObj = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as any);

    // 构造目标时区的日期和时间
    const targetDate = new Date(
      parseInt(partsObj.year, 10),
      parseInt(partsObj.month, 10) - 1,
      parseInt(partsObj.day, 10),
    );
    targetDate.setHours(0, 0, 0, 0);

    const targetTime = new Date(0);
    targetTime.setHours(
      parseInt(partsObj.hour, 10),
      parseInt(partsObj.minute, 10),
      0,
      0,
    );

    return {
      startDate: Math.floor(targetDate.getTime() / 1000),
      startTime: Math.floor(targetTime.getTime() / 1000),
    };
  } catch (error) {
    console.warn('Timezone conversion failed, keeping original values:', error);
    return {
      startDate: dateTimestamp,
      startTime: timeTimestamp,
    };
  }
};

interface DiffResult<T> {
  added: T[];
  removed: T[];
  unchanged: T[];
}

export const diffArray = <T extends { key: string }>(
  original: T[],
  current: T[],
): DiffResult<T> => {
  const originalKeys = new Set(original.map(item => item.key));
  const currentKeys = new Set(current.map(item => item.key));

  const added = current.filter(item => !originalKeys.has(item.key));
  const removed = original.filter(item => !currentKeys.has(item.key));
  const unchanged = current.filter(item => originalKeys.has(item.key));

  return { added, removed, unchanged };
};

export async function copyText(text: string): Promise<boolean> {
  try {
    // Prefer modern browser Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback: use traditional document.execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export function generateRoomLink(roomId: string, password?: string, roomType: RoomType = RoomType.Standard): string {
  if (!roomId) {
    return '';
  }

  // Use current domain to generate room link
  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  // Detect if using hash router
  const isHashRouter = window.location.hash.includes('#');
  const currentPath = window.location.pathname;

  // Build room parameters
  const roomParams = password
    ? `roomId=${roomId}&roomType=${roomType}&password=${password}`
    : `roomId=${roomId}&roomType=${roomType}`;

  // Generate link based on router mode
  if (isHashRouter) {
    // Hash router mode: http://localhost:5173/#/room?roomId=xxx
    return `${baseUrl}${currentPath}#/room?${roomParams}`;
  }
  // History router mode: http://localhost:5173/room?roomId=xxx
  return `${baseUrl}/room?${roomParams}`;
}

export function generateRoomSchemeLink(roomId: string, password?: string): string {
  if (!roomId) {
    return '';
  }
  return `tuiroom://joinroom?roomId=${roomId}${password ? `&password=${password}` : ''}`;
}
