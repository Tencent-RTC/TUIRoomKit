<template>
  <div class="camera-preview">
    <div ref="previewRef" class="camera-preview-view" />
    <div v-if="isLoading" class="camera-preview-loading">
      <TUILoading spinning />
    </div>
    <div v-else-if="!isPreviewing" class="camera-preview-empty">
      <span class="camera-preview-empty-title">
        {{ t('Settings.CameraPreviewUnavailable') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { DeviceType, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconCamOff, TUILoading, t } from '../../../base';
import { useDeviceFault } from '../useDeviceFault';

/* Exposed because effect panels can only apply to a running stream, and they need to
   know when there is one. Unbound it behaves as plain local state. */
const isPreviewing = defineModel<boolean>('previewing', { default: false });

const previewRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(false);
const { startCameraTest, stopCameraTest } = useDeviceState();
const { handleDeviceError } = useDeviceFault();

onMounted(async () => {
  isLoading.value = true;
  await nextTick();
  if (!previewRef.value) {
    isLoading.value = false;
    return;
  }
  try {
    await startCameraTest({ view: previewRef.value });
    isPreviewing.value = true;
  } catch (error) {
    await handleDeviceError(DeviceType.Camera, error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  isPreviewing.value = false;
  // The engine may already have torn the test view down on room leave.
  void stopCameraTest().catch(() => {});
});
</script>

<style scoped lang="scss">
.camera-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  margin-bottom: 14px;
  overflow: hidden;
  background: #121212;
  isolation: isolate;
  border-radius: 12px;
}

.camera-preview-view {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.camera-preview-empty,
.camera-preview-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 0 28px;
  color: rgba(255, 255, 255, 0.86);
  pointer-events: none;
}

.camera-preview-empty-title {
  font-size: var(--rk-fs-md);
  font-weight: 500;
}

@container settings-dialog (max-height: 420px) {
  .camera-preview {
    max-height: 180px;
  }
}
</style>
