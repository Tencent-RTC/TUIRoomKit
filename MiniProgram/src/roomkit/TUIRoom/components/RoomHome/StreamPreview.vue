<template>
  <div>
    <div element-loading-background="#000000" class="stream-container">
      <div id="stream-preview" ref="streamPreviewRef" class="stream-preview"></div>
      <div v-if="isCameraMuted" class="stream-info">
        <span class="attention-info">{{ t('Off Camera') }}</span>
      </div>
      <div class="control-region">
        <icon-button
          ref="audioIconButtonRef"
          :title="t('Mic')"
          :is-active="isMicMuted"
          :hide-hover-effect="true"
          :has-more="true"
          @click-icon="toggleMuteAudio"
          @click-more="handleMicSetting"
        >
          <audio-icon :audio-volume="audioVolume" :is-muted="isMicMuted"></audio-icon>
        </icon-button>
        <icon-button
          ref="videoIconButtonRef"
          class="icon"
          :title="t('Camera')"
          :is-active="isCameraMuted"
          :icon-name="cameraIconName"
          :hide-hover-effect="true"
          :has-more="true"
          @click-icon="toggleMuteVideo"
          @click-more="handleCameraSetting"
        />
      </div>
    </div>
    <div class="drawer-container">
      <Drawer
        :model-value="isSettingOpen"
        :modal="false"
        :title="t(settingTitle)"
        direction="rtl"
        :before-close="handleDrawerClose"
        :size="480"
      >
        <audio-setting-tab v-if="settingTab === 'audio'" :mode="SettingMode.DETAIL"></audio-setting-tab>
        <video-setting-tab
          v-else-if="settingTab === 'video'"
          :mode="SettingMode.DETAIL"
          :with-preview="false"
        ></video-setting-tab>
      </Drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { TUIRoomEngine, TUIRoomEvents,  TRTCDeviceType, TRTCDeviceState } from '@tencentcloud/tuiroom-engine-wx';
import IconButton from '../common/IconButton.vue';
import { SettingMode } from '../../constants/render';
import AudioSettingTab from '../base/AudioSettingTab.vue';
import VideoSettingTab from '../base/VideoSettingTab.vue';
import AudioIcon from '../base/AudioIcon.vue';
import { useRoomStore } from '../../stores/room';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from '../../locales';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { isElectronEnv } from '../../utils/utils';
import Drawer from '../../elementComp/Drawer.vue';
import TUIMessageBox from '../common/base/MessageBox';
import logger from '../../utils/common/logger';
const roomStore = useRoomStore();
const { t } = useI18n();

const audioVolume = ref(0);
const isElectron = isElectronEnv();
const roomEngine = useGetRoomEngine();

