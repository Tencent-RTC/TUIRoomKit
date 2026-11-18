import { useEffect, useRef, useSyncExternalStore } from 'react';
import { EDU_CLASS_EVENT_ID, sendNotice } from '../../../features/Chat/customMessage';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { toastRoomError } from '../../../utils/roomError';

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
  const { localParticipant } = useRoomParticipantState();
  const exiting = useSyncExternalStore(subscribeExiting, getExiting, getExiting);
  const latestRef = useRef({ currentRoom, loginUserInfo, localParticipant });
  latestRef.current = { currentRoom, loginUserInfo, localParticipant };

  async function announceLeave() {
    const { currentRoom: room, loginUserInfo: user, localParticipant: participant } = latestRef.current;
    const targetName = participant?.nameCard || participant?.userName || user?.userName
      || participant?.userId || user?.userId || '';
    if (!room?.roomId || !targetName) return;
    await sendNotice(EDU_CLASS_EVENT_ID, room.roomId, 'member-leave', { targetName }).catch(() => {});
  }

  useEffect(() => {
    const onBeforeUnload = () => {
      void announceLeave();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  /**
   * Ownership reads from the room record, not the participant list: that list stays
   * empty until something calls getParticipantList(), and the local user is never
   * added by the enter-room events.
   */
  const ownerId = currentRoom?.roomOwner?.userId;
  const canEndRoom = Boolean(ownerId) && ownerId === loginUserInfo?.userId;

  async function exitRoom(action: () => Promise<void>, failureKey: string): Promise<void> {
    if (isExiting) {
      return;
    }
    setExiting(true);
    try {
      await announceLeave();
      await action();
    } catch (error) {
      // Callers render the exit control and cannot recover the room; the toast tells the user to retry.
      console.error('[RoomKit.exitRoom] Failed to exit the room:', error);
      toastRoomError(error, { fallback: failureKey });
    } finally {
      setExiting(false);
    }
  }

  return {
    canEndRoom,
    isExiting: exiting,
    /** Leaving keeps the room running for the remaining participants. */
    leaveRoom: () => exitRoom(() => leave(), 'Education.LeaveFailed'),
    /** Ending closes the room for everyone. */
    endRoom: () => exitRoom(() => end(), 'Education.EndFailed'),
  };
}
