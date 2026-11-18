import { watch } from 'vue';
import {
  RoomParticipantRole,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { MediaPreference } from './types';

const LOCAL_ROLE_WAIT_MS = 5000;

/** The local participant is fetched after the join resolves, so an admin role can arrive late. */
async function isHostOrAdmin(): Promise<boolean> {
  const { loginUserInfo } = useLoginState();
  const { currentRoom } = useRoomState();
  const { localParticipant } = useRoomParticipantState();
  if (loginUserInfo.value?.userId && currentRoom.value?.roomOwner?.userId === loginUserInfo.value.userId) {
    return true;
  }
  let stop = () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    new Promise<void>((resolve) => {
      stop = watch(localParticipant, participant => participant && resolve(), { immediate: true });
    }),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, LOCAL_ROLE_WAIT_MS);
    }),
  ]);
  stop();
  clearTimeout(timer);
  return localParticipant.value?.role === RoomParticipantRole.Admin;
}

/** A preference, not a guarantee: never rejects, and failures stay in the device state. */
export async function applyMediaPreference(preference: MediaPreference | undefined, signal: AbortSignal): Promise<void> {
  const { currentRoom } = useRoomState();
  const { openLocalMicrophone, openLocalCamera } = useDeviceState();
  const { unmuteMicrophone } = useRoomParticipantState();
  const warn = (error: unknown) => console.warn('[RoomKit.mediaPreference]', error);

  async function openMicrophone() {
    if (!preference?.preferMicrophoneOn) {
      return;
    }
    if (currentRoom.value?.isAllMicrophoneDisabled && !await isHostOrAdmin()) {
      return;
    }
    if (signal.aborted) {
      return;
    }
    await openLocalMicrophone();
    await unmuteMicrophone();
  }

  async function openCamera() {
    if (!preference?.preferCameraOn) {
      return;
    }
    if (currentRoom.value?.isAllCameraDisabled && !await isHostOrAdmin()) {
      return;
    }
    if (signal.aborted) {
      return;
    }
    await openLocalCamera();
  }

  await Promise.all([openMicrophone().catch(warn), openCamera().catch(warn)]);
}
