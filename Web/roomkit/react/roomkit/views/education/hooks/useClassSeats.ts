import { useEffect, useMemo, useState } from 'react';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { useParticipantAutoLoad } from '../../../features/Participants/participantData';
import { useShareParticipants } from '../../../features/Whiteboard/WhiteboardState';

/**
 * The 1v1 classroom has three fixed seats: the owner is the teacher, the first other
 * member is the student, and the stage carries whatever is being shared. Anyone else
 * in the room gets no seat.
 */
export function useClassSeats() {
  // The participant list stays empty until something loads it.
  useParticipantAutoLoad();

  const { currentRoom } = useRoomState();
  const { localParticipant, participantList } = useRoomParticipantState();
  const { participantWithScreen } = useShareParticipants();

  /** The local entry carries live device state, so it wins over the list copy. */
  const members = useMemo(() => {
    const others = participantList.filter(item => item.userId !== localParticipant?.userId);
    return localParticipant ? [localParticipant, ...others] : others;
  }, [localParticipant, participantList]);

  const teacherId = currentRoom?.roomOwner?.userId ?? '';
  const teacher = members.find(item => item.userId === teacherId);

  // Sticky: once seated, the student keeps the seat while still in the room.
  const [studentId, setStudentId] = useState('');
  useEffect(() => {
    if (!teacherId) {
      return;
    }
    setStudentId((current) => {
      const seated = members.some(item => item.userId === current && item.userId !== teacherId);
      return seated ? current : members.find(item => item.userId !== teacherId)?.userId ?? '';
    });
  }, [members, teacherId]);
  const student = members.find(item => item.userId === studentId);

  return {
    teacher,
    student,
    sharer: participantWithScreen,
  };
}
