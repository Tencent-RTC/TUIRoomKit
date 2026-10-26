<template>
  <ToolbarButtonMobile
    :label="cameraOn ? t('Device.CamClose') : t('Device.CamOpen')"
    :blocked="isCameraDisabled"
    :disabled="isProcessing"
    @click="toggleCamera"
  >
    <IconCam v-if="cameraOn" :size="20" />
    <IconCamOff v-else :size="20" />
    <span v-if="hasDeviceError" class="camera-button-mobile-fault">!</span>
  </ToolbarButtonMobile>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  DeviceError,
  DeviceStatus,
  DeviceType,
  RoomParticipantRole,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { IconCam, IconCamOff, TUIToast, t } from '../../../base';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';
import { useDeviceFault } from '../useDeviceFault';

const {
  cameraStatus,
  cameraLastError,
  openLocalCamera,
  closeLocalCamera,
} = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();
const { handleDeviceError, cameraFault } = useDeviceFault();

const isProcessing = ref(false);
const cameraOn = computed(() => cameraStatus.value === DeviceStatus.On);
const hasDeviceError = computed(() =>
  cameraLastError.value !== DeviceError.NoError || !!cameraFault.value,
);
const isPrivileged = computed(() =>
  localParticipant.value?.role === RoomParticipantRole.Owner
  || localParticipant.value?.role === RoomParticipantRole.Admin,
);

/** Host and admin keep control; others cannot open the camera while the room disables video. */
const isCameraDisabled = computed(() => {
  if (isPrivileged.value || cameraOn.value) {
    return false;
  }
  return !!currentRoom.value?.isAllCameraDisabled;
});

async function toggleCamera() {
  if (isProcessing.value) {
    return;
  }
  if (isCameraDisabled.value) {
    TUIToast.warning(t('Device.AllCamDisabled'));
    return;
  }
  const wasOn = cameraOn.value;
  isProcessing.value = true;
  try {
    if (wasOn) {
      await closeLocalCamera();
    } else {
      await openLocalCamera();
    }
  } catch (error) {
    if (wasOn) {
      TUIToast.error(t('Device.CamCloseFailed'));
      return;
    }
    handleDeviceError(DeviceType.Camera, error);
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style scoped lang="scss">
/* Sits in the 20px icon box of ToolbarButtonMobile, so it hangs off the glyph's corner. */
.camera-button-mobile-fault {
  position: absolute;
  top: -6px;
  right: -8px;
  z-index: 2;
  box-sizing: border-box;
  width: 14px;
  height: 14px;
  font: 700 9px / 11px system-ui, sans-serif;
  color: #000;
  text-align: center;
  pointer-events: none;
  background: var(--rk-warning);
  border: 1.5px solid var(--rk-bg-surface);
  border-radius: 50%;
}
</style>
