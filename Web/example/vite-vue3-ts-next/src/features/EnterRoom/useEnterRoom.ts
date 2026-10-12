import { nextTick, onBeforeUnmount, ref } from 'vue';
import {
  RoomParticipantRole,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { RoomKit, t } from '@tencentcloud/roomkit-web-vue3-next';
import type { Credentials } from '@tencentcloud/roomkit-web-vue3-next';
import { generateRoomId } from './generateRoomId';
import { useRefreshReturn } from '../Preconference';
import { useRoomQuery } from '../RoomQuery';
import { readStoredUser } from '../../session/userSession';

export function useEnterRoom(source: {
  credentials: Credentials;
  userName: () => string;
}) {
  const roomContainer = ref<HTMLElement>();
  const roomId = ref('');
  const roomPassword = ref('');
  const showConference = ref(false);
  const isEntering = ref(false);
  let kit: RoomKit | undefined;
  let unsubscribe: (() => void) | undefined;
  const { currentRoom, getRoomInfo } = useRoomState();
  let allocatingRoomId = false;
  const {
    isCameraTesting,
    isMicrophoneTesting,
    stopCameraTest,
    stopMicrophoneTest,
    openLocalCamera,
    openLocalMicrophone,
    unmuteLocalAudio,
  } = useDeviceState();
  const { remember, dismiss } = useRefreshReturn();
  const { roomId: queryRoomId, sync: syncRoomQuery, clear: clearRoomQuery } = useRoomQuery();
  // Each enter attempt takes a token. Exit bumps it immediately, so a join that
  // resolves after leave cannot remember the room the user already left.
  let entryToken = 0;
  // Keep room-query writes in call order. A leave clear must not finish after the next sync.
  let roomQueryWrite = Promise.resolve();

  function writeRoomQuery(nextRoomId?: string) {
    roomQueryWrite = roomQueryWrite
      .catch(() => undefined)
      .then(() => (nextRoomId ? syncRoomQuery(nextRoomId) : clearRoomQuery()))
      .then(() => undefined, () => undefined);
    return roomQueryWrite;
  }

  async function createMeeting() {
    if (allocatingRoomId || isEntering.value) {
      return;
    }
    allocatingRoomId = true;
    try {
      roomId.value = (await generateRoomId(candidate => getRoomInfo({ roomId: candidate }))) ?? '';
      await handleEnter(true);
    } finally {
      allocatingRoomId = false;
    }
  }

  function joinMeeting(id: string, password?: string) {
    if (allocatingRoomId || isEntering.value) {
      return;
    }
    roomId.value = id;
    roomPassword.value = password ?? '';
    handleEnter(false);
  }

  async function handleEnter(create: boolean): Promise<unknown> {
    if (isEntering.value || !roomId.value) {
      return new Error('Room entry is already in progress');
    }
    try {
      if (!kit) {
        const saved = readStoredUser();
        if (!saved) {
          return new Error('Missing stored user');
        }
        kit = RoomKit.getInstance({
          sdkAppId: saved.SDKAppID,
          userId: saved.userID,
          userSig: saved.userSig,
        });
        unsubscribe = kit.on('exited', () => {
          const tokenAtExit = entryToken;
          entryToken += 1;
          writeRoomQuery().finally(() => {
            if (entryToken !== tokenAtExit + 1) {
              return;
            }
            showConference.value = false;
            dismiss();
          });
        });
      }
    } catch (error) {
      console.error('初始化会议失败', error);
      return error;
    }

    // Preview unmount stops the device tests, so read them before the conference view replaces it.
    const previewDevices = {
      cameraTesting: isCameraTesting.value,
      microphoneTesting: isMicrophoneTesting.value,
    };
    showConference.value = true;
    await nextTick();
    if (!roomContainer.value) {
      showConference.value = false;
      return new Error('Missing room container');
    }

    isEntering.value = true;
    try {
      if (!kit || !roomContainer.value) {
        showConference.value = false;
        return new Error('Missing room container');
      }
      const entry = ++entryToken;
      const leftDuringEntry = () => entry !== entryToken;
      const options = {
        roomId: roomId.value,
        container: { appendTo: roomContainer.value },
      };
      if (create) {
        const name = source.userName().trim() || source.credentials.userId;
        await kit.createAndJoin({
          ...options,
          roomName: t('Schedule.DefaultTopic', { name }),
        });
      } else {
        await kit.join({
          ...options,
          ...(roomPassword.value ? { password: roomPassword.value } : {}),
        });
      }
      if (leftDuringEntry()) {
        return undefined;
      }
      remember({
        roomId: roomId.value,
        ...(roomPassword.value ? { password: roomPassword.value } : {}),
      });
      writeRoomQuery(roomId.value);
      const { localParticipant } = useRoomParticipantState();
      const role = localParticipant.value?.role;
      const isPrivileged = role === RoomParticipantRole.Owner
        || role === RoomParticipantRole.Admin
        || currentRoom.value?.roomOwner?.userId === source.credentials.userId;
      const canOpenCamera = previewDevices.cameraTesting
        && (isPrivileged || !currentRoom.value?.isAllCameraDisabled);
      const canOpenMicrophone = previewDevices.microphoneTesting
        && (isPrivileged || !currentRoom.value?.isAllMicrophoneDisabled);
      if (canOpenCamera && !leftDuringEntry()) {
        if (isCameraTesting.value) {
          try {
            await stopCameraTest();
          } catch {
            // Preview unmount already started stopping the test.
          }
        }
        if (leftDuringEntry()) {
          return undefined;
        }
        try {
          await openLocalCamera();
        } catch (error) {
          console.error('Failed to open preview camera', error);
        }
      }
      if (canOpenMicrophone && !leftDuringEntry()) {
        if (isMicrophoneTesting.value) {
          try {
            await stopMicrophoneTest();
          } catch {
            // Preview unmount already started stopping the test.
          }
        }
        if (leftDuringEntry()) {
          return undefined;
        }
        try {
          await openLocalMicrophone();
          await unmuteLocalAudio();
        } catch (error) {
          console.error('Failed to open preview microphone', error);
        }
      }
      return undefined;
    } catch (error) {
      showConference.value = false;
      return error;
    } finally {
      isEntering.value = false;
    }
  }

  onBeforeUnmount(() => {
    unsubscribe?.();
    if (kit) {
      RoomKit.destroyInstance().catch(error =>
        console.error('清理会议失败', error),
      );
    }
  });

  return {
    roomContainer,
    showConference,
    isEntering,
    queryRoomId,
    clearRoomQuery,
    createMeeting,
    joinMeeting,
  };
}
