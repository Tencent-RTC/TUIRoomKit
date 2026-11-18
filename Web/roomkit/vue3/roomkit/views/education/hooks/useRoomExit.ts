import { computed, readonly, ref } from 'vue';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { EDU_CLASS_EVENT_ID } from '../../../features/Chat/customMessage';
import { announceSelfLeave } from '../../../features/Chat/RoomChat/memberNotice';
import { toastRoomError } from '../../../utils/roomError';

/** Module scoped so every exit entry point shares one guard, not one per component. */
const isExiting = ref(false);

/** Upper bound the leave notice can delay the exit: best-effort, never blocking. */
const LEAVE_NOTICE_BUDGET_MS = 2000;

/**
 * Best-effort leave notice when the tab closes or refreshes mid-room. The
 * send is not awaited: the page is going away, so whatever the SDK flushes
 * before the unload completes is what lands. A normal exit is already
 * announcing through exitRoom, so the guard skips it to avoid a second line.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (isExiting.value) {
      return;
    }
    const { currentRoom } = useRoomState();
    if (currentRoom.value?.roomId) {
      void announceSelfLeave(EDU_CLASS_EVENT_ID);
    }
  });
}

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

  async function exitRoom(action: () => Promise<void>, failureKey: string): Promise<void> {
    if (isExiting.value) {
      return;
    }
    isExiting.value = true;
    try {
      // The leave notice must reach the group before the engine tears it
      // down: fired without waiting, the send races the teardown and the
      // group drops it in flight, so the chat list never shows the leave
      // line. Awaiting costs one send RTT; the budget keeps a hanging send
      // from ever blocking the exit.
      await Promise.race([
        announceSelfLeave(EDU_CLASS_EVENT_ID),
        new Promise((resolve) => {
          setTimeout(resolve, LEAVE_NOTICE_BUDGET_MS);
        }),
      ]);
      await action();
    } catch (error) {
      // Callers render the exit control and cannot recover the room; the toast tells the user to retry.
      console.error('[RoomKit.exitRoom] Failed to exit the room:', error);
      toastRoomError(error, { fallback: failureKey });
    } finally {
      isExiting.value = false;
    }
  }

  return {
    canEndRoom,
    isExiting: readonly(isExiting),
    /** Leaving keeps the room running for the remaining participants. */
    leaveRoom: () => exitRoom(() => leave(), 'Education.LeaveFailed'),
    /** Ending closes the room for everyone. */
    endRoom: () => exitRoom(() => end(), 'Education.EndFailed'),
  };
}
