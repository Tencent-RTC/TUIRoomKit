<template>
  <div
    v-click-outside="handleHideAudioSettingTab"
    class="audio-control-container"
  >
    <icon-button
      :title="isMuted ? t('Microphone.Unmute') : t('Microphone.Mute')"
      :has-more="true"
      :disabled="isMicrophoneDisabled"
      @click-icon="handleClickIcon"
      @click-more="handleMore"
    >
      <div class="audio-icon-container">
        <audio-icon
          :audio-volume="isMicrophoneTesting ? testingMicVolume : currentMicVolume"
          :is-muted="isMuted"
        />
        <IconUnSupport
          v-if="hasNotSupportError"
          class="un-support-icon"
          size="14"
        />
      </div>
    </icon-button>
    <AudioSettingPanel
      v-show="showAudioSettingTab"
      class="audio-tab"
      :mic-test-visible="false"
      :input-volume-visible="false"
      :speaker-test-visible="false"
      :output-volume-visible="false"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, computed } from 'vue';
import { useUIKit, TUIToast, IconUnSupport } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, useRoomState, useRoomParticipantState, RoomParticipantRole, DeviceStatus, AudioSettingPanel, DeviceError, useRoomModal } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';
import AudioIcon from './AudioIcon.vue';

const { t } = useUIKit();
const { handleErrorWithModal } = useRoomModal();
const { currentRoom } = useRoomState();
const {
  currentMicVolume,
  testingMicVolume,
  microphoneStatus,
  microphoneLastError,
  isMicrophoneTesting,
  openLocalMicrophone,
  startMicrophoneTest,
  stopMicrophoneTest,
} = useDeviceState();
const { localParticipant, muteMicrophone, unmuteMicrophone } = useRoomParticipantState();

const showAudioSettingTab: Ref<boolean> = ref(false);

const isMicrophoneDisabled = computed(() => {
  if (localParticipant.value?.role === RoomParticipantRole.Owner || localParticipant.value?.role === RoomParticipantRole.Admin) {
    return false;
  }
  if (microphoneStatus.value === DeviceStatus.On) {
    return false;
  }
  return currentRoom.value?.isAllMicrophoneDisabled;
});

const isMuted = computed(() => {
  if (!currentRoom?.value) {
    return !isMicrophoneTesting.value;
  }
  return microphoneStatus.value !== DeviceStatus.On;
});

const hasNotSupportError = computed(() => DeviceError.NoError !== microphoneLastError.value);

async function handleClickIcon() {
  try {
    if (isMicrophoneDisabled.value) {
      TUIToast.warning({
        message: t('Microphone.Disabled'),
      });
      return;
    }
    if (!currentRoom.value) {
      if (isMicrophoneTesting.value) {
        await stopMicrophoneTest();
      } else {
        await startMicrophoneTest({ interval: 200 });
      }
      return;
    }
    if (microphoneStatus.value === DeviceStatus.On) {
      await muteMicrophone();
    } else {
      await openLocalMicrophone();
      await unmuteMicrophone();
    }
  } catch (error) {
    handleErrorWithModal(error);
    handleErrorWithToast();
  }
}

function handleErrorWithToast() {
  if (microphoneLastError.value === DeviceError.NoError) {
    return;
  }
  let message = '';
  switch (microphoneLastError.value) {
    case DeviceError.NotSupportCapture:
      message = t('Microphone.NotSupportCapture');
      break;
    case DeviceError.NoSystemPermission:
      message = t('Microphone.NoSystemPermission');
      break;
    case DeviceError.OccupiedError:
      message = t('Microphone.OccupiedError');
      break;
    case DeviceError.NoDeviceDetected:
      message = t('Microphone.NoDeviceDetected');
      break;
    default:
      message = t('Microphone.UnknownError');
      break;
  }
  TUIToast.warning({
    message,
  });
}

function handleMore() {
  showAudioSettingTab.value = !showAudioSettingTab.value;
}

function handleHideAudioSettingTab() {
  if (showAudioSettingTab.value) {
    showAudioSettingTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
$audio-tab-width: 305px;

.audio-icon-container {
  position: relative;
}

.un-support-icon {
  position: absolute;
  bottom: 1px;
  right: 1px;
}

.audio-control-container {
  position: relative;
  display: flex;

  .audio-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $audio-tab-width;
    box-sizing: border-box;
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
      left: 28px;
      content: '';
      border-top: 5px solid var(--bg-color-dialog);
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 5px solid transparent;
    }
  }
}
</style>
