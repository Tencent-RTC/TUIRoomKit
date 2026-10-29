import { useEffect, useMemo, useState } from 'react';
import { ContactStoreRaw, useContactListState } from 'tuikit-atomicx-react/chat';
import { useLoginState } from 'tuikit-atomicx-react/room';
import { loadContactList } from '../../base';
import type { RoomKitContact } from '../../base';
import { t } from '../../i18n';

export interface PickerContact {
  userId: string;
  userName: string;
  occupied: boolean;
  avatarUrl: string;
}

export interface PickedContact {
  userId: string;
  userName: string;
}

const AVATAR_KEYS = ['avatarUrl', 'avatarURL', 'avatar', 'faceUrl'] as const;
const DISPLAY_NAME_KEYS = ['userName', 'username', 'nick', 'nickname', 'friendRemark', 'remark'] as const;
const EMPTY_IDS: Iterable<string> = [];

function firstText(item: Record<string, unknown>, keys: readonly string[], skip = ''): string {
  for (const key of keys) {
    const value = String(item[key] ?? '').trim();
    if (value && value !== skip) {
      return value;
    }
  }
  return '';
}

export function isResolvableUserId(userId: string): boolean {
  const next = userId.trim();
  if (!next || /\s/.test(next)) {
    return false;
  }
  /* IM profile misses come back as YLS#NOT_FOUND / NOT_FOUND, not real users. */
  return !/#/.test(next) && !/not[_-]?found/i.test(next);
}

export function keepResolvedContacts(
  contacts: PickerContact[],
  resolvedIds: Iterable<string> | null | undefined,
): PickerContact[] {
  if (resolvedIds == null) {
    return contacts;
  }
  const allowed = new Set(resolvedIds);
  return contacts.filter(item => allowed.has(item.userId));
}

/** Username first. A name that is only the user id is not a name. */
export function mapFriendContacts(
  list: ReadonlyArray<object> | null | undefined,
  occupiedIds: Iterable<string> = [],
  excludeIds: Iterable<string> = [],
): PickerContact[] {
  const occupied = new Set(occupiedIds);
  const excluded = new Set(excludeIds);
  return (list ?? []).map((raw) => {
    const item = raw as Record<string, unknown>;
    const userId = String(item.userID ?? item.userId ?? '');
    return {
      userId,
      userName: firstText(item, DISPLAY_NAME_KEYS, userId) || userId,
      occupied: occupied.has(userId),
      avatarUrl: firstText(item, AVATAR_KEYS),
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

/**
 * Friends that the IM profile service can resolve; placeholder accounts are dropped.
 * Pass memoised id lists: they are memo dependencies of the contact list.
 */
export function useResolvedContacts(
  occupiedIds: Iterable<string> = EMPTY_IDS,
  excludeIds: Iterable<string> = EMPTY_IDS,
) {
  const { friendList } = useContactListState();
  // `useContactStore` is not exported from tuikit-atomicx-react/chat;
  // the raw ContactStore singleton it wraps exposes the same loadFriends / getContactInfo.
  const { loadFriends, getContactInfo } = ContactStoreRaw;
  const [resolvedIds, setResolvedIds] = useState<Set<string> | null>(null);
  /** Set when the host supplies `contactList`; those contacts bypass the IM friend list. */
  const [hostContacts, setHostContacts] = useState<RoomKitContact[] | null>(null);
  // Bumped after loadFriends settles; the resolve step runs on the next render so it
  // sees the friend list that load produced.
  const [loadTick, setLoadTick] = useState(0);

  const contacts = useMemo<PickerContact[]>(() => {
    if (hostContacts) {
      return mapFriendContacts(hostContacts, occupiedIds, excludeIds);
    }
    return keepResolvedContacts(
      mapFriendContacts(friendList, occupiedIds, excludeIds),
      resolvedIds,
    );
  }, [friendList, hostContacts, occupiedIds, excludeIds, resolvedIds]);

  useEffect(() => {
    if (loadTick === 0) {
      return undefined;
    }
    let cancelled = false;
    const ids = mapFriendContacts(friendList).map(item => item.userId);
    if (ids.length === 0) {
      setResolvedIds(new Set());
      return undefined;
    }
    getContactInfo(ids)
      .then((profiles) => {
        if (!cancelled) {
          setResolvedIds(new Set(
            profiles.map(profile => profile.userID).filter(isResolvableUserId),
          ));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedIds(null);
        }
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTick]);

  async function refreshContacts() {
    const provided = await loadContactList();
    setHostContacts(provided ?? null);
    if (provided) {
      return;
    }
    try {
      await loadFriends();
    } catch {
      /* FRIEND_LIST_UPDATED may still fill the list. */
    }
    setLoadTick(tick => tick + 1);
  }

  return { contacts, refreshContacts };
}

/** Search and multi-select over the resolved friends, minus the local user. */
export function useContactPicker(occupiedIds: Iterable<string> = EMPTY_IDS) {
  const { loginUserInfo } = useLoginState();
  const userId = loginUserInfo?.userId;
  const excludeIds = useMemo(() => (userId ? [userId] : []), [userId]);
  const { contacts, refreshContacts } = useResolvedContacts(occupiedIds, excludeIds);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [pickedIds, setPickedIds] = useState(() => new Set<string>());

  const visibleContacts = filterContacts(contacts, searchKeyword);
  /** Selection order, so a newly picked contact lands at the end. */
  const picked = useMemo(() => {
    const byId = new Map(contacts.map(item => [item.userId, item]));
    return [...pickedIds].flatMap(id => byId.get(id) ?? []);
  }, [contacts, pickedIds]);
  const emptyText = t(searchKeyword.trim() ? 'Participants.ContactNotFound' : 'Participants.ContactEmpty');

  function isPicked(id: string): boolean {
    return pickedIds.has(id);
  }

  function toggle(id: string) {
    const contact = contacts.find(item => item.userId === id);
    if (contact) {
      setPickedIds(previous => toggleSelectedId(previous, id, contact.occupied));
    }
  }

  /** Starts a fresh pick: clears the search, preselects ids, and reloads friends. */
  function reset(selectedIds: readonly string[] = []) {
    setSearchKeyword('');
    setPickedIds(new Set(selectedIds));
    void refreshContacts();
  }

  /** Preselected ids may be missing from the friend list; they fall back to the user id. */
  function pickedContacts(): PickedContact[] {
    const names = new Map(contacts.map(item => [item.userId, item.userName.trim()]));
    return [...pickedIds].map(id => ({ userId: id, userName: names.get(id) || id }));
  }

  return {
    contacts,
    searchKeyword,
    setSearchKeyword,
    visibleContacts,
    picked,
    pickedCount: pickedIds.size,
    emptyText,
    isPicked,
    toggle,
    reset,
    pickedContacts,
  };
}
