<template>
  <div class="video-preview-container">
    <div id="video-preview" class="video-preview"></div>
    <div class="attention-info">
      <span
        v-if="!isCameraTesting && !isCameraTestLoading"
        class="off-camera-info"
        >{{ t('Off Camera') }}
      </span>
      <svg-icon
        v-if="isCameraTestLoading"
        :icon="LoadingIcon"
        class="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import LoadingIcon from '../../../components/common/icons/LoadingIcon.vue';
import SvgIcon from '../../../components/common/base/SvgIcon.vue';
import { useVideoDeviceState } from '../../hooks';
import { useI18n } from '../../../locales';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';

const { t } = useI18n();
const { isCameraTesting, isCameraTestLoading, camera } = useVideoDeviceState();

onMounted(async () => {
  TUIRoomEngine.once('ready', () => {
    camera.startCameraDeviceTest({ view: 'video-preview' });
  });
});

onUnmounted(async () => {
  await camera.stopCameraDeviceTest();
});
</script>

<style lang="scss" scoped>
.video-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--uikit-theme-base-color-black-1);
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
      color: var(--uikit-theme-base-color-gray-7);
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
