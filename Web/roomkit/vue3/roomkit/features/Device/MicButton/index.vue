<template>
  <ToolbarButtonPC
    :label="microphoneOn ? t('Device.MicClose') : t('Device.MicOpen')"
    :menu-label="t('Device.MicSettings')"
    :blocked="isMicrophoneDisabled"
    :loading="isProcessing"
    :notice="hasDeviceError"
    :hide-menu="hideMenu"
    :caret-direction="caretDirection"
    @click="toggleMicrophone"
  >
    <template #icon>
      <!-- Sized via prop (not the toolbar CSS) so the level overlay matches the glyph -->
      <MicLevelIcon v-if="microphoneOn && !hasDeviceError" :size="iconSize" />
      <IconMic v-else-if="microphoneOn" :size="iconSize" />
      <IconMicOff v-else :size="iconSize" />
    </template>
    <template #menu>
      <AudioDeviceMenu />
    </template>
  </ToolbarButtonPC>
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
import { TUIToast, IconMic, IconMicOff, t } from '../../../base';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import AudioDeviceMenu from '../AudioDeviceMenu/index.vue';
import MicLevelIcon from './MicLevelIcon.vue';
import { useDeviceFault } from '../useDeviceFault';

withDefaults(defineProps<{
  hideMenu?: boolean;
  /** Icon size in px; the level overlay follows it. Compact scenes (education topbar) pass 16. */
  iconSize?: number;
  /** Resting caret direction, forwarded to ToolbarButtonPC */
  caretDirection?: 'up' | 'down';
}>(), {
  hideMenu: false,
  iconSize: 22,
  caretDirection: 'up',
});

const { microphoneStatus, microphoneLastError, openLocalMicrophone } = useDeviceState();
const { currentRoom } = useRoomState();
const {
  localParticipant,
  muteMicrophone,
  unmuteMicrophone,
} = useRoomParticipantState();
const { handleDeviceError } = useDeviceFault();

const isProcessing = ref(false);
const microphoneOn = computed(() =>
  microphoneStatus.value === DeviceStatus.On,
);
const hasDeviceError = computed(() =>
  microphoneLastError.value !== DeviceError.NoError,
);
const isPrivileged = computed(() =>
  localParticipant.value?.role === RoomParticipantRole.Owner
  || localParticipant.value?.role === RoomParticipantRole.Admin,
);

/** Host and admin keep control; others cannot unmute while the room mutes everyone */
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
