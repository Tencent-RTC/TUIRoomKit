<template>
  <div class="video-setting-panel">
    <div v-if="cameraSelectVisible" class="item-setting">
      <span class="title">{{ t('VideoSettingPanel.Camera') }}</span>
      <camera-select />
    </div>
    <div v-if="videoPreviewVisible" class="item-setting">
      <span class="title">{{ t('VideoSettingPanel.Preview') }}</span>
      <video-preview class="video-preview" />
    </div>
    <div v-if="videoProfileVisible" class="item-setting">
      <span class="title">{{ t('VideoSettingPanel.Resolution') }}</span>
      <video-profile />
    </div>
    <div v-if="switchMirrorVisible" class="mirror-container">
      <span>{{ t('VideoSettingPanel.Mirror') }}</span>
      <TUISwitch v-model="localMirror" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, watch } from 'vue';
import { useUIKit, TUISwitch } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import { MirrorType } from 'tuikit-atomicx-vue3';
import CameraSelect from './CameraSelect.vue';
import VideoPreview from './VideoPreview.vue';
import VideoProfile from './VideoProfile.vue';

const { t } = useUIKit();
const { localMirrorType, switchMirror } = useDeviceState();

const localMirror = ref(localMirrorType.value !== MirrorType.Disable);

watch(localMirrorType, (val) => {
  localMirror.value = val !== MirrorType.Disable;
});

watch(localMirror, (val) => {
  switchMirror({ mirror: val ? MirrorType.Auto : MirrorType.Disable });
});

defineProps({
  cameraSelectVisible: {
    type: Boolean,
    default: true,
  },
  videoPreviewVisible: {
    type: Boolean,
    default: true,
  },
  videoProfileVisible: {
    type: Boolean,
    default: true,
  },
  switchMirrorVisible: {
    type: Boolean,
    default: true,
  },
});
</script>

<style lang="scss" scoped>
.video-setting-panel {
  font-size: 14px;
  border-radius: 8px;
  text-align: initial;

  .item-setting {
    &:not(:last-child) {
      margin-bottom: 20px;
    }
  }

  .title {
    display: inline-block;
    width: 100%;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: var(--text-color-secondary);
  }

  .video-preview {
    position: relative;
    width: 100%;
    height: 0;
    padding-top: calc(100% * 9 / 16);
    overflow: hidden;
  }

  .mirror-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 2px;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    color: var(--text-color-secondary);
  }

  .item {
    width: 100%;
    height: 20px;
    color: var(--text-color-secondary);
    cursor: pointer;
  }
}
</style>
