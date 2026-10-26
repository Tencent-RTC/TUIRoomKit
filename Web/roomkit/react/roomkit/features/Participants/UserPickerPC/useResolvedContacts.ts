import { useEffect, useMemo, useState } from 'react';
import { ContactStoreRaw, useContactListState } from 'tuikit-atomicx-react/chat';
import { loadContactList } from '../../../base';
import type { RoomKitContact } from '../../../base';
import {
  isResolvableUserId,
  keepResolvedContacts,
  mapFriendContacts,
} from './contactPicker';
import type { PickerContact } from './contactPicker';

const EMPTY_IDS: Iterable<string> = [];

export function useResolvedContacts(
  occupiedIds: Iterable<string> = EMPTY_IDS,
  excludeIds: Iterable<string> = EMPTY_IDS,
) {
  const { friendList } = useContactListState();
  // TODO(react-next): `useContactStore` is not exported from tuikit-atomicx-react/chat;
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
