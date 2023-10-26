<!--
  * Name: VideoTab
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <video-tab></video-tab> in the template
  *
  * 名称: VideoTab
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * 使用方式：
  * 在 template 中使用 <video-tab></video-tab>
-->
<template>
  <div :class="['audio-setting-tab', themeClass]">
    <div class="item-setting">
      <span class="title">{{ t('Mic') }}</span>
      <div class="flex">
        <device-select
          class="select"
          device-type="microphone"
        ></device-select>
        <Button
          v-if="isDetailMode"
          class="button"
          type="primary"
          @click="handleMicrophoneTest"
        >
          {{ isTestingMicrophone ? t('Stop') : t('Test') }}
        </Button>
      </div>
    </div>
    <div class="item-setting">
      <span class="title">{{ t('Output') }}</span>
      <div class="mic-bar-container">
        <div
          v-for="(item, index) in new Array(volumeTotalNum).fill('')"
          :key="index"
          :class="['mic-bar', `${showVolume && volumeNum > index ? 'active' : ''}`]"
        >
        </div>
      </div>
    </div>
    <div v-if="(speakerList.length > 0)" class="item-setting">
      <span class="title">{{ t('Speaker') }}</span>
      <div class="flex">
        <device-select
          class="select"
          device-type="speaker"
          :disabled="mode === SettingMode.DETAIL"
        ></device-select>
        <Button
          v-if="isDetailMode"
          class="button"
          type="primary"
          @click="handleSpeakerTest"
        >
          {{ isTestingSpeaker ? t('Stop') : t('Test') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import DeviceSelect from './DeviceSelect.vue';
import { useRoomStore } from '../../stores/room';
import { SettingMode } from '../../constants/render';
import { useI18n } from '../../locales';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../stores/basic';
import Button from '../common/base/Button.vue';


interface Props {
  mode?: SettingMode,
  audioVolume?: number,
  theme?: string,
}
const props = defineProps<Props>();
const settingMode = props.mode || SettingMode.SIMPLE;
const isSampleMode = computed(() => settingMode === SettingMode.SIMPLE);
const isDetailMode = computed(() => settingMode === SettingMode.DETAIL);

const basicStore = useBasicStore();
const { userId } = storeToRefs(basicStore);
const roomStore = useRoomStore();
const { speakerList, userVolumeObj } = storeToRefs(roomStore);

const themeClass = computed(() => (props.theme ? `tui-theme-${props.theme}` : ''));

const volumeTotalNum = computed(() => (isDetailMode.value ? 36 : 28));

const volumeNum = computed(() => {
  const volume = props.audioVolume || userVolumeObj.value[userId.value] || 0;
  return volume * volumeTotalNum.value / 100;
});

const showVolume = computed(() => isSampleMode.value || (isDetailMode.value && isTestingMicrophone.value));

const isTestingMicrophone = ref(false);

/**
 * Click on the microphone [Test] button
 *
 * 点击麦克风【测试】按钮
**/
function handleMicrophoneTest() {
  isTestingMicrophone.value = !isTestingMicrophone.value;
}

const isTestingSpeaker = ref(false);
const audioPlayer = document?.createElement('audio');
const { t } = useI18n();

/**
 * Click on the speaker [Test] button
 *
 * 点击扬声器【测试】按钮
**/
function handleSpeakerTest() {
  if (isTestingSpeaker.value) {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
    isTestingSpeaker.value = false;
  } else {
    isTestingSpeaker.value = true;
    if (audioPlayer) {
      audioPlayer.src = 'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
      audioPlayer.play();
    }
  }
}

onBeforeUnmount(() => {
  audioPlayer && audioPlayer.pause();
});

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.audio-setting-tab {
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  .item-setting {
    width: 100%;
    &:not(:last-child) {
      margin-bottom: 20px;
    }
  }
  .flex {
    width: 100%;
    display: flex;
  }
  .select {
    flex: 1;
  }
  .button {
    margin-left: 10px;
    padding: 5px 23px;
    width: 74px;
  }
  .title {
    display: inline-block;
    margin-bottom: 8px;
    width: 100%;
    color: #4f586b;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
  }
  .mic-bar-container {
    display: flex;
    justify-content: space-between;
    .mic-bar {
      width: 3px;
      height: 6px;
      background-color: var(--background-color-4);
      &.active {
        background-color: $levelHighLightColor;
      }
    }
  }
  .audio-level-container {
    width: 100%;
    height: 20px;
    display: flex;
    .slider {
      height: 20px;
      margin-left: 10px;
    }
  }
}
</style>