defineExpose({
  getRoomParam,
  startStreamPreview,
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

async function toggleMuteAudio() {
  isMicMuted.value = !isMicMuted.value;
  tuiRoomParam.isOpenMicrophone = !isMicMuted.value;
  if (isMicMuted.value) {
    await roomEngine.instance?.stopMicDeviceTest();
    audioVolume.value = 0;
  } else {
    await roomEngine.instance?.startMicDeviceTest({ interval: 200 });
  }
}

async function toggleMuteVideo() {
  isCameraMuted.value = !isCameraMuted.value;
  tuiRoomParam.isOpenCamera = !isCameraMuted.value;
  if (isCameraMuted.value) {
    await roomEngine.instance?.stopCameraDeviceTest();
  } else {
    await roomEngine.instance?.startCameraDeviceTest({
      view: 'stream-preview',
    });
  }
}

function getRoomParam() {
  tuiRoomParam.defaultCameraId = roomStore.currentCameraId;
  tuiRoomParam.defaultMicrophoneId = roomStore.currentMicrophoneId;
  tuiRoomParam.defaultSpeakerId = roomStore.currentSpeakerId;
  return tuiRoomParam;
}

const onUserVoiceVolume = (result: any) => {
  audioVolume.value = result;
};

async function startStreamPreview() {
  const cameraList = await roomEngine.instance?.getCameraDevicesList();
  const microphoneList = await roomEngine.instance?.getMicDevicesList();
  const speakerList = await roomEngine.instance?.getSpeakerDevicesList();

  const hasCameraDevice = cameraList && cameraList.length > 0;
  const hasMicrophoneDevice = microphoneList && microphoneList.length > 0;
  let alertMessage = '';
  if (hasCameraDevice && !hasMicrophoneDevice) {
    alertMessage = 'Microphone not detected on current device';
  } else if (!hasCameraDevice && hasMicrophoneDevice) {
    alertMessage = 'Camera not detected on current device';
  } else if (!hasCameraDevice && !hasMicrophoneDevice) {
    alertMessage = 'Camera And Microphone not detected on current device';
  }
  if (alertMessage) {
    TUIMessageBox({
      title: t('Note'),
      message: t(alertMessage),
      confirmButtonText: t('Sure'),
      appendToRoomContainer: true,
    });
  }

  cameraList && roomStore.setCameraList(cameraList);
  microphoneList && roomStore.setMicrophoneList(microphoneList);
  speakerList && roomStore.setSpeakerList(speakerList);
  const cameraInfo = roomEngine.instance?.getCurrentCameraDevice();
  const micInfo = roomEngine.instance?.getCurrentMicDevice();
  const speakerInfo = roomEngine.instance?.getCurrentSpeakerDevice();
  if (cameraInfo && cameraInfo.deviceId) {
    roomStore.setCurrentCameraId(cameraInfo.deviceId);
  }
  if (micInfo && micInfo.deviceId) {
    roomStore.setCurrentMicrophoneId(micInfo.deviceId);
  }
  if (speakerInfo && speakerInfo.deviceId) {
    roomStore.setCurrentSpeakerId(speakerInfo.deviceId);
  }

  if (hasCameraDevice) {
    await roomEngine.instance?.startCameraDeviceTest({ view: 'stream-preview' });
  }
  if (hasMicrophoneDevice) {
    await roomEngine.instance?.startMicDeviceTest({ interval: 200 });
  }
  loading.value = false;
}


/**
 * Device changes: device switching, device plugging and unplugging events
 *
 * 设备变化：设备切换、设备插拔事件
 **/
async function onDeviceChange(eventInfo: {deviceId: string, type: number, state: number}) {
  const stateList = ['add', 'remove', 'active'];
  const { deviceId, type, state } = eventInfo;
  if (type === TRTCDeviceType.TRTCDeviceTypeMic) {
    logger.log(`onDeviceChange: deviceId: ${deviceId}, type: microphone, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getMicDevicesList();
    roomStore.setMicrophoneList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentMicrophoneId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeSpeaker) {
    logger.log(`onDeviceChange: deviceId: ${deviceId}, type: speaker, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getSpeakerDevicesList();
    roomStore.setSpeakerList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentSpeakerId(deviceId);
    }
    return;
  }
  if (type === TRTCDeviceType.TRTCDeviceTypeCamera) {
    logger.log(`onDeviceChange: deviceId: ${deviceId}, type: camera, state: ${stateList[state]}`);
    const deviceList = await roomEngine.instance?.getCameraDevicesList();
    roomStore.setCameraList(deviceList);
    if (state === TRTCDeviceState.TRTCDeviceStateActive) {
      roomStore.setCurrentCameraId(deviceId);
    }
  }
}

TUIRoomEngine.once('ready', async () => {
  // 兼容没有打开音频前，roomEngine 没有抛出音量事件的问题
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  trtcCloud?.on('onTestMicVolume', onUserVoiceVolume);

  roomEngine.instance?.on(TUIRoomEvents.onDeviceChange, onDeviceChange);
});

onBeforeUnmount(async () => {
  await roomEngine.instance?.stopCameraDeviceTest();
  await roomEngine.instance?.stopMicDeviceTest();

  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  trtcCloud?.off('onTestMicVolume', onUserVoiceVolume);
  roomEngine.instance?.off(TUIRoomEvents.onDeviceChange, onDeviceChange);
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
  isSettingOpen.value = false;
  done();
}

</script>

<style lang="scss">
@import '../../assets/style/element-custom.scss';

.stream-container {
  width: 740px;
  height: 476px;
  background-color: #12141A;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  border: 2px solid var(--stream-container-border);
  box-shadow: 0px 12px 24px rgba(2, 108, 254, 0.1), inset 0px 0px 4px rgba(55, 69, 111, 0.325503);
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
    background-color: var(--stream-info-bg-color);
    align-items: center;
    .attention-info {
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
    background: var(--control-region-bg-color);
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

.drawer-container div {
  pointer-events: auto;
}

.drawer-container > div {
  pointer-events: none;
}

.el-drawer__header {
  height: 88px;
  border-bottom: 1px solid var(--el-drawer-divide);
  box-sizing: border-box;
  margin-bottom: 0;
  padding: 32px;
}

.el-drawer__body {
  padding: 32px;
}


</style>
