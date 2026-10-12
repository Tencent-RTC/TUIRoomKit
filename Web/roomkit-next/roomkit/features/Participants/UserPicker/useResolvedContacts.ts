import { computed, ref, type MaybeRefOrGetter, toValue } from 'vue';
import { useContactListState, useContactStore } from 'tuikit-atomicx-vue3/chat';
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

  const contacts = computed<PickerContact[]>(() => (
    keepResolvedContacts(
      mapFriendContacts(friendList.value, toValue(occupiedIds), toValue(excludeIds)),
      resolvedIds.value,
    )
  ));

  async function refreshContacts() {
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
