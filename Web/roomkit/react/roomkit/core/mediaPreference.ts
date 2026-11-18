import { RoomParticipantRole, deviceClient, roomParticipantClient } from 'tuikit-atomicx-react/room';
import { atomicState } from './mount';
import type { MediaPreference } from './types';

const LOCAL_ROLE_WAIT_MS = 5000;

/** The local participant is fetched after the join resolves, so an admin role can arrive late. */
async function isHostOrAdmin(): Promise<boolean> {
  const { loginUserId, currentRoom } = atomicState;
  if (loginUserId && currentRoom?.roomOwner?.userId === loginUserId) {
    return true;
  }
  let stop = () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    new Promise<void>((resolve) => {
      if (atomicState.localParticipantRole !== undefined) {
        resolve();
        return;
      }
      stop = atomicState.subscribe(() => {
        if (atomicState.localParticipantRole !== undefined) {
          resolve();
        }
      });
    }),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, LOCAL_ROLE_WAIT_MS);
    }),
  ]);
  stop();
  clearTimeout(timer);
  return atomicState.localParticipantRole === RoomParticipantRole.Admin;
}

/** A preference, not a guarantee: never rejects, and failures stay in the device state. */
export async function applyMediaPreference(preference: MediaPreference | undefined, signal: AbortSignal): Promise<void> {
  const warn = (error: unknown) => console.warn('[RoomKit.mediaPreference]', error);

  async function openMicrophone() {
    if (!preference?.preferMicrophoneOn) {
      return;
    }
    if (atomicState.currentRoom?.isAllMicrophoneDisabled && !await isHostOrAdmin()) {
      return;
    }
    if (signal.aborted) {
      return;
    }
    await deviceClient.openLocalMicrophone();
    await roomParticipantClient.unmuteMicrophone();
  }

  async function openCamera() {
    if (!preference?.preferCameraOn) {
      return;
    }
    if (atomicState.currentRoom?.isAllCameraDisabled && !await isHostOrAdmin()) {
      return;
    }
    if (signal.aborted) {
      return;
    }
    await deviceClient.openLocalCamera();
  }

  await Promise.all([openMicrophone().catch(warn), openCamera().catch(warn)]);
}
