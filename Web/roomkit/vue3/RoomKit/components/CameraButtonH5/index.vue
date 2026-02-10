<template>
  <div
    v-click-outside="handleHideVideoSettingTab"
    class="video-control-container"
  >
    <icon-button-h5
      :style="props.customStyle"
      :title="title"
      :has-more="true"
      :disabled="isCameraDisabled"
      @click="handleClickIcon"
    >
      <div class="video-icon-container">
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
      </div>
    </icon-button-h5>
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
import { useDeviceState, useRoomState, DeviceStatus, useRoomParticipantState, DeviceError, RoomParticipantRole, useRoomModal } from 'tuikit-atomicx-vue3/room';
import IconButtonH5 from '../base/IconButtonH5.vue';
import vClickOutside from '../base/vClickOutside';

interface Props {
  cameraTestContainer?: HTMLDivElement | string;
  showDescription?: boolean;
  customStyle?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  showDescription: true,
  customStyle: () => ({}),
});

const { t } = useUIKit();
const { handleErrorWithModal } = useRoomModal();
const { cameraStatus, cameraLastError, isCameraTesting, startCameraTest, stopCameraTest, openLocalCamera, closeLocalCamera } = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();

const showVideoSettingTab: Ref<boolean> = ref(false);

const title = computed(() => {
  if (!props.showDescription) {
    return '';
  }
  if (!currentRoom.value) {
    return isCameraTesting.value ? t('Camera.Stop') : t('Camera.Start');
  }
  return cameraStatus.value === DeviceStatus.On ? t('Camera.Stop') : t('Camera.Start');
});

const isCameraDisabled = computed(() => {
  if (localParticipant.value?.role === RoomParticipantRole.Owner || localParticipant.value?.role === RoomParticipantRole.Admin) {
    return false;
  }
  if (cameraStatus.value === DeviceStatus.On) {
    return false;
  }
  return currentRoom.value?.isAllCameraDisabled;
});

const hasNotSupportError = computed(() => cameraLastError.value !== DeviceError.NoError);

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
  } catch (error: any) {
    handleErrorWithModal(error);
    handleErrorWithToast();
  }
}

function handleErrorWithToast() {
  if (cameraLastError.value === DeviceError.NoError) {
    return;
  }
  let message = '';
  switch (cameraLastError.value) {
    case DeviceError.NotSupportCapture:
      message = t('Camera.NotSupportCapture');
      break;
    case DeviceError.NoSystemPermission:
      message = t('Camera.NoSystemPermission');
      break;
    case DeviceError.OccupiedError:
      message = t('Camera.OccupiedError');
      break;
    case DeviceError.NoDeviceDetected:
      message = t('Camera.NoDeviceDetected');
      break;
    default:
      message = t('Camera.UnknownError');
      break;
  }
  TUIToast.warning({
    message,
  });
}

function handleHideVideoSettingTab() {
  if (showVideoSettingTab.value) {
    showVideoSettingTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
$videoTabWidth: 305px;

.video-icon-container {
  position: relative;
}

.un-support-icon {
  position: absolute;
  bottom: 1px;
  right: 1px;
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
