export interface PickerContact {
  userId: string;
  userName: string;
  occupied: boolean;
  initial: string;
  avatarUrl: string;
}

const AVATAR_KEYS = ['avatarUrl', 'avatarURL', 'avatar', 'faceUrl'] as const;

function contactAvatarUrl(item: Record<string, unknown>): string {
  for (const key of AVATAR_KEYS) {
    const url = String(item[key] ?? '').trim();
    if (url) {
      return url;
    }
  }
  return '';
}

const DISPLAY_NAME_KEYS = ['userName', 'username', 'nick', 'nickname', 'friendRemark', 'remark'] as const;

/** Username first. A value that is only the user id is not a name. */
export function contactDisplayName(item: Record<string, unknown>, userId: string): string {
  for (const key of DISPLAY_NAME_KEYS) {
    const name = String(item[key] ?? '').trim();
    if (name && name !== userId) {
      return name;
    }
  }
  return userId;
}

export function isResolvableUserId(userId: string): boolean {
  const next = userId.trim();
  if (!next || /\s/.test(next)) {
    return false;
  }
  /* IM profile misses come back as YLS#NOT_FOUND / NOT_FOUND, not real users. */
  return !/#/.test(next) && !/not[_-]?found/i.test(next);
}

export function contactFromProfiles(
  query: string,
  profiles: ReadonlyArray<object> | null | undefined,
  occupiedIds: Iterable<string> = [],
  excludeIds: Iterable<string> = [],
): PickerContact | null {
  const userId = query.trim();
  if (!isResolvableUserId(userId)) {
    return null;
  }
  const excluded = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);
  if (excluded.has(userId)) {
    return null;
  }
  const profile = (profiles ?? []).find((raw) => {
    const item = raw as Record<string, unknown>;
    return String(item.userID ?? item.userId ?? '') === userId;
  }) as Record<string, unknown> | undefined;
  if (!profile) {
    return null;
  }
  const resolvedId = String(profile.userID ?? profile.userId ?? '');
  if (!isResolvableUserId(resolvedId) || excluded.has(resolvedId)) {
    return null;
  }
  const occupied = occupiedIds instanceof Set ? occupiedIds : new Set(occupiedIds);
  const userName = contactDisplayName(profile, resolvedId);
  return {
    userId: resolvedId,
    userName,
    occupied: occupied.has(resolvedId),
    initial: (userName[0] || resolvedId[0] || '?').toUpperCase(),
    avatarUrl: contactAvatarUrl(profile),
  };
}

export function keepResolvedContacts(
  contacts: PickerContact[],
  resolvedIds: Iterable<string> | null | undefined,
): PickerContact[] {
  if (resolvedIds == null) {
    return contacts;
  }
  const allowed = resolvedIds instanceof Set ? resolvedIds : new Set(resolvedIds);
  return contacts.filter(item => allowed.has(item.userId));
}

export function mapFriendContacts(
  list: ReadonlyArray<object> | null | undefined,
  occupiedIds: Iterable<string> = [],
  excludeIds: Iterable<string> = [],
): PickerContact[] {
  const occupied = occupiedIds instanceof Set ? occupiedIds : new Set(occupiedIds);
  const excluded = excludeIds instanceof Set ? excludeIds : new Set(excludeIds);
  return (list ?? []).map((raw) => {
    const item = raw as Record<string, unknown>;
    const userId = String(item.userID ?? item.userId ?? '');
    const userName = contactDisplayName(item, userId);
    return {
      userId,
      userName,
      occupied: occupied.has(userId),
      initial: (userName[0] || userId[0] || '?').toUpperCase(),
      avatarUrl: contactAvatarUrl(item),
    };
  }).filter(item => isResolvableUserId(item.userId) && !excluded.has(item.userId));
}

export function filterContacts(contacts: PickerContact[], query: string): PickerContact[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return contacts;
  }
  return contacts.filter(item =>
    item.userName.toLowerCase().includes(keyword)
    || item.userId.toLowerCase().includes(keyword),
  );
}

export function selectedContacts<T extends { userId: string }>(
  userIds: Iterable<string>,
  contacts: readonly T[],
): T[] {
  const byId = new Map(contacts.map(item => [item.userId, item]));
  return [...userIds].flatMap((userId) => {
    const contact = byId.get(userId);
    return contact ? [contact] : [];
  });
}

export interface PickedContact {
  userId: string;
  userName: string;
}

/** Username when the contact has one. Otherwise the user id. */
export function pickedContacts(
  userIds: readonly string[],
  contacts: readonly Pick<PickerContact, 'userId' | 'userName'>[],
): PickedContact[] {
  const names = new Map(contacts.map(item => [item.userId, item.userName.trim()]));
  return userIds.map(userId => ({
    userId,
    userName: names.get(userId) || userId,
  }));
}

export function toggleSelectedId(
  selectedIds: Set<string>,
  userId: string,
  occupied: boolean,
): Set<string> {
  if (occupied) {
    return selectedIds;
  }
  const next = new Set(selectedIds);
  if (next.has(userId)) {
    next.delete(userId);
  } else {
    next.add(userId);
  }
  return next;
}
