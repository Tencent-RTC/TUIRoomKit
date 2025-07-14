<template>
  <div
    v-click-outside="handleHideVideoSettingTab"
    class="video-control-container"
  >
    <icon-button
      :title="t('Camera')"
      :has-more="
        videoSettingProps?.displayMode === MediaSettingDisplayMode.IconWithPanel
      "
      :disabled="cameraState === MediaDeviceState.DeviceOffAndDisabled"
      :is-not-support="
        cameraState === MediaDeviceState.NotSupportCapture ||
        cameraState === MediaDeviceState.NoDeviceDetected
      "
      @click-icon="handleClickIcon"
      @click-more="handleMore"
    >
      <template v-if="!basicStore.roomId">
        <IconCameraOn size="24" v-if="isCameraTesting" />
        <IconCameraOff size="24" v-else />
      </template>
      <template v-else>
        <IconCameraOn
          size="24"
          v-if="cameraState === MediaDeviceState.DeviceOn"
        />
        <IconCameraOff size="24" v-else />
      </template>
    </icon-button>
    <video-setting-tab v-if="showVideoSettingTab" class="video-tab" />
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, defineEmits, inject } from 'vue';
import {
  IconCameraOn,
  IconCameraOff,
} from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../../../components/common/base/IconButton.vue';
import VideoSettingTab from './VideoSettingTab.vue';
import { useI18n } from '../../../locales';
import vClickOutside from '../../../directives/vClickOutside';
import { useVideoDeviceState } from '../../hooks/useVideoDeviceState';
import {
  MediaDeviceState,
  MediaSettingDisplayMode,
  VideoSettingProps,
} from '../../type';
import { storeToRefs } from 'pinia';
import { useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';

const videoSettingProps: VideoSettingProps | undefined =
  inject('videoSettingProps');

const emits = defineEmits(['click-icon']);
const { cameraState, isCameraTesting, camera } = useVideoDeviceState();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { localUser } = storeToRefs(roomStore);

const { t } = useI18n();
const showVideoSettingTab: Ref<boolean> = ref(false);

async function handleClickIcon() {
  showVideoSettingTab.value = false;
  emits('click-icon');
  if (!basicStore.roomId) {
    if (isCameraTesting.value) {
      await camera.stopCameraDeviceTest();
    } else {
      await camera.startCameraDeviceTest({ view: 'video-preview' });
    }
    return;
  }
  if (localUser.value.hasVideoStream) {
    await camera.closeLocalCamera();
  } else {
    await camera.openLocalCamera();
  }
}

function handleMore() {
  showVideoSettingTab.value = !showVideoSettingTab.value;
}

function handleHideVideoSettingTab() {
  if (showVideoSettingTab.value) {
    showVideoSettingTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
$video-tab-width: 305px;

.video-control-container {
  position: relative;
  display: flex;

  .video-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $video-tab-width;
    padding: 20px 20px 24px;
    background-color: var(--bg-color-dialog);
    border-radius: 8px;
    box-shadow:
      0 2px 4px -3px var(--uikit-color-black-8),
      0 6px 10px 1px var(--uikit-color-black-8),
      0 3px 14px 2px var(--uikit-color-black-8);

    &::before {
      position: absolute;
      bottom: -10px;
      left: 30px;
      content: '';
      border-top: 5px solid var(--bg-color-dialog);
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 5px solid transparent;
    }
  }
}
</style>
