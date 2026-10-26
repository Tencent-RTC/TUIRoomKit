import { computed, ref, type MaybeRefOrGetter, toValue } from 'vue';
import { useContactListState, useContactStore } from 'tuikit-atomicx-vue3/chat';
import { loadContactList } from '../../../base';
import type { RoomKitContact } from '../../../base';
import {
  isResolvableUserId,
  keepResolvedContacts,
  mapFriendContacts,
} from './contactPicker';
import type { PickerContact } from './contactPicker';

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
