<template>
  <ConferenceMainView />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { ComponentName, conference, ConferenceMainView, RoomEvent as ConferenceRoomEvent } from '@tencentcloud/roomkit-web-vue3';
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

conference.setComponentConfig({componentName: ComponentName.AIToolsButton, visible: true});

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
  height: 100vh;
  min-width: 1150px;
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
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.has-side-panel {
    width: calc(100% - 400px);
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 56px;
  box-sizing: border-box;
  background-color: var(--bg-color-operate);
  border-bottom: 1px solid var(--stroke-color-primary);
  box-shadow: 0 1px 0 var(--uikit-color-black-8);

  &-left {
    display: flex;
    gap: 24px;
    flex: 1;
    justify-content: flex-start;
  }

  &-center {
    flex: 1;
    text-align: center;
    height: 100%;
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    justify-content: flex-end;
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

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color-operate);
  border-top: 1px solid var(--stroke-color-primary);
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 72px;
  bottom: 0;
  left: 0;
  z-index: 1;
  padding: 0px 10px;

  .control-left {
    flex: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
  }

  .control-center {
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
    color: var(--text-color-primary);
  }

  .control-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}

.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  transform: translateX(100%);
  width: 400px;
  height: 100%;
  box-sizing: border-box;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &-visible {
    transform: translateX(0);
  }
}
</style>
