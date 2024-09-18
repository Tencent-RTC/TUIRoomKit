// scheduleUtils.ts`
import { isWeChat } from '../../utils/environment';
export interface DateAndTimeResult {
  date: Date;
  laterTime: string;
  time: string;
}

// 手动格式化日期和时间的函数
const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${month}/${day}/${year}, ${hour}:${minute}`;
};

export const getDateAndTime = (
  date: Date,
  timeZone?: string
): DateAndTimeResult => {
  let formattedDate;
  let currentTimeZone = timeZone;
  if (isWeChat) {
    formattedDate = formatDateTime(date);
  } else {
    if (!timeZone) {
      currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    // in other environment use Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Use 24-hour format
      currentTimeZone,
    } as any); // Intl is not supported in the Android mini-program environment, so use any

    formattedDate = formatter.format(date);
  }

  const [month, day, year, hour, minute] = formattedDate
    .split(/[\s,:/]+/)
    .filter(part => part !== 'AM' && part !== 'PM');

  // Round minutes up to the nearest multiple of 15 (00, 15, 30, or 45)
  const roundedMinute = Math.ceil(parseInt(minute) / 15) * 15;

  // If the rounded minute is 60, increment the hour and set the minute to 00
  const adjustedHour =
    roundedMinute === 60 ? parseInt(hour) + 1 : parseInt(hour);
  const adjustedMinute = roundedMinute === 60 ? 0 : roundedMinute;

  // Create a new date object with the adjusted hour and minute
  const adjustedDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    adjustedHour,
    adjustedMinute
  );

  // If the adjusted date is earlier than the current date, add 15 minutes
  if (adjustedDate < date) {
    adjustedDate.setMinutes(adjustedDate.getMinutes() + 15);
  }

  const intHour = parseInt(hour);
  const intMinute = parseInt(minute);

  return {
    date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
    laterTime: `${adjustedHour < 10 ? `0${adjustedHour}` : adjustedHour}:${
      adjustedMinute < 10 ? `0${adjustedMinute}` : adjustedMinute
    }`,
    time: `${intHour < 10 ? `0${intHour}` : intHour}:${intMinute < 10 ? `0${intMinute}` : intMinute}`,
  };
};

export const convertToTimestamp = (
  date: Date,
  time: string,
  timezone: string,
  offset: 1 | -1 = 1,
  referenceTimezone?: string
) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Split time string into hours and minutes
  const [hour, minute] = time.split(':').map(Number);

  // Create a new date object with the given year, month, day, hour, and minute
  const dateTime = new Date(year, month, day, hour, minute);

  const timezoneOffset =
    offset * getTimezoneOffset(timezone, referenceTimezone) * 60 * 1000;
  return dateTime.getTime() - timezoneOffset;
};

export const calculateEndTime = (startTime: number, duration: number) => {
  const endTime = startTime + duration * 1000;
  return endTime;
};

export function getTimezoneOffset(
  targetTimezone: string,
  referenceTimezone = 'UTC'
) {
  const now = Date.now();
  const referenceDate =
    referenceTimezone === 'UTC'
      ? new Date(now).toISOString()
      : new Date(now).toLocaleString('en-US', {
          timeZone: referenceTimezone,
          hour12: false,
        });
  const targetDate = new Date(now).toLocaleString('en-US', {
    timeZone: targetTimezone,
    hour12: false,
  });
  const referenceTime = new Date(referenceDate).getTime();
  const targetTime = new Date(targetDate).getTime();

  const offset = Math.round((targetTime - referenceTime) / (1000 * 60));
  return offset;
}
