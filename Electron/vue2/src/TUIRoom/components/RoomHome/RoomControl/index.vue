<template>
  <div class="room-control-container">
    <Logo v-show="showLogo" class="logo" />
    <div class="control-container">
      <div class="stream-preview-container">
        <div id="stream-preview" class="stream-preview"></div>
        <div class="attention-info">
          <span v-if="isCameraMuted" class="off-camera-info">{{ t('Off Camera') }}</span>
          <svg-icon v-if="isCameraLoading" :icon="LoadingIcon" class="loading"></svg-icon>
        </div>
      </div>
      <div class="control-region">
        <div class="media-control-region">
          <audio-media-control
            class="media-control-item"
            :has-more="true"
            :is-muted="isMicMuted"
            :audio-volume="audioVolume"
            @click="toggleMuteAudio"
          ></audio-media-control>
          <video-media-control
            class="media-control-item"
            :has-more="true"
            :is-muted="isCameraMuted"
            @click="toggleMuteVideo"
          ></video-media-control>
        </div>
        <div class="room-control-region">
          <div class="create-room-region">
            <tui-button class="button-item" @click.stop="handleCreateRoom">
              <svg-icon :icon="CreateRoomIcon" />
              <span class="button-text">{{ t('New Room') }}</span>
            </tui-button>
            <div
              v-if="showCreateRoomItems"
              v-click-outside="handleClickOutsideCreateRoomItems"
              class="create-room-items"
            >
              <div class="create-room-item" @click="createRoom('SpeakAfterTakingSeat')">
                <span :title="t('On-stage Speaking Room')" class="create-room-option">{{ t('On-stage Speaking Room') }}</span>
                <svg-icon class="create-room-icon" :icon="NextIcon"></svg-icon>
              </div>
              <div class="create-room-item" @click="createRoom('FreeToSpeak')">
                <span :title="t('Free Speech Room')" class="create-room-option">{{ t('Free Speech Room') }}</span>
                <svg-icon class="create-room-icon" :icon="NextIcon"></svg-icon>
              </div>
            </div>
          </div>
          <div class="enter-room-region">
            <tui-button v-if="!showEnterRoomAction" class="button-item" @click="handleEnterRoom">
              <svg-icon :icon="EnterRoomIcon" />
              <span class="button-text">{{ t('Join Room') }}</span>
            </tui-button>
            <div v-if="showEnterRoomAction" class="enter-room-action">
              <input v-model="roomId" class="input" :placeholder="t('Enter room ID')" @keyup.enter="enterRoom">
              <div :class="['enter-button', {'active': roomId.length > 0 }]" @click="enterRoom">
                <svg-icon :icon="EnterRoomIcon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import LoadingIcon from '../../common/icons/LoadingIcon.vue';
import NextIcon from '../../common/icons/NextIcon.vue';
import TuiButton from '../../common/base/Button.vue';
import Logo from '../../common/Logo.vue';
import useRoomControl from './useRoomControlHooks';
import CreateRoomIcon from '../../common/icons/CreateRoomIcon.vue';
import EnterRoomIcon from '../../common/icons/EnterRoomIcon.vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import AudioMediaControl from '../../common/AudioMediaControl.vue';
import VideoMediaControl from '../../common/VideoMediaControl.vue';
import TUIRoomEngine, { TRTCVideoMirrorType, TRTCVideoRotation, TRTCVideoFillMode, TUIRoomDeviceMangerEvents } from '@tencentcloud/tuiroom-engine-electron';
import '../../../directives/vClickOutside';
import { isEnumerateDevicesSupported, isGetUserMediaSupported } from '../../../utils/mediaAbility';
import useDeviceManager from '../../../hooks/useDeviceManager';

const roomStore = useRoomStore();
const basicStore = useBasicStore();
const {
  t,
} = useRoomControl();
const { deviceManager, initMediaDeviceList } = useDeviceManager({ listenForDeviceChange: true });

const props = withDefaults(defineProps<{
  showLogo?: boolean,
  givenRoomId: string | null,
}>(), {
  showLogo: true,
});

defineExpose({
  getRoomParam,
  startStreamPreview,
});

