<template>
  <div :class="['home-container', theme]">
    <header v-if="mergedUiOptions.showHeader" class="header">
      <div class="header-left">
        <ThemeButton />
      </div>
      <div class="header-right">
        <LanguageButton />
        <LoginUserInfo @logout="handleLogout" />
      </div>
    </header>

    <main class="main">
      <div v-if="mergedUiOptions.showLogo" class="title">
        <div :class="['logo', language]" />
      </div>
      <div class="main-container">
        <div class="room-preview-container">
          <div class="camera-preview-area">
            <div id="room-preview-video" class="video-preview" />
            <div class="attention-info">
              <span
                v-if="!isCameraTesting && !isCameraTestLoading"
                class="off-camera-info"
              >{{ t('Off Camera') }}</span>
              <IconLoading
                v-if="isCameraTestLoading"
                size="36"
                class="loading"
              />
            </div>
          </div>
          <div class="control-container">
            <div class="media-control-region">
              <MicButton />
              <CameraButton cameraTestContainer="room-preview-video" />
            </div>
            <div class="room-control-region">
              <StartRoomButton
                class="button-item"
                @start-room="handleStartRoom"
              />
              <JoinRoomButton
                class="button-item"
                @join-room="handleJoinRoom"
              />
              <ScheduledRoomButton class="button-item" />
            </div>
          </div>
        </div>
        <div class="schedule-list">
          <ScheduledRoomList
            @join-room="handleScheduleJoinRoom"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
} from 'vue';
import TUIRoomEngine, { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  useUIKit,
  IconLoading,
  TUIMessageBox,
  TUIToast,
} from '@tencentcloud/uikit-base-component-vue3';
import { RoomType,
  ScheduledRoomList,
  useDeviceState,
  useRoomState,
  useRoomModal,
} from 'tuikit-atomicx-vue3/room';
import CameraButton from '../../components/CameraButton/index.vue';
import JoinRoomButton from '../../components/JoinRoomButton/index.vue';
import LanguageButton from '../../components/LanguageButton/index.vue';
import LoginUserInfo from '../../components/LoginUserInfo/index.vue';
import MicButton from '../../components/MicButton/index.vue';
import ScheduledRoomButton from '../../components/ScheduledRoomButton/index.vue';
import StartRoomButton from '../../components/StartRoomButton/index.vue';
import ThemeButton from '../../components/ThemeButton/index.vue';

interface Emits {
  (e: 'create-room', roomId: string, roomType: RoomType): void;
  (e: 'join-room', roomId: string, roomType: RoomType): void;
  (e: 'camera-preference-change', isOpen: boolean): void;
  (e: 'microphone-preference-change', isOpen: boolean): void;
  (e: 'logout'): void;
}

interface Props {
  uiOptions?: {
    showHeader?: boolean;
    showLogo?: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  uiOptions: () => ({}),
});

const emit = defineEmits<Emits>();
const { t, theme, language } = useUIKit();
const mergedUiOptions = computed(() => ({
  showHeader: true,
  showLogo: true,
  ...props.uiOptions,
}));

const { getRoomInfo } = useRoomState();
const {
  isMicrophoneTesting,
  isCameraTesting,
  isCameraTestLoading,
  startCameraTest,
  startMicrophoneTest,
  stopCameraTest,
  stopMicrophoneTest,
} = useDeviceState();
const { handleErrorWithModal } = useRoomModal();

watch(isMicrophoneTesting, () => {
  emit('microphone-preference-change', isMicrophoneTesting.value);
});

watch(isCameraTesting, () => {
  emit('camera-preference-change', isCameraTesting.value);
});

const checkRoomExist = async (roomId: string) => {
  try {
    await getRoomInfo({ roomId });
  } catch (error: any) {
    if (error.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
      return false;
    }
  }
  return true;
};

const MAX_ROOM_ID_RETRIES = 5;

const generateRoomId = async (roomType: RoomType, retriesLeft = MAX_ROOM_ID_RETRIES): Promise<string> => {
  const roomId = String(Math.floor(Math.random() * 900000) + 100000);
  if (!(await checkRoomExist(roomId))) {
    return roomType === RoomType.Standard ? roomId : `webinar_${roomId}`;
  }
  if (retriesLeft <= 1) {
    const fallbackId = `${Math.floor(Math.random() * 900000) + 100000}_${Date.now()}`;
    return roomType === RoomType.Standard ? fallbackId : `webinar_${fallbackId}`;
  }
  return generateRoomId(roomType, retriesLeft - 1);
};

const handleStartRoom = async (roomType: RoomType) => {
  const roomId = await generateRoomId(roomType);
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
  emit('create-room', roomId, roomType);
};

