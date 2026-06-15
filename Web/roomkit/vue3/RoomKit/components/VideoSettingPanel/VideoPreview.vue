<template>
  <div class="video-preview-container">
    <div
      id="video-preview"
      class="video-preview"
    />
    <div class="attention-info">
      <span
        v-if="!isCameraTesting && !isCameraTestLoading"
        class="off-camera-info"
      >{{ t('VideoSettingPanel.OffCamera') }}
      </span>
      <IconLoading
        v-if="isCameraTestLoading"
        size="36"
        class="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { IconLoading, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { isCameraTesting, isCameraTestLoading, startCameraTest, stopCameraTest } = useDeviceState();

onMounted(async () => {
  TUIRoomEngine.once('ready', () => {
    startCameraTest({ view: 'video-preview' });
  });
});

onUnmounted(async () => {
  await stopCameraTest();
});
</script>

<style lang="scss" scoped>
.video-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--base-color-black-1);
  border-radius: 8px;

  .video-preview {
    position: absolute;
    top: 0;
    left: 0;
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
      color: var(--base-color-gray-7);
    }

    .loading {
      animation: loading-rotate 2s linear infinite;
    }
  }
}

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
