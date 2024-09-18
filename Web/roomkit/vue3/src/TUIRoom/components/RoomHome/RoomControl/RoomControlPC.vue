<template>
  <div class="room-control-container">
    <div class="room-control-main">
      <div class="control-container">
        <!-- Video preview area -->
        <div class="stream-preview-container">
          <div id="stream-preview" class="stream-preview"></div>
          <div class="attention-info">
            <span v-if="isCameraMuted" class="off-camera-info">{{
              t('Off Camera')
            }}</span>
            <svg-icon
              v-if="isCameraLoading"
              :icon="LoadingIcon"
              class="loading"
            />
          </div>
        </div>
        <div class="control-region">
          <!-- Microphone, Camera operating area -->
          <div class="media-control-region">
            <audio-media-control
              class="media-control-item"
              :has-more="true"
              :is-muted="isMicMuted"
              :audio-volume="audioVolume"
              @click="toggleMuteAudio"
            />
            <video-media-control
              class="media-control-item"
              :has-more="true"
              :is-muted="isCameraMuted"
              @click="toggleMuteVideo"
            />
          </div>
          <div class="room-control-region">
            <!-- Create room logic -->
            <div class="create-room-region">
              <tui-button
                class="button-item"
                style="width: 170px"
                @click.stop="handleCreateRoom"
              >
                <svg-icon :icon="CreateRoomIcon" />
                <span class="button-text">{{ t('New Room') }}</span>
              </tui-button>
              <div
                v-if="showCreateRoomItems"
                v-click-outside="handleClickOutsideCreateRoomItems"
                class="create-room-items"
              >
                <div
                  class="create-room-item"
                  @click="createRoom('SpeakAfterTakingSeat')"
                >
                  <span
                    :title="t('On-stage Speaking Room')"
                    class="create-room-option"
                    >{{ t('On-stage Speaking Room') }}
                  </span>
                  <svg-icon class="create-room-icon" :icon="NextIcon" />
                </div>
                <div
                  class="create-room-item"
                  @click="createRoom('FreeToSpeak')"
                >
                  <span
                    :title="t('Free Speech Room')"
                    class="create-room-option"
                    >{{ t('Free Speech Room') }}
                  </span>
                  <svg-icon class="create-room-icon" :icon="NextIcon" />
                </div>
              </div>
            </div>
            <!-- Enter room logic -->
            <div class="enter-room-region">
              <tui-button
                v-if="!showEnterRoomAction"
                class="button-item"
                style="width: 170px"
                @click="handleEnterRoom"
              >
                <svg-icon :icon="EnterRoomIcon" />
                <span class="button-text">{{ t('Join Room') }}</span>
              </tui-button>
              <div v-if="showEnterRoomAction" class="enter-room-action">
                <input
                  v-model="roomId"
                  class="input"
                  :placeholder="t('Enter room ID')"
                  @keyup.enter="enterRoom"
                />
                <div
                  :class="[
                    'enter-button',
                    { active: roomId && roomId.length > 0 },
                  ]"
                  @click="enterRoom"
                >
                  <svg-icon :icon="EnterRoomIcon" />
                </div>
              </div>
            </div>
            <!-- Schedule room logic -->
            <div
              class="schedule-room-region"
              v-if="props.enableScheduledConference"
            >
              <tui-button
                class="button-item"
                style="width: 170px"
                @click="scheduleConference"
              >
                <svg-icon :icon="ScheduleRoomIcon" />
                <span class="button-text">{{ t('Schedule') }}</span>
              </tui-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ScheduleConferencePanel
      :visible="scheduleConferenceDialogVisible"
      :user-name="props.userName"
      @input="scheduleConferenceDialogVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onBeforeUnmount,
  withDefaults,
  defineProps,
  defineExpose,
  defineEmits,
} from 'vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import LoadingIcon from '../../common/icons/LoadingIcon.vue';
import NextIcon from '../../common/icons/NextIcon.vue';
import TuiButton from '../../common/base/Button.vue';
import useRoomControl from './useRoomControlHooks';
import CreateRoomIcon from '../../common/icons/CreateRoomIcon.vue';
import EnterRoomIcon from '../../common/icons/EnterRoomIcon.vue';
import ScheduleRoomIcon from '../../common/icons/ScheduleRoomIcon.vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import AudioMediaControl from '../../common/AudioMediaControl.vue';
import VideoMediaControl from '../../common/VideoMediaControl.vue';
import ScheduleConferencePanel from '../../ScheduleConference/ScheduleConferencePanel';
import TUIRoomEngine, {
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TRTCVideoFillMode,
  TUIRoomDeviceMangerEvents,
} from '@tencentcloud/tuiroom-engine-js';
import vClickOutside from '../../../directives/vClickOutside';
import {
  isEnumerateDevicesSupported,
  isGetUserMediaSupported,
} from '../../../utils/mediaAbility';
import useDeviceManager from '../../../hooks/useDeviceManager';

const roomStore = useRoomStore();
const basicStore = useBasicStore();
const { t } = useRoomControl();
const { deviceManager, initMediaDeviceList } = useDeviceManager({
  listenForDeviceChange: true,
});

