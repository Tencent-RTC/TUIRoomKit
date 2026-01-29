<template>
  <ConferenceMainViewH5 />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { conference, ConferenceMainViewH5, RoomEvent as ConferenceRoomEvent } from '@tencentcloud/roomkit-web-vue3';
import {
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  useLoginState,
  useRoomState,
  useDeviceState,
  VideoQuality,
  useRoomParticipantState,
  useRoomModal,
} from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';
import { useMediaPreference } from '../hooks/useMediaPreference';

const route = useRoute();
const router = useRouter();
const { t } = useUIKit();
const { handleErrorWithModal } = useRoomModal();

const { loginUserInfo } = useLoginState();
const { currentRoom } = useRoomState();
const { localVideoQuality, openLocalCamera, updateVideoQuality, openLocalMicrophone } = useDeviceState();
const { muteMicrophone, unmuteMicrophone } = useRoomParticipantState();
const { getMicrophonePreference, getCameraPreference } = useMediaPreference();

watch(() => loginUserInfo.value?.userId, async (val) => {
  if (val) {
    const { roomId, password } = route.query as { roomId: string; password?: string };
    if (!roomId) {
      router.replace('/home');
      return;
    }

    if (!currentRoom.value?.roomId) {
      const isCreateKey = `room-${roomId}-isCreate`;
      const isCreate = sessionStorage.getItem(isCreateKey) === 'true';

      if (isCreate) {
        sessionStorage.removeItem(isCreateKey);
      }

      if (isCreate) {
        await conference.start({ roomId,
          options: {
            roomName: `${loginUserInfo.value?.userName || loginUserInfo.value?.userId}${t('Room.TemporaryMeeting')}`,
          },
        });
      } else {
        await conference.join({ roomId,
          options: {
            password,
          },
        });
      }
    }
  }
}, { immediate: true });

watch(() => currentRoom.value?.roomId, async (roomId, oldRoomId) => {
  if (!oldRoomId && roomId) {
    handleOpenCamera();
    handleOpenMicrophone();
  }
}, { immediate: true });

async function handleOpenCamera() {
  if (!localVideoQuality.value) {
    updateVideoQuality({ quality: VideoQuality.Quality720P });
  }
  if (getCameraPreference()) {
    try {
      await openLocalCamera();
    } catch (error) {
      handleErrorWithModal(error);
    }
  }
}

async function handleOpenMicrophone() {
  try {
    await muteMicrophone();
    await openLocalMicrophone();
  } catch (error) {
    handleErrorWithModal(error);
  }
  if (getMicrophonePreference()) {
    await unmuteMicrophone();
  }
}

const handleBackHome = () => {
  router.replace('/home');
};

onMounted(() => {
  conference.on(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
  conference.on(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
  conference.on(ConferenceRoomEvent.ROOM_ERROR, handleBackHome);
  conference.on(ConferenceRoomEvent.KICKED_OUT, handleBackHome);
});

onUnmounted(() => {
  conference.off(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
  conference.off(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
  conference.off(ConferenceRoomEvent.ROOM_ERROR, handleBackHome);
  conference.off(ConferenceRoomEvent.KICKED_OUT, handleBackHome);
});

</script>

<style lang="scss" scoped>

.room-page {
  width: 100vw;
  height: 100%;
  display: flex;
  flex-direction: row;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow: hidden;
}

.room-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 56px;
  box-sizing: border-box;
  transition: opacity 0.3s;
  background-color: var(--bg-color-operate);
  border-bottom: 1px solid var(--stroke-color-secondary);
  background-color: var(--bg-color-bottombar);

  &-left {
    flex: 1;
    display: flex;
    gap: 12px;
    justify-content: flex-start;
  }

  &-center {
    flex: 2;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: auto;
  }
}

.room-main {
  min-height: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  background-color: var(--bg-color-topbar);
}

.room-footer {
  position: absolute;
  box-sizing: border-box;
  background-color: var(--bg-color-operate);
  width: 100%;
  height: 90px;
  bottom: 0;
  left: 0;
}

</style>
