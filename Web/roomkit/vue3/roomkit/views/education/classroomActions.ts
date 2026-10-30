import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import { TUIToast, t } from '../../base';
import { runParticipantAction, useParticipantActions } from '../../features/Participants/participantActions';
import { sendTrophy } from '../../features/EduTools/Trophy/trophyActions';
import { BOARD_AUTH_KEY, SWAP_KEY, patchMetaData, useClassroom } from './classroomData';
import type { TileData } from './classroomData';

export function useClassroomActions() {
  const { updateParticipantMetaData } = useRoomParticipantState();
  const participantActions = useParticipantActions({ education: true });
  const { isTeacher, teacher, meta } = useClassroom();

  async function writeMeta(target: RoomParticipant | undefined, patch: Record<string, string>): Promise<boolean> {
    if (!isTeacher.value || !target) {
      return false;
    }
    const metaData = patchMetaData(target.metaData, patch);
    const done = await runParticipantAction(() => updateParticipantMetaData({ userId: target.userId, metaData }));
    if (done) {
      // The engine may not echo the writer's own change.
      Object.assign(target, { metaData });
    }
    return done;
  }

  async function swap() {
    await writeMeta(teacher.value, { [SWAP_KEY]: meta.value.swapped ? '0' : '1' });
  }

  async function toggleBoardAuth(tile: TileData) {
    const next = !tile.boardAuthorized;
    if (await writeMeta(tile.participant, { [BOARD_AUTH_KEY]: next ? '1' : '0' })) {
      TUIToast.success(t(next ? 'Education.AuthOnTeacher' : 'Education.AuthOffTeacher', { name: tile.name }));
    }
  }

  /** Awards ride the roster's trophy flow: one count per student, on the student's own metaData. */
  async function reward(tile: TileData) {
    if (isTeacher.value && tile.participant) {
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
