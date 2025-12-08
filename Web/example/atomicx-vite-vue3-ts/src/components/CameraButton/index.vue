<template>
  <div
    v-click-outside="handleHideVideoSettingTab"
    class="video-control-container"
  >
    <icon-button
      :title="t('Camera.Title')"
      :has-more="true"
      :disabled="isCameraDisabled"
      @click-icon="handleClickIcon"
      @click-more="handleMore"
    >
      <template v-if="!currentRoom">
        <IconCameraOn v-if="isCameraTesting" size="24" />
        <IconCameraOff v-else size="24" />
      </template>
      <template v-else>
        <IconCameraOn
          v-if="cameraStatus === DeviceStatus.On"
          size="24"
        />
        <IconCameraOff v-else size="24" />
      </template>
      <IconUnSupport
        v-if="hasNotSupportError"
        class="un-support-icon"
        size="14"
      />
    </icon-button>
    <VideoSettingPanel
      v-show="showVideoSettingTab"
      :video-preview-visible="false"
      class="video-tab"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, computed } from 'vue';
import {
  TUIToast,
  IconCameraOn,
  IconCameraOff,
  IconUnSupport,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, useRoomState, DeviceStatus, VideoSettingPanel, useRoomParticipantState, DeviceError, RoomParticipantRole, useRoomModal } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';

const props = defineProps<{
  cameraTestContainer?: HTMLDivElement | string;
}>();

const { t } = useUIKit();
const { handleErrorWithModal } = useRoomModal();
const { cameraStatus, cameraLastError, isCameraTesting, startCameraTest, stopCameraTest, openLocalCamera, closeLocalCamera } = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();

const showVideoSettingTab: Ref<boolean> = ref(false);
const isCameraDisabled = computed(() => {
  if (localParticipant.value?.role === RoomParticipantRole.Owner || localParticipant.value?.role === RoomParticipantRole.Admin) {
    return false;
  }
  if (cameraStatus.value === DeviceStatus.On) {
    return false;
  }
  return currentRoom.value?.isAllCameraDisabled;
});

const hasNotSupportError = computed(() => {
  return [DeviceError.NoDeviceDetected, DeviceError.NoSystemPermission, DeviceError.NotSupportCapture, DeviceError.OccupiedError].includes(cameraLastError.value);
});

// TODO：处理多次连续点击的情况，需要优化
async function handleClickIcon() {
  try {
    if (isCameraDisabled.value) {
      TUIToast.warning({
        message: t('Camera.Disabled'),
      });
      return;
    }
    if (!currentRoom.value && props.cameraTestContainer) {
      if (isCameraTesting.value) {
        await stopCameraTest();
      } else {
        await startCameraTest({ view: props.cameraTestContainer });
      }
      return;
    }
    if (localParticipant.value?.cameraStatus === DeviceStatus.On) {
      await closeLocalCamera();
    } else {
      await openLocalCamera();
    }
  } catch (error) {
    handleErrorWithModal(error);
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

.un-support-icon {
  position: absolute;
  top: 13px;
  left: 26px;
}

.video-control-container {
  position: relative;
  display: flex;

  .video-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $videoTabWidth;
    box-sizing: border-box;
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
