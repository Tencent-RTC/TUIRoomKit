import { useEffect } from 'react';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';

/**
 * Starts the member-list load for the phone conference.
 * The member sheet mounts only when opened, and the list stays empty until
 * something calls getParticipantList(). The toolbar button stays mounted for
 * the meeting, including while it sits in the more sheet.
 */
export function useParticipantList() {
  const roomState = useRoomState();
  const { getParticipantList } = useRoomParticipantState();
  const roomId = roomState.currentRoom?.roomId;

  useEffect(() => {
    // An early call can return an empty list before the engine is ready.
    // Opening the member sheet reloads from the start.
    if (!roomId) {
      return;
    }
    getParticipantList({ cursor: '' }).catch((error: unknown) => {
      console.error('[RoomKit.participant] Failed to load participants:', error);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);
}
