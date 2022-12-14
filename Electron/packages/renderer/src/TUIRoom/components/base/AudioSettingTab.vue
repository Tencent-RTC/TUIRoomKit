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
  <div class="audio-setting-tab">
    <div :class="['item-setting-container', isSampleMode && 'hasDividingLine']">
      <div class="item-setting">
        <span class="title">{{ t('Mic') }}</span>
        <div class="flex">
          <device-select
            :class="isDetailMode ? 'detail-select' : ''"
            device-type="microphone"
          ></device-select>
          <div
            v-if="isDetailMode"
            class="button"
            @click="handleMicrophoneTest"
          >
            {{ isTestingMicrophone ? t('Stop') : t('Test') }}
          </div>
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
      <!-- <div class="item-setting">
        <span class="title">声音</span>
        <div class="audio-level-container">
          <svg-icon icon-name="voice" size="medium"></svg-icon>
          <el-slider v-model="inputAudioLevel" class="slider" :show-tooltip="false" />
        </div>
      </div> -->
    </div>

    <div v-if="(speakerList.length > 0)" :class="['item-setting-container', isSampleMode && 'hasDividingLine']">
      <div class="item-setting">
        <span class="title">{{ t('Speaker') }}</span>
        <div class="flex">
          <device-select
            :class="isDetailMode ? 'detail-select' : ''"
            device-type="speaker"
            :disabled="mode === SettingMode.DETAIL"
          ></device-select>
          <div
            v-if="isDetailMode"
            class="button"
            @click="handleSpeakerTest"
          >
            {{ isTestingSpeaker ? t('Stop') : t('Test') }}
          </div>
        </div>
      </div>
      <!-- <div class="item-setting">
        <span class="title">声音</span>
        <div class="audio-level-container">
          <svg-icon icon-name="voice" size="medium"></svg-icon>
          <el-slider v-model="outputAudioLevel" class="slider" :show-tooltip="false" />
        </div>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import DeviceSelect from './DeviceSelect.vue';
import { useRoomStore } from '../../stores/room';
import { SettingMode } from '../../constants/render';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';


interface Props {
  mode?: SettingMode,
}
const props = defineProps<Props>();
const settingMode = props.mode || SettingMode.SIMPLE;
const isSampleMode = computed(() => settingMode === SettingMode.SIMPLE);
const isDetailMode = computed(() => settingMode === SettingMode.DETAIL);

const roomStore = useRoomStore();
const { speakerList } = storeToRefs(roomStore);
// const inputAudioLevel = ref(0);
// const outputAudioLevel = ref(100);

const volumeTotalNum = computed(() => (isDetailMode.value ? 36 : 28));

const volumeNum = computed(() => (roomStore.localStream.audioVolume || 0) * volumeTotalNum.value / 100);

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
const audioPlayer = document.createElement('audio');
const { t } = useI18n();

/**
 * Click on the speaker [Test] button
 *
 * 点击扬声器【测试】按钮
**/
function handleSpeakerTest() {
  if (isTestingSpeaker.value) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isTestingSpeaker.value = false;
  } else {
    isTestingSpeaker.value = true;
    audioPlayer.src = 'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
    audioPlayer.play();
  }
}

onBeforeUnmount(() => {
  audioPlayer.pause();
});

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.audio-setting-tab {
  border-radius: 4px;
  font-size: 14px;
  .item-setting-container {
    padding-bottom: 20px;
    &:not(:first-child) {
      padding-top: 20px;
    }
    &.hasDividingLine:not(:last-child) {
      border-bottom: 1px solid $roomBackgroundColor;
    }
    .item-setting {
      &:not(:last-child) {
        margin-bottom: 20px;
      }
    }
    .flex {
      display: flex;
    }
    .detail-select {
      width: 309px;
      height: 32px;
    }
    .button {
      width: 82px;
      height: 32px;
      background-image: linear-gradient(235deg, #1883FF 0%, #0062F5 100%);
      border-radius: 2px;
      text-align: center;
      line-height: 32px;
      font-weight: 400;
      font-size: 14px;
      color: $whiteColor;
      margin-left: 10px;
      cursor: pointer;
    }
  }
  .title {
    display: inline-block;
    margin-bottom: 10px;
    width: 100%;
  }
  .mic-bar-container {
    width: 100%;
    height: 4px;
    display: flex;
    justify-content: space-between;
    .mic-bar {
      width: 4px;
      height: 4px;
      background-color: $primaryColor;
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
