<template>
  <div class="audio-setting-tab">
    <div class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.Microphone') }}</span>
      <div class="flex">
        <microphone-select class="select" />
        <TUIButton v-if="micTestVisible" @click="handleMicrophoneTest">
          {{ isMicrophoneTesting ? t('AudioSettingPanel.Stop') : t('AudioSettingPanel.Test') }}
        </TUIButton>
      </div>
    </div>
    <div v-if="inputVolumeLevelVisible" class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.InputLevel') }}</span>
      <div class="mic-bar-container">
        <div
          v-for="(item, index) in new Array(volumeTotalNum).fill('')"
          :key="index"
          :class="[
            'mic-bar',
            `${showInputVolume && volumeNum > index ? 'active' : ''}`,
          ]"
        />
      </div>
    </div>
    <div v-if="inputVolumeVisible" class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.InputVolume') }}</span>
      <div class="flex">
        <TUISlider
          v-model="captureVolumeValue"
          class="custom-slider"
          :min="0"
          :max="100"
        />
        <span class="volume-value">{{ captureVolume }}</span>
      </div>
    </div>
    <div class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.Speaker') }}</span>
      <div class="flex">
        <speaker-select
          class="select"
          :disabled="speakerTestVisible"
        />
        <TUIButton v-if="speakerTestVisible" @click="handleSpeakerTest">
          {{ isSpeakerTesting ? t('AudioSettingPanel.Stop') : t('AudioSettingPanel.Test') }}
        </TUIButton>
      </div>
    </div>
    <div v-if="outputVolumeVisible" class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.OutputVolume') }}</span>
      <div class="flex">
        <TUISlider
          v-model="outputVolumeValue"
          class="custom-slider"
          :min="0"
          :max="100"
        />
        <span class="volume-value">{{ outputVolume }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useUIKit, TUIButton, TUISlider } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import MicrophoneSelect from './MicrophoneSelect.vue';
import SpeakerSelect from './SpeakerSelect.vue';

const { t } = useUIKit();

const props = defineProps({
  micTestVisible: {
    type: Boolean,
    default: true,
  },
  inputVolumeLevelVisible: {
    type: Boolean,
    default: true,
  },
  inputVolumeVisible: {
    type: Boolean,
    default: true,
  },
  speakerTestVisible: {
    type: Boolean,
    default: true,
  },
  outputVolumeVisible: {
    type: Boolean,
    default: true,
  },
});

const {
  captureVolume,
  currentMicVolume,
  testingMicVolume,
  outputVolume,
  setCaptureVolume,
  setOutputVolume,
  isMicrophoneTesting,
  isSpeakerTesting,
  startMicrophoneTest,
  stopMicrophoneTest,
  startSpeakerTest,
  stopSpeakerTest,
} = useDeviceState();

function handleMicrophoneTest() {
  if (isMicrophoneTesting.value) {
    stopMicrophoneTest();
  } else {
    startMicrophoneTest({ interval: 200 });
  }
}

async function handleSpeakerTest() {
  const SPEAKER_TEST_URL
    = 'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
  if (isSpeakerTesting.value) {
    stopSpeakerTest();
  } else {
    startSpeakerTest({ filePath: SPEAKER_TEST_URL });
  }
}

const volumeTotalNum = ref(28);

const volumeNum = computed(() => {
  if (isMicrophoneTesting.value) {
    return (testingMicVolume.value * volumeTotalNum.value) / 100;
  }
  return (currentMicVolume.value * volumeTotalNum.value) / 100;
});

const showInputVolume = computed(() => {
  if (props.micTestVisible) {
    return isMicrophoneTesting.value;
  }
  return true;
});

const captureVolumeValue = ref(captureVolume.value);
const outputVolumeValue = ref(outputVolume.value);

watch(captureVolumeValue, async (value) => {
  await setCaptureVolume(value);
});

watch(outputVolumeValue, async (value) => {
  await setOutputVolume(value);
});

onUnmounted(() => {
  if (isMicrophoneTesting.value) {
    stopMicrophoneTest();
  }
  if (isSpeakerTesting.value) {
    stopSpeakerTest();
  }
});
</script>

<style lang="scss" scoped>
.audio-setting-tab {
  width: 100%;
  font-size: 14px;
  border-radius: 4px;
  text-align: initial;

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

  .custom-slider {
    flex: 1;
  }

  .volume-value {
    margin-left: 6px;
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

}
</style>
