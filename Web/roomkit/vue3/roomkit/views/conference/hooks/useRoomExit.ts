import { computed, readonly, ref } from 'vue';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';

/** Module scoped so every exit entry point shares one guard, not one per component. */
const isExiting = ref(false);

/** Exiting is a permission, not a role: widening who may end a room stays a Room-only change. */
export function useRoomExit() {
  const { currentRoom, leaveRoom: leave, endRoom: end } = useRoomState();
  const { loginUserInfo } = useLoginState();

  /**
   * Ownership reads from the room record, not the participant list: that list stays
   * empty until something calls getParticipantList(), and the local user is never
   * added by the enter-room events.
   */
  const canEndRoom = computed(() => {
    const ownerId = currentRoom.value?.roomOwner?.userId;
    return Boolean(ownerId) && ownerId === loginUserInfo.value?.userId;
  });

  async function exitRoom(action: () => Promise<void>): Promise<void> {
    if (isExiting.value) {
      return;
    }
    isExiting.value = true;
    try {
      await action();
    } catch (error) {
      // Swallowed on purpose: callers render the exit control, they cannot recover the room.
      console.error('[RoomKit.exitRoom] Failed to exit the room:', error);
    } finally {
      isExiting.value = false;
    }
  }

  return {
    canEndRoom,
    isExiting: readonly(isExiting),
    /** Leaving keeps the room running for the remaining participants. */
    leaveRoom: () => exitRoom(() => leave()),
    /** Ending closes the room for everyone. */
    endRoom: () => exitRoom(() => end()),
  };
}
