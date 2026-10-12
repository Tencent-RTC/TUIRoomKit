export const TOPIC_MAX = 25;
export const DURATION_MIN = 15;
export const DURATION_MAX = 1440;
export const PASSWORD_LENGTH = 6;
export const DEFAULT_DURATION = 60;

/**
 * Engine updateConferenceInfo only accepts name and times.
 * Hide password and join-media fields on the edit form; they stay as created.
 */
export function isSchedulePolicyLocked(editing: boolean): boolean {
  return editing;
}

export function sanitizePassword(value: string): string {
  return value.replace(/\D/g, '').slice(0, PASSWORD_LENGTH);
}

export function isPasswordComplete(value: string): boolean {
  return new RegExp(`^\\d{${PASSWORD_LENGTH}}$`).test(value);
}

export function isValidTopic(title: string): boolean {
  const next = title.trim();
  return next.length >= 1 && next.length <= TOPIC_MAX;
}

export function isValidDuration(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= DURATION_MIN && minutes <= DURATION_MAX;
}

export function isValidParticipantId(userId: string): boolean {
  const next = userId.trim();
  if (!next || /\s/.test(next)) {
    return false;
  }
  /* Engine attendee pages include IM placeholders when a profile lookup fails. */
  return !/#/.test(next) && !/not[_-]?found/i.test(next);
}

export function uniqueParticipantIds(ids: string[]): string[] {
  const next: string[] = [];
  for (const id of ids) {
    const userId = id.trim();
    if (isValidParticipantId(userId) && !next.includes(userId)) {
      next.push(userId);
    }
  }
  return next;
}

export interface AttendeeContact {
  userId: string;
  userName: string;
  initial: string;
  avatarUrl?: string;
}

/** First real username wins. A value equal to the user id is not a name. */
export function attendeeChipLabel(userId: string, names: readonly string[]): string {
  for (const value of names) {
    const name = value.trim();
    if (name && name !== userId) {
      return name;
    }
  }
  return userId;
}

export interface AttendeeHit {
  userId: string;
  displayName: string;
  initial: string;
  avatarUrl: string;
}

export function attendeeSearchHits(
  query: string,
  selected: string[],
  contacts: AttendeeContact[],
): AttendeeHit[] {
  const next = query.trim();
  if (!next) {
    return [];
  }
  const keyword = next.toLowerCase();
  const selectedIds = new Set(selected);
  return contacts
    .filter(item =>
      !selectedIds.has(item.userId)
      && (
        item.userName.toLowerCase().includes(keyword)
        || item.userId.toLowerCase().includes(keyword)
      ),
    )
    .map(item => ({
      userId: item.userId,
      displayName: item.userName,
      initial: item.initial,
      avatarUrl: item.avatarUrl ?? '',
    }));
}

export function randomPassword(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
