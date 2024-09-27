<!--
  * Name: VideoTab
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <video-tab></video-tab> in the template
-->
<template>
  <div :class="['audio-setting-tab', themeClass]">
    <div class="item-setting">
      <span class="title">{{ t('Mic') }}</span>
      <div class="flex">
        <device-select class="select" device-type="microphone" />
        <tui-button
          v-if="isDetailMode"
          class="button"
          type="primary"
          @click="handleMicrophoneTest"
        >
          {{ isTestingMicrophone ? t('Stop') : t('Test') }}
        </tui-button>
      </div>
    </div>
    <div class="item-setting">
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
    <div v-if="speakerList.length > 0" class="item-setting">
      <span class="title">{{ t('Speaker') }}</span>
      <div class="flex">
        <device-select
          class="select"
          device-type="speaker"
          :disabled="mode === SettingMode.DETAIL"
        />
        <tui-button
          v-if="isDetailMode"
          class="button"
          type="primary"
          @click="handleSpeakerTest"
        >
          {{ isTestingSpeaker ? t('Stop') : t('Test') }}
        </tui-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, defineProps } from 'vue';
import DeviceSelect from './DeviceSelect.vue';
import { useRoomStore } from '../../stores/room';
import { SettingMode } from '../../constants/render';
import { useI18n } from '../../locales';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../stores/basic';
import { isElectron } from '../../utils/environment';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import TuiButton from '../common/base/Button.vue';

interface Props {
  mode?: SettingMode;
  audioVolume?: number;
  theme?: string;
}
const props = defineProps<Props>();
const settingMode = props.mode || SettingMode.SIMPLE;
const isSampleMode = computed(() => settingMode === SettingMode.SIMPLE);
const isDetailMode = computed(() => settingMode === SettingMode.DETAIL);

const basicStore = useBasicStore();
const { userId } = storeToRefs(basicStore);
const roomStore = useRoomStore();
const { speakerList, userVolumeObj, currentSpeakerId } = storeToRefs(roomStore);
const roomEngine = useGetRoomEngine();
const trtcCloud = roomEngine.instance?.getTRTCCloud();

const themeClass = computed(() =>
  props.theme ? `tui-theme-${props.theme}` : ''
);

const volumeTotalNum = computed(() => (isDetailMode.value ? 36 : 28));

const volumeNum = computed(() => {
  const volume = props.audioVolume || userVolumeObj.value[userId.value] || 0;
  return (volume * volumeTotalNum.value) / 100;
});

const showVolume = computed(
  () => isSampleMode.value || (isDetailMode.value && isTestingMicrophone.value)
);

const isTestingMicrophone = ref(false);

/**
 * Click on the microphone [Test] button
 **/
function handleMicrophoneTest() {
  isTestingMicrophone.value = !isTestingMicrophone.value;
}

const isTestingSpeaker = ref(false);
const audioPlayer = document?.createElement('audio');
if (audioPlayer && typeof audioPlayer.loop !== 'undefined') {
  audioPlayer.loop = true;
}
const { t } = useI18n();

/**
 * Click on the speaker [Test] button
 **/
async function handleSpeakerTest() {
  const SPEAKER_TEST_URL =
    'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
  isTestingSpeaker.value = !isTestingSpeaker.value;
  const isStartSpeakerTest = isTestingSpeaker.value;
  if (isElectron) {
    if (isStartSpeakerTest) {
      trtcCloud?.startSpeakerDeviceTest(SPEAKER_TEST_URL);
    } else {
      trtcCloud?.stopSpeakerDeviceTest();
    }
    return;
  }

  if (!audioPlayer) {
    return;
  }
  if (isStartSpeakerTest) {
    await audioPlayer?.setSinkId(currentSpeakerId.value);
    audioPlayer.src = SPEAKER_TEST_URL;
    audioPlayer.play();
  } else {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
}

onBeforeUnmount(() => {
  if (isElectron) {
    trtcCloud?.stopSpeakerDeviceTest();
    return;
  }
  audioPlayer && audioPlayer.pause();
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
    width: 100%;
  }

  .select {
    flex: 1;
  }

  .button {
    width: 74px;
    padding: 5px 23px;
    margin-left: 10px;
  }

  .title {
    display: inline-block;
    width: 100%;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: #4f586b;
  }

  .mic-bar-container {
    display: flex;
    justify-content: space-between;

    .mic-bar {
      width: 3px;
      height: 6px;
      background-color: var(--background-color-4);

      &.active {
        background-color: var(--green-color);
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
