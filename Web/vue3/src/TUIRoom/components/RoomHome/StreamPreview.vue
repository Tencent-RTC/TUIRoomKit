<template>
  <div v-loading="loading" element-loading-background="#000000" class="stream-container">
    <div ref="streamPreviewRef" class="stream-preview"></div>
    <div v-if="isCameraMuted" class="stream-info">
      <span class="info">{{ t('Off Camera') }}</span>
    </div>
    <div class="control-region">
      <icon-button
        ref="audioIconButtonRef"
        :title="t('Mic')"
        :hide-hover-effect="true"
        :has-more="true"
        @click-icon="toggleMuteAudio"
        @click-more="handleMicSetting"
      >
        <audio-icon :audio-volume="localStream.audioVolume" :is-muted="isMicMuted"></audio-icon>
      </icon-button>
      <icon-button
        ref="videoIconButtonRef"
        class="icon"
        :title="t('Camera')"
        :icon-name="cameraIconName"
        :hide-hover-effect="true"
        :has-more="true"
        @click-icon="toggleMuteVideo"
        @click-more="handleCameraSetting"
      />
    </div>
  </div>
  <div class="drawer-container">
    <el-drawer
      v-model="isSettingOpen"
      :modal="false"
      :title="t(settingTitle)"
      direction="rtl"
      custom-class="room-sidebar"
      :before-close="handleDrawerClose"
      :size="480"
    >
      <audio-setting-tab v-if="settingTab === 'audio'" :mode="SettingMode.DETAIL"></audio-setting-tab>
      <video-setting-tab v-if="settingTab === 'video'" :mode="SettingMode.DETAIL"></video-setting-tab>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import TUIRoomCore, { ETUIRoomEvents } from '../../tui-room-core';
import IconButton from '../common/IconButton.vue';
import { SettingMode } from '../../constants/render';
import AudioSettingTab from '../base/AudioSettingTab.vue';
import VideoSettingTab from '../base/VideoSettingTab.vue';
import AudioIcon from '../base/AudioIcon.vue';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from 'vue-i18n';

const roomStore = useRoomStore();
const { localStream } = storeToRefs(roomStore);
const { t } = useI18n();

defineExpose({
  getRoomParam,
});

const tuiRoomParam = {
  isOpenCamera: true,
  isOpenMicrophone: true,
  defaultCameraId: '',
  defaultMicrophoneId: '',
  defaultSpeakerId: '',
};

const streamPreviewRef = ref();
const loading = ref(true);

const isMicMuted = ref(false);
const isCameraMuted = ref(false);

const cameraIconName = computed(() => (isCameraMuted.value ? ICON_NAME.CameraOff : ICON_NAME.CameraOn));

function toggleMuteAudio() {
  isMicMuted.value = !isMicMuted.value;
  tuiRoomParam.isOpenMicrophone = !isMicMuted.value;
}

function toggleMuteVideo() {
  isCameraMuted.value = !isCameraMuted.value;
  tuiRoomParam.isOpenCamera = !isCameraMuted.value;
  if (isCameraMuted.value) {
    TUIRoomCore.stopCameraPreview();
  } else {
    TUIRoomCore.startCameraPreview(streamPreviewRef.value);
  }
}

function getRoomParam() {
  tuiRoomParam.defaultCameraId = roomStore.currentCameraId;
  tuiRoomParam.defaultMicrophoneId = roomStore.currentMicrophoneId;
  tuiRoomParam.defaultSpeakerId = roomStore.currentSpeakerId;
  return tuiRoomParam;
}

const onUserVoiceVolume = (eventInfo: []) => {
  roomStore.setAudioVolume(eventInfo);
};

onMounted(async () => {
  const cameraList = await TUIRoomCore.getCameraList();
  const microphoneList = await TUIRoomCore.getMicrophoneList();
  const speakerList = await TUIRoomCore.getSpeakerList();
  roomStore.setCurrentCameraId(cameraList[0].deviceId);
  roomStore.setCurrentMicrophoneId(microphoneList[0].deviceId);
  roomStore.setCurrentSpeakerId(speakerList[0].deviceId);
  TUIRoomCore.setCurrentCamera(cameraList[0].deviceId);
  TUIRoomCore.setCurrentMicrophone(microphoneList[0].deviceId);
  TUIRoomCore.setCurrentSpeaker(speakerList[0].deviceId);
  await TUIRoomCore.startCameraPreview(streamPreviewRef.value);
  TUIRoomCore.enableAudioVolumeEvaluation(100);
  await TUIRoomCore.startMicrophone();
  loading.value = false;
  TUIRoomCore.on(ETUIRoomEvents.onUserVoiceVolume, onUserVoiceVolume);
});

onBeforeUnmount(async () => {
  await TUIRoomCore.stopCameraPreview();
  await TUIRoomCore.stopMicrophone();
  TUIRoomCore.off(ETUIRoomEvents.onUserVoiceVolume, onUserVoiceVolume);
});

/**
 * Handles audio and video device settings
 *
 * 处理音视频设备设置
**/
const isSettingOpen = ref(false);
const settingTitle = ref('');
const settingTab = ref('');

/**
 * Handling audio device settings
 *
 * 处理音频设备设置
**/
function handleMicSetting() {
  isSettingOpen.value = true;
  settingTitle.value = 'Mic settings';
  settingTab.value = 'audio';
}

/**
 * Handling video device settings
 *
 * 处理视频设备设置
**/
function handleCameraSetting() {
  isSettingOpen.value = true;
  settingTitle.value = 'Camera settings';
  settingTab.value = 'video';
}

function handleDrawerClose(done: any) {
  settingTab.value = '';
  done();
}

</script>

<style lang="scss">
.stream-container {
  width: 740px;
  height: 476px;
  background-color: #12141A;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  border: 2px solid #1B1E26;
  .stream-preview {
    width: 100%;
    height: 100%;
  }
  .stream-info {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    .info {
      width: 132px;
      height: 34px;
      font-family: PingFangSC-Regular;
      font-weight: 400;
      font-size: 22px;
      color: #676C80;
      line-height: 34px;
    }
  }
  .control-region {
    height: 74px;
    background: rgba(13,16,21,0.60);
    border-radius: 43px;
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translate(-50%);
    padding: 0 50px;
    display: flex;
    .icon {
      &:not(:first-child) {
        margin-left: 30px;
      }
    }
  }
}

.drawer-container > div {
  pointer-events: none;
}

.room-sidebar {
  background-color: #1D2029;
  pointer-events: auto;
}

.el-drawer__header {
  height: 88px;
  border-bottom: 1px solid #2f313b;
  box-sizing: border-box;
  margin-bottom: 0;
  padding: 32px;
}

.el-drawer__body {
  padding: 32px;
}
</style>