const roomEngine = useGetRoomEngine();
const isCameraLoading = ref(false);

const audioVolume = ref(0);
const isMicMuted = ref(false);
const isCameraMuted = ref(false);

const showCreateRoomItems = ref(false);
const showEnterRoomAction = ref(Boolean(props.givenRoomId));

const tuiRoomParam = {
  isOpenCamera: true,
  isOpenMicrophone: true,
  defaultCameraId: '',
  defaultMicrophoneId: '',
  defaultSpeakerId: '',
};

async function openCamera() {
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  await trtcCloud?.setLocalRenderParams({
    mirrorType: basicStore.isLocalStreamMirror
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
    rotation: TRTCVideoRotation.TRTCVideoRotation0,
    fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
  });
  await roomEngine.instance?.startCameraDeviceTest({
    view: 'stream-preview',
  });
}

async function closeCamera() {
  await roomEngine.instance?.stopCameraDeviceTest();
}

async function openAudio() {
  await roomEngine.instance?.startMicDeviceTest({ interval: 200 });
}

async function closeAudio() {
  await roomEngine.instance?.stopMicDeviceTest();
}

async function toggleMuteAudio() {
  isMicMuted.value = !isMicMuted.value;
  tuiRoomParam.isOpenMicrophone = !isMicMuted.value;
  if (isMicMuted.value) {
    await closeAudio();
    audioVolume.value = 0;
  } else {
    await openAudio();
  }
}

async function toggleMuteVideo() {
  isCameraMuted.value = !isCameraMuted.value;
  tuiRoomParam.isOpenCamera = !isCameraMuted.value;
  if (isCameraMuted.value) {
    await closeCamera();
  } else {
    isCameraLoading.value = true;
    await openCamera();
    isCameraLoading.value = false;
  }
}

function getRoomParam() {
  tuiRoomParam.defaultCameraId = roomStore.currentCameraId;
  tuiRoomParam.defaultMicrophoneId = roomStore.currentMicrophoneId;
  tuiRoomParam.defaultSpeakerId = roomStore.currentSpeakerId;
  return tuiRoomParam;
}

const onUserVoiceVolume = (options: { volume: number }) => {
  audioVolume.value = options.volume;
};

async function startStreamPreview() {
  if (!isEnumerateDevicesSupported) {
    return;
  }
  isCameraLoading.value = true;

  await initMediaDeviceList();

  if (!isGetUserMediaSupported) {
    isCameraLoading.value = false;
    return;
  }
  if (roomStore.microphoneList && roomStore.microphoneList.length > 0) {
    openAudio();
  }
  if (roomStore.cameraList && roomStore.cameraList.length > 0) {
    await openCamera();
  }
  isCameraLoading.value = false;
}

const roomId = ref(props.givenRoomId);

watch(() => props.givenRoomId, (val) => {
  roomId.value = val;
  showEnterRoomAction.value = Boolean(val);
}, { immediate: true });

const emit = defineEmits(['create-room', 'enter-room']);

function handleCreateRoom() {
  showCreateRoomItems.value = !showCreateRoomItems.value;
}

function handleClickOutsideCreateRoomItems() {
  if (showCreateRoomItems.value) {
    showCreateRoomItems.value = false;
  }
}

function handleEnterRoom() {
  showEnterRoomAction.value = true;
}

function createRoom(mode: string) {
  emit('create-room', mode);
}

function enterRoom() {
  if (!roomId.value) {
    return;
  }
  emit('enter-room', String(roomId.value));
}

TUIRoomEngine.once('ready', () => {
  startStreamPreview();
  deviceManager.instance?.on(TUIRoomDeviceMangerEvents.onTestMicVolume, onUserVoiceVolume);
});

onBeforeUnmount(async () => {
  await closeAudio();
  await closeCamera();
  deviceManager.instance?.off(TUIRoomDeviceMangerEvents.onTestMicVolume, onUserVoiceVolume);
});
</script>

<style lang="scss" scoped>

.tui-theme-white .control-container {
  --background-color: #FFFFFF;
  --box-shadow: 0px 8px 30px 0px rgba(197, 210, 229, 0.30), 0px 2px 3px 0px rgba(197, 210, 229, 0.30);
}