const handleJoinRoom = async (roomId: string) => {
  if (!roomId) {
    TUIToast.error({ message: t('Room.RoomIdRequired') });
    return;
  }
  if (await checkRoomExist(roomId)) {
    const isWebinar = roomId.startsWith('webinar_');
    emit('join-room', roomId, isWebinar ? RoomType.Webinar : RoomType.Standard);
  } else {
    TUIMessageBox.alert({
      type: 'error',
      modal: false,
      showClose: false,
      title: t('Room.Alert'),
      content: t('Room.RoomNotFound'),
    });
  }
};

const handleScheduleJoinRoom = (roomInfo: { roomId: string }) => {
  handleJoinRoom(roomInfo.roomId);
};

function handleLogout() {
  emit('logout');
}

onMounted(() => {
  const roomPreviewVideo = document.getElementById('room-preview-video');
  TUIRoomEngine.once('ready', async () => {
    if (roomPreviewVideo) {
      try {
        await startCameraTest({ view: roomPreviewVideo as HTMLDivElement });
      } catch (error: any) {
        handleErrorWithModal(error);
      }
    }
    try {
      await startMicrophoneTest();
    } catch (error: any) {
      handleErrorWithModal(error);
    }
  });
});

onBeforeUnmount(() => {
  stopCameraTest();
  stopMicrophoneTest();
});
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-default);
  background-repeat: no-repeat;
  background-size: cover;
}

.dark {
  background-image: url('../../assets/background-black.png');
  .zh-CN.logo {
    background-image: url('../../assets/logo-black-zh.png');
  }
  .en-US.logo {
    background-image: url('../../assets/logo-black-en.png');
  }
}

.light {
  background-image: url('../../assets/background-white.png');
  .zh-CN.logo {
    background-image: url('../../assets/logo-white-zh.png');
  }
  .en-US.logo {
    background-image: url('../../assets/logo-white-en.png');
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;

  &-left {
    display: flex;
    gap: 24px;
    flex: 1;
    justify-content: flex-start;
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    justify-content: flex-end;
  }
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;

  .main-container {
    display: flex;
    flex-direction: row;
    gap: 20px;
  }

  .room-preview-container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 760px;
    height: 544px;
    padding: 20px 20px 32px;
    border-radius: 24px;
    background-color: var(--bg-color-operate);
    box-shadow:
      0px 2px 6px var(--uikit-color-black-8),
      0px 8px 18px var(--uikit-color-black-8);

    .camera-preview-area {
      width: 100%;
      height: 400px;
      background-color: var(--uikit-color-black-1);
      border-radius: 8px;
      position: relative;
      .video-preview {
        width: 100%;
        height: 100%;
      }
      .attention-info {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;

        .off-camera-info {
          font-size: 22px;
          font-weight: 400;
          line-height: 34px;
          color: var(--uikit-color-gray-7);
        }

        .loading {
          animation: loading-rotate 2s linear infinite;
        }
      }
    }

    .control-container {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      .media-control-region {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        gap: 16px;
      }

      .room-control-region {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        gap: 16px;
      }
    }
  }
}

.title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;

  .logo {
    width: 484px;
    height: 63px;
    background-repeat: no-repeat;
    background-size: 100%;
  }
}

.logo.en-US {
  width: 352px;
  height: 63px;
  background-repeat: no-repeat;
  background-size: 100%;
}

.video-card {
  background: var(--bg-color-dialog);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-color);
  width: 100%;
  max-width: 360px;
}

.video-area {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-color-input);
  margin-bottom: 16px;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.controls {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 20px;

  .control-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    .icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--bg-color-input);
      margin-bottom: 4px;
      position: relative;

      &.muted,
      &.disabled {
        background: var(--button-color-hangup);
      }

      // 这里可以添加具体的图标样式
      &.audio-icon::before {
        content: '🎤';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
      }

      &.video-icon::before {
        content: '📹';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
      }
    }

    span {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
  }
}

.buttons {
  align-items: center;
  height: 48px;
}

.schedule-list {
  min-width: 470px;
  max-width: 470px;
  height: 544px;
  padding: 10px;
  user-select: none;
  border-radius: 24px;
  box-shadow:
    0 2px 6px var(--uikit-color-black-8),
    0 8px 18px var(--uikit-color-black-8);
  background-color: var(--bg-color-operate);
  overflow: auto;
  box-sizing: border-box;

  :deep(::-webkit-scrollbar-track) {
    background: transparent;
    margin: 16px 0;
  }

  :deep(::-webkit-scrollbar) {
    width: 6px;
  }

  :deep(::-webkit-scrollbar-thumb) {
    border-radius: 3px;
    background-color: var(--stroke-color-secondary);
  }
}
</style>
