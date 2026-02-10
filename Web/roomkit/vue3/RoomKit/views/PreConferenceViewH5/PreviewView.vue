<template>
  <div :class="['home-container-h5', theme]">
    <header class="header-h5">
      <div class="user-info-section">
        <LoginUserInfoH5 @logout="handleLogout" />
      </div>
      <div class="header-actions">
        <ThemeButton />
        <LanguageButton />
      </div>
    </header>

    <main class="main-h5">
      <div class="preview-card">
        <div class="camera-preview-area">
          <div class="camera-preview-area-header">
            <SwitchCameraButtonH5 />
          </div>
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
          <div class="media-controls-overlay">
            <MicButtonH5
              :showDescription="false"
              :customStyle="{ backgroundColor: 'transparent', color: '#fff' }"
            />
            <CameraButtonH5
              cameraTestContainer="room-preview-video"
              :showDescription="false"
              :customStyle="{ backgroundColor: 'transparent', color: '#fff' }"
            />
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <JoinRoomButtonH5 class="primary-button" @join-room="handleJoinRoom" />
        <StartRoomButton
          class="primary-button"
          @start-room="handleCreateRoom"
        />
      </div>
    </main>

    <footer class="footer-h5">
      <div :class="['brand-logo', theme, language]" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { useUIKit, IconLoading } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, useRoomModal } from 'tuikit-atomicx-vue3/room';
import CameraButtonH5 from '../../components/CameraButtonH5/index.vue';
import JoinRoomButtonH5 from '../../components/JoinRoomButtonH5/index.vue';
import LanguageButton from '../../components/LanguageButton/index.vue';
import LoginUserInfoH5 from '../../components/LoginUserInfoH5/index.vue';
import MicButtonH5 from '../../components/MicButtonH5/index.vue';
import StartRoomButton from '../../components/StartRoomButton/index.vue';
import SwitchCameraButtonH5 from '../../components/SwitchCameraButtonH5/index.vue';
import ThemeButton from '../../components/ThemeButton/index.vue';

interface Emits {
  (e: 'logout'): void;
  (e: 'create-room'): void;
  (e: 'join-room'): void;
  (e: 'camera-preference-change', isOpen: boolean): void;
  (e: 'microphone-preference-change', isOpen: boolean): void;
}
const emit = defineEmits<Emits>();

const { t, theme, language } = useUIKit();
const {
  isCameraTesting,
  isMicrophoneTesting,
  isCameraTestLoading,
  startCameraTest,
  startMicrophoneTest,
  stopCameraTest,
  stopMicrophoneTest,
} = useDeviceState();
const { handleErrorWithModal } = useRoomModal();

watch(isMicrophoneTesting, (newVal) => {
  emit('microphone-preference-change', newVal);
});
watch(isCameraTesting, (newVal) => {
  emit('camera-preference-change', newVal);
});

const handleCreateRoom = async () => {
  emit('create-room');
};

const handleJoinRoom = async () => {
  emit('join-room');
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
@mixin font-text-h5 {
  font-family:
    PingFang SC,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-color-primary);
}

.home-container-h5 {
  height: 100%;
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-default);
  @include font-text-h5;
}

@supports (height: 100dvh) {
  .home-container-h5 {
    height: 100dvh;
  }
}

.header-h5 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: var(--bg-color-operate);

  .user-info-section {
    flex: 1;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.main-h5 {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 20px;
}

.preview-card {
  width: 100%;
  height: 350px;
  max-width: 440px;
  border-radius: 12px;

  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.camera-preview-area {
  width: 100%;
  height: 100%;
  background-color: var(--bg-color-topbar);
  position: relative;

  .camera-preview-area-header {
    position: absolute;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .video-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .attention-info {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    .off-camera-info {
      font-size: 16px;
      color: var(--text-color-secondary);
    }

    .loading {
      animation: loading-rotate 2s linear infinite;
    }
  }

  .media-controls-overlay {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    background-color: var(--bg-color-mask);
    backdrop-filter: blur(10px);
    border-radius: 50px;
    padding: 0 12px;
  }
}

.action-buttons {
  width: 100%;
  max-width: 440px;
  display: flex;
  gap: 12px;

  .primary-button {
    flex: 1;
    height: 50px;
  }
}

.footer-h5 {
  padding-bottom: 32px;
  display: flex;
  justify-content: center;
  align-items: center;

  .brand-logo {
    width: 466px;
    height: 32px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;

    &.light.zh-CN {
      background-image: url('../../assets/logo-white-zh.png');
    }

    &.light.en-US {
      background-image: url('../../assets/logo-white-en.png');
    }

    &.dark.zh-CN {
      background-image: url('../../assets/logo-black-zh.png');
    }

    &.dark.en-US {
      background-image: url('../../assets/logo-black-en.png');
    }
  }
}

@keyframes loading-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