const props = withDefaults(
  defineProps<{
    userName?: string;
    showLogo?: boolean;
    givenRoomId: string | null;
    enableScheduledConference?: boolean;
  }>(),
  {
    showLogo: true,
    userName: '',
    enableScheduledConference: true,
  }
);
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

const scheduleConferenceDialogVisible = ref(false);

const scheduleConference = () => {
  scheduleConferenceDialogVisible.value = true;
};

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
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
      : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
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
    isCameraLoading.value = false;
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

watch(
  () => props.givenRoomId,
  val => {
    roomId.value = val;
    showEnterRoomAction.value = Boolean(val);
  },
  { immediate: true }
);

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
  const roomParam = getRoomParam();
  emit('create-room', {
    roomMode: mode,
    roomParam,
    isSeatEnabled: Boolean(mode === 'SpeakAfterTakingSeat'),
  });
}

function enterRoom() {
  if (!roomId.value) {
    return;
  }
  const roomParam = getRoomParam();
  emit('enter-room', {
    roomId: String(roomId.value),
    roomParam,
  });
}

TUIRoomEngine.once('ready', () => {
  startStreamPreview();
  deviceManager.instance?.on(
    TUIRoomDeviceMangerEvents.onTestMicVolume,
    onUserVoiceVolume
  );
});

onBeforeUnmount(async () => {
  await closeAudio();
  await closeCamera();
  deviceManager.instance?.off(
    TUIRoomDeviceMangerEvents.onTestMicVolume,
    onUserVoiceVolume
  );
});
</script>

<style lang="scss" scoped>
.control-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 760px;
  height: 544px;
  padding: 20px 20px 32px;
  background-color: var(--background-color);
  border-radius: 24px;
  box-shadow: var(--box-shadow);

  .stream-preview-container {
    position: relative;
    width: 100%;
    height: 400px;
    overflow: hidden;
    background-color: #000;
    border-radius: 8px;

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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      .off-camera-info {
        font-size: 22px;
        font-weight: 400;
        line-height: 34px;
        color: #4f586b;
      }

      .loading {
        animation: loading-rotate 2s linear infinite;
      }
    }
  }

  .control-region {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 60px;

    .media-control-region {
      position: relative;
      display: flex;
      align-items: center;

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

    .create-room-option {
      font-size: 20px;
      font-weight: 400;
      line-height: 22px;
      white-space: nowrap;

      &::before {
        display: block;
        height: 0;
        overflow: hidden;
        font-weight: 500;
        visibility: hidden;
        content: attr(title);
      }
    }

    .room-control-region {
      display: flex;

      .button-item {
        width: 206px;
        height: 60px;

        .button-text {
          margin-left: 6px;
          font-size: 20px;
          font-style: normal;
          font-weight: 600;
          line-height: 22px;
        }
      }

      .create-room-region {
        position: relative;

        .create-room-items {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          cursor: pointer;
          background-color: #fff;
          border-radius: 10px;
          box-shadow:
            0 2px 4px rgba(32, 77, 141, 0.03),
            0 6px 10px rgba(32, 77, 141, 0.06),
            0 3px 14px rgba(32, 77, 141, 0.05);
          transform: translateX(-50%);

          .create-room-item {
            display: flex;
            justify-content: space-between;
            padding: 19px 32px;
            color: #4f586b;
            transition:
              background-color 0s,
              color 0s;

            .create-room-option {
              font-size: 20px;
              font-weight: 400;
              line-height: 22px;
              white-space: nowrap;

              &::before {
                display: block;
                height: 0;
                overflow: hidden;
                font-weight: 500;
                visibility: hidden;
                content: attr(title);
              }
            }

            &:hover {
              color: var(--active-color-1);

              .create-room-option {
                font-weight: 500;
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
          position: relative;
          width: 170px;
          height: 60px;
          padding: 0 14px;
          line-height: 60px;
          background-color: var(--background-color);
          border: 2px solid var(--active-color-1);
          border-radius: 30px;

          .input {
            max-width: 140px;
            padding: 0;
            font-size: 20px;
            font-weight: 500;
            line-height: 28px;
            color: var(--font-color-1);
            background-color: transparent;
            border: 0;
            outline: none;

            --input-placeholder-color: rgba(143, 154, 178, 0.7);

            &::placeholder {
              // https://developer.mozilla.org/en-US/docs/Web/CSS/::placeholder
              color: var(--input-placeholder-color);
            }
          }

          .enter-button {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: #90b3f0;
            border-radius: 26px;

            &.active {
              cursor: pointer;
              background-color: var(--active-color-1);
            }
          }
        }
      }

      .schedule-room-region {
        margin-left: 20px;
      }
    }
  }
}

.tui-theme-white .control-container {
  --background-color: #fff;
  --box-shadow: 0px 8px 30px 0px rgba(197, 210, 229, 0.3),
    0px 2px 3px 0px rgba(197, 210, 229, 0.3);
}

.tui-theme-black .control-container {
  --background-color: rgba(79, 88, 107, 0.3);
  --box-shadow: 0px 4px 30px 0px rgba(34, 38, 46, 0.3),
    0px 0px 3px 0px rgba(34, 38, 46, 0.3);
}

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.room-control-main {
  display: flex;
}
</style>
