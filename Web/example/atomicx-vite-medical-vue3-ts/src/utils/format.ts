function normalizeToMs(timestamp: number) {
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

export function formatTimeRange(start: number, end: number) {
  const startValue = new Date(normalizeToMs(start));
  const endValue = new Date(normalizeToMs(end));
  const date = `${startValue.getFullYear()}-${String(startValue.getMonth() + 1).padStart(2, '0')}-${String(startValue.getDate()).padStart(2, '0')}`;
  const startLabel = `${String(startValue.getHours()).padStart(2, '0')}:${String(startValue.getMinutes()).padStart(2, '0')}`;
  const endLabel = `${String(endValue.getHours()).padStart(2, '0')}:${String(endValue.getMinutes()).padStart(2, '0')}`;
  return `${date} ${startLabel} - ${endLabel}`;
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
}

export function formatWaiting(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}:${String(remain).padStart(2, '0')}`;
}
