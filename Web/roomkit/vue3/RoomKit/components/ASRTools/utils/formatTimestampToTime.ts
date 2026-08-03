export function formatTimestampToTime(timestamp: number, format = 'MM-DD HH:mm'): string {
  const date = new Date(timestamp);
  const padStart = (value: number, length = 2) => value.toString().padStart(length, '0');

  const replacements: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    YY: (date.getFullYear() % 100).toString().padStart(2, '0'),
    MM: padStart(date.getMonth() + 1),
    DD: padStart(date.getDate()),
    HH: padStart(date.getHours()),
    hh: padStart(date.getHours() % 12),
    mm: padStart(date.getMinutes()),
    ss: padStart(date.getSeconds()),
    A: date.getHours() >= 12 ? 'PM' : 'AM',
  };

  return format.replace(/YYYY|YY|MM|DD|HH|hh|mm|ss|A/g, match => replacements[match]);
}