.tui-theme-black .control-container {
  --background-color: rgba(79,88,107,0.3);
  --box-shadow: 0px 4px 30px 0px rgba(34, 38, 46, 0.30), 0px 0px 3px 0px rgba(34, 38, 46, 0.30);
}

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.room-control-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  flex-direction: column;
}

.logo {
  margin-bottom: 56px;
}

.control-container {
  box-sizing: border-box;
  width: 760px;
  height: 544px;
  border-radius: 24px;
  background-color: var(--background-color);
  box-shadow: var(--box-shadow);
  padding: 20px 20px 32px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .stream-preview-container {
    width: 100%;
    height: 400px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #000000;
    position: relative;
    .stream-preview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .attention-info {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      .off-camera-info {
        font-weight: 400;
        font-size: 22px;
        line-height: 34px;
        color: #4F586B;
      }
      .loading {
        animation: loading-rotate 2s linear infinite;
      }
    }
  }
  .control-region {
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: space-between;
    .media-control-region {
      display: flex;
      align-items: center;
      position: relative;
      .media-control-item {
        &:not(:first-child) {
          margin-left: 20px;
        }
        .media-tab {
          position: absolute;
          top: -100%;
          left: 0;
        }
      }
    }
    .room-control-region {
      display: flex;
      .button-item {
        width: 206px;
        height: 60px;
        .button-text {
          font-size: 20px;
          font-style: normal;
          font-weight: 600;
          line-height: 22px;
          margin-left: 6px;
        }
      }
      .create-room-region {
        position: relative;
        .create-room-items {
          background-color: #FFFFFF;
          border-radius: 10px;
          box-shadow:
            0px 2px 4px rgba(32, 77, 141, 0.03),
            0px 6px 10px rgba(32, 77, 141, 0.06),
            0px 3px 14px rgba(32, 77, 141, 0.05);
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          cursor: pointer;
          .create-room-item {
            padding: 19px 32px;
            transition: background-color 0s, color 0s;
            display: flex;
            justify-content: space-between;
            color: #4F586B;
            &:hover {
              color: var(--active-color-1);
              .create-room-option {
                font-weight: 500;
              }
            }
            .create-room-option {
              font-size: 20px;
              font-weight: 400;
              line-height: 22px;
              white-space: nowrap;
              &::before {
                display: block;
                content: attr(title);
                font-weight: 500;
                height: 0;
                overflow: hidden;
                visibility: hidden;
              }
            }
            .create-room-icon {
              margin-left: 8px;
            }
          }
        }
      }
      .enter-room-region {
        margin-left: 20px;
        .enter-room-action {
          width: 260px;
          height: 60px;
          border-radius: 30px;
          background-color: var(--background-color);
          border: 2px solid var(--active-color-1);
          padding: 0px 24px;
          position: relative;
          line-height: 60px;
          .input {
            max-width: 140px;
            outline: none;
            background-color: transparent;
            font-size: 20px;
            font-weight: 500;
            line-height: 28px;
            padding: 0;
            border: 0;
            color: var(--font-color-1);
            --input-placeholder-color: rgba(143,154,178, 0.7);
            &::input-placeholder {
              color: var(--input-placeholder-color);
            }
            &::-webkit-input-placeholder {
              /* WebKit browsers */
              color: var(--input-placeholder-color);
            }
            &:-moz-placeholder {
              /* Mozilla Firefox 4 to 18 */
              color: var(--input-placeholder-color);
            }
            &::-moz-placeholder {
              /* Mozilla Firefox 19+ */
              color: var(--input-placeholder-color);
            }
            &::-ms-input-placeholder {
              /* Internet Explorer 10+ */
              color: var(--input-placeholder-color);
            }
          }
          .enter-button {
            width: 72px;
            height: 52px;
            background-color: #90B3F0;
            border-radius: 26px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            right: 2px;
            top: 2px;
            &.active {
              cursor: pointer;
              background-color: var(--active-color-1);
            }
          }
        }
      }
    }
  }
}
</style>
