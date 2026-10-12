<template>
  <ToolbarButton
    :label="cameraOn ? t('Device.CamClose') : t('Device.CamOpen')"
    :icon="cameraOn ? IconCam : IconCamOff"
    :menu-label="t('Device.VideoSettings')"
    :blocked="isCameraDisabled"
    :loading="isProcessing"
    :notice="hasDeviceError"
    :hide-menu="hideMenu"
    @click="toggleCamera"
  >
    <template #menu="{ close }">
      <VideoDeviceMenu @open-setting="tab => leaveForSetting(tab, close)" />
    </template>
  </ToolbarButton>
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
import { IconCam, IconCamOff, TUIToast } from '../../../base';
import { t } from '../../../i18n';
import type { SettingsTab } from '../../Setting/SettingsDialog/SettingsDialog.vue';
import ToolbarButton from '../../../layouts/ToolbarButton.vue';
import VideoDeviceMenu from '../VideoDeviceMenu/index.vue';
import { useDeviceFault } from '../useDeviceFault';

withDefaults(defineProps<{
  hideMenu?: boolean;
}>(), {
  hideMenu: false,
});

/** The shell owns the settings dialog; the button only forwards which tab was asked for. */
const emit = defineEmits<{ 'open-setting': [tab: SettingsTab] }>();

const {
  cameraStatus,
  cameraLastError,
  openLocalCamera,
  closeLocalCamera,
} = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();
const { handleDeviceError } = useDeviceFault();

const isProcessing = ref(false);
const cameraOn = computed(() => cameraStatus.value === DeviceStatus.On);
const hasDeviceError = computed(() =>
  cameraLastError.value !== DeviceError.NoError,
);
const isPrivileged = computed(() =>
  localParticipant.value?.role === RoomParticipantRole.Owner
  || localParticipant.value?.role === RoomParticipantRole.Admin,
);

/** Host and admin keep control; others cannot open the camera while the room disables video */
const isCameraDisabled = computed(() => {
  if (isPrivileged.value || cameraOn.value) {
    return false;
  }
  return !!currentRoom.value?.isAllCameraDisabled;
});

/** Dismiss the popover before the dialog takes over, so it is not left open behind the mask */
function leaveForSetting(tab: SettingsTab, closeMenu: () => void) {
  closeMenu();
  emit('open-setting', tab);
}

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
