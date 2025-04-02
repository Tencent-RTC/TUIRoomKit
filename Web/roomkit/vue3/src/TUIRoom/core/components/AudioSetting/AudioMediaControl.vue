<template>
  <div
    v-click-outside="handleHideAudioSettingTab"
    class="audio-control-container"
  >
    <icon-button
      :title="t('Mic')"
      :has-more="
        audioSettingProps?.displayMode === MediaSettingDisplayMode.IconWithPanel
      "
      :disabled="microphoneState === MediaDeviceState.DeviceOffAndDisabled"
      :is-not-support="
        microphoneState === MediaDeviceState.NotSupportCapture ||
        microphoneState === MediaDeviceState.NoDeviceDetected
      "
      @click-icon="handleClickIcon"
      @click-more="handleMore"
    >
      <audio-icon
        :audio-volume="audioVolume"
        :is-muted="isMuted"
        :is-disabled="microphoneState === MediaDeviceState.DeviceOffAndDisabled"
      />
    </icon-button>
    <audio-setting-tab
      v-show="showAudioSettingTab"
      class="audio-tab"
      :audio-volume="audioVolume"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, defineEmits, computed, inject } from 'vue';
import IconButton from '../../../components/common/base/IconButton.vue';
import AudioIcon from '../../../components/common/AudioIcon.vue';
import AudioSettingTab from './AudioSettingTab.vue';
import { useI18n } from '../../../locales';
import vClickOutside from '../../../directives/vClickOutside';
import {
  useAudioDeviceState,
  MediaDeviceState,
} from '../../hooks/useAudioDeviceState';
import { AudioSettingProps, MediaSettingDisplayMode } from '../../type';
import { useBasicStore } from '../../../stores/basic';

const audioSettingProps: AudioSettingProps | undefined =
  inject('audioSettingProps');

const basicStore = useBasicStore();
const { audioVolume, microphoneState, isMicrophoneTesting, microphone } =
  useAudioDeviceState();

const emits = defineEmits(['click-icon']);

const showAudioSettingTab: Ref<boolean> = ref(false);
const { t } = useI18n();

const isMuted = computed(() => {
  if (!basicStore.roomId) {
    return !isMicrophoneTesting.value;
  }
  return microphoneState.value !== MediaDeviceState.DeviceOn;
});

async function handleClickIcon() {
  showAudioSettingTab.value = false;
  emits('click-icon');
  if (!basicStore.roomId) {
    if (isMicrophoneTesting.value) {
      await microphone.stopMicDeviceTest();
    } else {
      await microphone.startMicDeviceTest({ interval: 200 });
    }
    return;
  }
  if (microphoneState.value === MediaDeviceState.DeviceOn) {
    await microphone.muteLocalAudio();
  } else {
    await microphone.openLocalMicrophone();
    await microphone.unmuteLocalAudio();
  }
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

.audio-control-container {
  position: relative;
  display: flex;

  .audio-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $audio-tab-width;
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
