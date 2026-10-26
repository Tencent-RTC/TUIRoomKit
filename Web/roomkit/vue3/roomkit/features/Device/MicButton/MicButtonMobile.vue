<template>
  <ToolbarButtonMobile
    :label="microphoneOn ? t('Device.MicClose') : t('Device.MicOpen')"
    :blocked="isMicrophoneDisabled"
    :disabled="isProcessing"
    @click="toggleMicrophone"
  >
    <MicLevelIcon v-if="microphoneOn" :size="20" />
    <IconMicOff v-else :size="20" />
    <span v-if="hasDeviceError" class="mic-button-mobile-fault">!</span>
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
import { IconMicOff, TUIToast, t } from '../../../base';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';
import { useDeviceFault } from '../useDeviceFault';
import MicLevelIcon from './MicLevelIcon.vue';

const { microphoneStatus, microphoneLastError, openLocalMicrophone } = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant, muteMicrophone, unmuteMicrophone } = useRoomParticipantState();
const { handleDeviceError, microphoneFault } = useDeviceFault();

const isProcessing = ref(false);
const microphoneOn = computed(() => microphoneStatus.value === DeviceStatus.On);
const hasDeviceError = computed(() =>
  microphoneLastError.value !== DeviceError.NoError || !!microphoneFault.value,
);
const isPrivileged = computed(() =>
  localParticipant.value?.role === RoomParticipantRole.Owner
  || localParticipant.value?.role === RoomParticipantRole.Admin,
);

/** Host and admin keep control; others cannot unmute while the room mutes everyone. */
const isMicrophoneDisabled = computed(() => {
  if (isPrivileged.value || microphoneOn.value) {
    return false;
  }
  return !!currentRoom.value?.isAllMicrophoneDisabled;
});

async function toggleMicrophone() {
  if (isProcessing.value) {
    return;
  }
  if (isMicrophoneDisabled.value) {
    TUIToast.warning(t('Device.AllMicDisabled'));
    return;
  }
  const wasOn = microphoneOn.value;
  isProcessing.value = true;
  try {
    if (wasOn) {
      await muteMicrophone();
    } else {
      await openLocalMicrophone();
      await unmuteMicrophone();
    }
  } catch (error) {
    if (wasOn) {
      TUIToast.error(t('Device.MicCloseFailed'));
      return;
    }
    void handleDeviceError(DeviceType.Microphone, error);
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style scoped lang="scss">
/* Sits in the 20px icon box of ToolbarButtonMobile, so it hangs off the glyph's corner. */
.mic-button-mobile-fault {
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
