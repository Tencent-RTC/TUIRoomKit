import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { TUIToast, t } from '../../base';
import { runParticipantAction, useParticipantActions } from '../../features/Participants/participantActions';
import { useSendTrophy } from '../../features/EduTools/Trophy/trophyActions';
import { useWriteParticipantMetaData } from '../../features/Participants/participantMetaData';
import { BOARD_AUTH_KEY, SWAP_KEY, useClassroom } from './classroomData';
import type { TileData } from './classroomData';

export function useClassroomActions() {
  const participantActions = useParticipantActions({ education: true });
  const sendTrophy = useSendTrophy();
  const { isTeacher, teacher, meta } = useClassroom();
  const writeParticipantMetaData = useWriteParticipantMetaData();

  async function writeMeta(target: RoomParticipant | undefined, patch: Record<string, string>): Promise<boolean> {
    if (!isTeacher || !target) {
      return false;
    }
    return runParticipantAction(() => writeParticipantMetaData(target.userId, patch));
  }

  async function swap() {
    await writeMeta(teacher, { [SWAP_KEY]: meta.swapped ? '0' : '1' });
  }

  async function toggleBoardAuth(tile: TileData) {
    const next = !tile.boardAuthorized;
    if (await writeMeta(tile.participant, { [BOARD_AUTH_KEY]: next ? '1' : '0' })) {
      TUIToast.success(t(next ? 'Education.AuthOnTeacher' : 'Education.AuthOffTeacher', { name: tile.name }));
    }
  }

  /** Awards ride the roster's trophy flow: one count per student, on the student's own metaData. */
  async function reward(tile: TileData) {
    if (isTeacher && tile.participant) {
      await sendTrophy(tile.participant);
    }
  }

  async function toggleMic(tile: TileData) {
    if (tile.participant) {
      await participantActions.toggleMic(tile.participant);
    }
  }

  async function toggleCam(tile: TileData) {
    if (tile.participant) {
      await participantActions.toggleCam(tile.participant);
    }
  }

  return { swap, toggleBoardAuth, reward, toggleMic, toggleCam };
}
