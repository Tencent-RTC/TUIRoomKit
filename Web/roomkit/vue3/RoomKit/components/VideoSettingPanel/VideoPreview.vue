<template>
  <div class="video-preview-container">
    <div
      id="video-preview"
      class="video-preview"
    />
    <div class="attention-info">
      <span
        v-if="!isCameraPreviewing && !isCameraPreviewLoading"
        class="preview-unavailable-info"
      >{{ t('MediaCapture.CameraPreviewUnavailable') }}
      </span>
      <IconLoading
        v-if="isCameraPreviewLoading"
        size="36"
        class="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { IconLoading, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { startCameraTest, stopCameraTest } = useDeviceState();

// Tracks the preview started by this component only, so the hint reflects what
// is actually rendered in `#video-preview`.
const isCameraPreviewing = ref(false);
const isCameraPreviewLoading = ref(false);

onMounted(() => {
  TUIRoomEngine.once('ready', async () => {
    isCameraPreviewLoading.value = true;
    try {
      await startCameraTest({ view: 'video-preview' });
      isCameraPreviewing.value = true;
    } catch (error) {
      console.warn('Failed to start camera preview:', error);
    } finally {
      isCameraPreviewLoading.value = false;
    }
  });
});

onUnmounted(async () => {
  await stopCameraTest();
  isCameraPreviewing.value = false;
});
</script>

<style lang="scss" scoped>
.video-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--uikit-color-black-1);
  border-radius: 8px;

  .video-preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--uikit-color-black-1);
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

    .preview-unavailable-info {
      font-size: 16px;
      font-weight: 400;
      line-height: 24px;
      color: var(--uikit-color-gray-7);
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
