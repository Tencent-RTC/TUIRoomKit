<template>
  <div class="video-tab">
    <div v-if="videoSettingProps?.supportSwitchCamera" class="item-setting">
      <span class="title">{{ t('Camera') }}</span>
      <camera-select />
    </div>
    <div v-if="videoSettingProps?.supportVideoPreview" class="item-setting">
      <span class="title">{{ t('Preview') }}</span>
      <video-preview class="video-preview" />
    </div>
    <div v-if="videoSettingProps?.supportSwitchResolution" class="item-setting">
      <span class="title">{{ t('Resolution') }}</span>
      <video-profile />
    </div>
    <div v-if="videoSettingProps?.supportSwitchMirror" class="mirror-container">
      <span>{{ t('Mirror') }}</span>
      <tui-switch v-model="isLocalMirror" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, inject } from 'vue';
import CameraSelect from './CameraSelect.vue';
import VideoProfile from './VideoProfile.vue';
import VideoPreview from './VideoPreview.vue';
import TuiSwitch from '../../../components/common/base/TuiSwitch.vue';
import { useI18n } from '../../../locales';
import useVideoDeviceState from '../../hooks/useVideoDeviceState';
import { VideoSettingProps } from '../../type';
const { t } = useI18n();
const { isLocalMirror, camera } = useVideoDeviceState();
const videoSettingProps: VideoSettingProps | undefined =
  inject('videoSettingProps');

watch(
  isLocalMirror,
  async (val: boolean) => {
    camera.switchMirror({ mirror: val });
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.video-tab {
  font-size: 14px;
  border-radius: 8px;

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
