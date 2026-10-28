import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useContactListState, useContactStore } from 'tuikit-atomicx-vue3/chat';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { loadContactList, t } from '../../base';
import type { RoomKitContact } from '../../base';

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

/** Friends that the IM profile service can resolve; placeholder accounts are dropped. */
export function useResolvedContacts(
  occupiedIds: MaybeRefOrGetter<Iterable<string>> = [],
  excludeIds: MaybeRefOrGetter<Iterable<string>> = [],
) {
  const { friendList } = useContactListState();
  const { loadFriends, getContactInfo } = useContactStore();
  const resolvedIds = ref<Set<string> | null>(null);
  /** Set when the host supplies `contactList`; those contacts bypass the IM friend list. */
  const hostContacts = ref<RoomKitContact[] | null>(null);

  const contacts = computed<PickerContact[]>(() => {
    if (hostContacts.value) {
      return mapFriendContacts(hostContacts.value, toValue(occupiedIds), toValue(excludeIds));
    }
    return keepResolvedContacts(
      mapFriendContacts(friendList.value, toValue(occupiedIds), toValue(excludeIds)),
      resolvedIds.value,
    );
  });

  async function refreshContacts() {
    const provided = await loadContactList();
    hostContacts.value = provided ?? null;
    if (provided) {
      return;
    }
    try {
      await loadFriends();
    } catch {
      /* FRIEND_LIST_UPDATED may still fill the list. */
    }
    const ids = mapFriendContacts(friendList.value).map(item => item.userId);
    if (ids.length === 0) {
      resolvedIds.value = new Set();
      return;
    }
    try {
      const profiles = await getContactInfo(ids);
      resolvedIds.value = new Set(
        profiles.map(profile => profile.userID).filter(isResolvableUserId),
      );
    } catch {
      resolvedIds.value = null;
    }
  }

  return { contacts, refreshContacts };
}

/** Search and multi-select over the resolved friends, minus the local user. */
export function useContactPicker(occupiedIds: MaybeRefOrGetter<Iterable<string>> = []) {
  const { loginUserInfo } = useLoginState();
  const excludeIds = computed(() => {
    const userId = loginUserInfo.value?.userId;
    return userId ? [userId] : [];
  });
  const { contacts, refreshContacts } = useResolvedContacts(occupiedIds, excludeIds);

  const searchKeyword = ref('');
  const pickedIds = ref(new Set<string>());

  const visibleContacts = computed(() => filterContacts(contacts.value, searchKeyword.value));
  /** Selection order, so a newly picked contact lands at the end. */
  const picked = computed(() => {
    const byId = new Map(contacts.value.map(item => [item.userId, item]));
    return [...pickedIds.value].flatMap(userId => byId.get(userId) ?? []);
  });
  const emptyText = computed(() => (
    t(searchKeyword.value.trim() ? 'Participants.ContactNotFound' : 'Participants.ContactEmpty')
  ));

  function isPicked(userId: string): boolean {
    return pickedIds.value.has(userId);
  }

  function toggle(userId: string) {
    const contact = contacts.value.find(item => item.userId === userId);
    if (contact) {
      pickedIds.value = toggleSelectedId(pickedIds.value, userId, contact.occupied);
    }
  }

  /** Starts a fresh pick: clears the search, preselects ids, and reloads friends. */
  function reset(selectedIds: readonly string[] = []) {
    searchKeyword.value = '';
    pickedIds.value = new Set(selectedIds);
    void refreshContacts();
  }

  /** Preselected ids may be missing from the friend list; they fall back to the user id. */
  function pickedContacts(): PickedContact[] {
    const names = new Map(contacts.value.map(item => [item.userId, item.userName.trim()]));
    return [...pickedIds.value].map(userId => ({ userId, userName: names.get(userId) || userId }));
  }

  return {
    contacts,
    searchKeyword,
    visibleContacts,
    picked,
    pickedCount: computed(() => pickedIds.value.size),
    emptyText,
    isPicked,
    toggle,
    reset,
    pickedContacts,
  };
}
