import { useSyncExternalStore } from 'react';
import { useLoginState, useRoomState } from 'tuikit-atomicx-react/room';

/** Module scoped so every exit entry point shares one guard, not one per component. */
let isExiting = false;
const exitingListeners = new Set<() => void>();

function setExiting(next: boolean) {
  isExiting = next;
  exitingListeners.forEach(listener => listener());
}

function subscribeExiting(listener: () => void): () => void {
  exitingListeners.add(listener);
  return () => {
    exitingListeners.delete(listener);
  };
}

function getExiting(): boolean {
  return isExiting;
}

/** Exiting is a permission, not a role: widening who may end a room stays a Room-only change. */
export function useRoomExit() {
  const { currentRoom, leaveRoom: leave, endRoom: end } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const exiting = useSyncExternalStore(subscribeExiting, getExiting, getExiting);

  /**
   * Ownership reads from the room record, not the participant list: that list stays
   * empty until something calls getParticipantList(), and the local user is never
   * added by the enter-room events.
   */
  const ownerId = currentRoom?.roomOwner?.userId;
  const canEndRoom = Boolean(ownerId) && ownerId === loginUserInfo?.userId;

  async function exitRoom(action: () => Promise<void>): Promise<void> {
    if (isExiting) {
      return;
    }
    setExiting(true);
    try {
      await action();
    } catch (error) {
      // Swallowed on purpose: callers render the exit control, they cannot recover the room.
      console.error('[RoomKit.exitRoom] Failed to exit the room:', error);
    } finally {
      setExiting(false);
    }
  }

  return {
    canEndRoom,
    isExiting: exiting,
    /** Leaving keeps the room running for the remaining participants. */
    leaveRoom: () => exitRoom(() => leave()),
    /** Ending closes the room for everyone. */
    endRoom: () => exitRoom(() => end()),
  };
}
