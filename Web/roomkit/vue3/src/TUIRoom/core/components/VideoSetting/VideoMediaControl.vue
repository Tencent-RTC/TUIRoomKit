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
      <svg-icon :icon="icon" />
    </icon-button>
    <video-setting-tab v-show="showVideoSettingTab" class="video-tab" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref, defineEmits, inject } from 'vue';
import IconButton from '../../../components/common/base/IconButton.vue';
import SvgIcon from '../../../components/common/base/SvgIcon.vue';
import CameraOnIcon from '../../../components/common/icons/CameraOnIcon.vue';
import CameraOffIcon from '../../../components/common/icons/CameraOffIcon.vue';
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
const icon = computed(() => {
  if (!basicStore.roomId) {
    return isCameraTesting.value ? CameraOnIcon : CameraOffIcon;
  }
  return cameraState.value === MediaDeviceState.DeviceOn
    ? CameraOnIcon
    : CameraOffIcon;
});

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
$videoTabWidth: 305px;

.video-control-container {
  position: relative;
  display: flex;

  .video-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $videoTabWidth;
    padding: 20px 20px 24px;
    box-shadow:
      0 2px 4px -3px var(--uikit-color-black-8),
      0 6px 10px 1px var(--uikit-color-black-8),
      0 3px 14px 2px var(--uikit-color-black-8);
    border-radius: 8px;
    background-color: var(--bg-color-dialog);

    &::before {
      position: absolute;
      bottom: -10px;
      left: 30px;
      content: '';
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 5px solid transparent;
      border-top: 5px solid var(--bg-color-dialog);
    }
  }
}
</style>
