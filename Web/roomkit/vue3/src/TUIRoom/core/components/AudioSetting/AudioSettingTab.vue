<template>
  <div class="audio-setting-tab">
    <div v-if="audioSettingProps?.supportSwitchMicrophone" class="item-setting">
      <span class="title">{{ t('Mic') }}</span>
      <div class="flex">
        <microphone-select class="select" />
        <TUIButton v-if="isDetailMode" @click="handleMicrophoneTest">
          {{ isMicrophoneTesting ? t('Stop') : t('Test') }}
        </TUIButton>
      </div>
    </div>
    <div v-if="audioSettingProps?.supportAudioLevel" class="item-setting">
      <span class="title">{{ t('Output') }}</span>
      <div class="mic-bar-container">
        <div
          v-for="(item, index) in new Array(volumeTotalNum).fill('')"
          :key="index"
          :class="[
            'mic-bar',
            `${showVolume && volumeNum > index ? 'active' : ''}`,
          ]"
        ></div>
      </div>
    </div>
    <div v-if="audioSettingProps?.supportSwitchSpeaker" class="item-setting">
      <span class="title">{{ t('Speaker') }}</span>
      <div class="flex">
        <speaker-select
          class="select"
          :disabled="
            audioSettingProps?.displayMode === MediaSettingDisplayMode.Panel
          "
        />
        <TUIButton v-if="isDetailMode" @click="handleSpeakerTest">
          {{ isSpeakerTesting ? t('Stop') : t('Test') }}
        </TUIButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, inject } from 'vue';
import MicrophoneSelect from './MicrophoneSelect.vue';
import SpeakerSelect from './SpeakerSelect.vue';
import { useI18n } from '../../../locales';
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import useAudioDeviceState from '../../hooks/useAudioDeviceState';
import { AudioSettingProps, MediaSettingDisplayMode } from '../../type';

const { t } = useI18n();
const {
  audioVolume,
  isMicrophoneTesting,
  isSpeakerTesting,
  microphone,
  speaker,
} = useAudioDeviceState();

const audioSettingProps: AudioSettingProps | undefined =
  inject('audioSettingProps');

const isSimpleMode = computed(
  () => audioSettingProps?.displayMode === MediaSettingDisplayMode.IconWithPanel
);
const isDetailMode = computed(
  () => audioSettingProps?.displayMode === MediaSettingDisplayMode.Panel
);

const volumeTotalNum = computed(() => (isDetailMode.value ? 36 : 28));

const volumeNum = computed(
  () => (audioVolume.value * volumeTotalNum.value) / 100
);

const showVolume = computed(
  () => isSimpleMode.value || (isDetailMode.value && isMicrophoneTesting.value)
);

/**
 * Click on the microphone [Test] button
 **/
function handleMicrophoneTest() {
  if (isMicrophoneTesting.value) {
    microphone.stopMicDeviceTest();
  } else {
    microphone.startMicDeviceTest({ interval: 200 });
  }
}
/**
 * Click on the speaker [Test] button
 **/
async function handleSpeakerTest() {
  const SPEAKER_TEST_URL =
    'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
  if (isSpeakerTesting.value) {
    speaker.stopSpeakerDeviceTest();
  } else {
    speaker.startSpeakerDeviceTest({ filePath: SPEAKER_TEST_URL });
  }
}

onBeforeUnmount(() => {
  speaker.stopSpeakerDeviceTest();
});
</script>

<style lang="scss" scoped>
.audio-setting-tab {
  width: 100%;
  font-size: 14px;
  border-radius: 4px;

  .item-setting {
    width: 100%;

    &:not(:last-child) {
      margin-bottom: 20px;
    }
  }

  .flex {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
  }

  .select {
    flex: 1;
  }

  .title {
    display: inline-block;
    width: 100%;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: var(--text-color-secondary);
  }

  .mic-bar-container {
    display: flex;
    justify-content: space-between;

    .mic-bar {
      width: 3px;
      height: 6px;
      background-color: var(--text-color-secondary);

      &.active {
        background-color: var(--text-color-link);
      }
    }
  }

  .audio-level-container {
    display: flex;
    width: 100%;
    height: 20px;

    .slider {
      height: 20px;
      margin-left: 10px;
    }
  }
}
</style>
