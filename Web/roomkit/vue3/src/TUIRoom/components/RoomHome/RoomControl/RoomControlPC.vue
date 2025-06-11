<template>
  <div class="room-control-container">
    <div class="room-control-main">
      <div class="control-container">
        <!-- Video preview area -->
        <video-preview class="video-preview" />
        <div class="control-region">
          <!-- Microphone, Camera operating area -->
          <div class="media-control-region">
            <audio-setting
              :display-mode="MediaSettingDisplayMode.IconWithPanel"
              class="media-control-item"
            />
            <video-setting
              :display-mode="MediaSettingDisplayMode.IconWithPanel"
              :support-video-preview="false"
              class="media-control-item"
            />
          </div>
          <div class="room-control-region">
            <!-- Create room logic -->
            <div class="create-room-region">
              <TUIButton
                @click.stop="handleCreateRoom"
                size="large"
                type="primary"
              >
                <IconCreateRoom size="20" />
                <span class="button-text">{{ t('New Room') }}</span>
              </TUIButton>
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
                  <IconNext size="12" class="create-room-icon" />
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
                  <IconNext size="12" class="create-room-icon" />
                </div>
              </div>
            </div>
            <!-- Enter room logic -->
            <div class="enter-room-region">
              <TUIButton
                v-if="!showEnterRoomAction"
                @click="handleEnterRoom"
                size="large"
                type="primary"
              >
                <IconEnterRoom size="20" />
                <span class="button-text">{{ t('Join Room') }}</span>
              </TUIButton>
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
                  <IconEnterRoom size="20" />
                </div>
              </div>
            </div>
            <!-- Schedule room logic -->
            <div
              class="schedule-room-region"
              v-if="props.enableScheduledConference"
            >
              <TUIButton
                @click="scheduleConference"
                size="large"
                type="primary"
              >
                <IconScheduleRoom size="18" />
                <span class="button-text">{{ t('Schedule') }}</span>
              </TUIButton>
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
  withDefaults,
  defineProps,
  defineExpose,
  defineEmits,
  onMounted,
  onUnmounted,
} from 'vue';
import {
  TUIButton,
  IconNext,
  IconEnterRoom,
  IconCreateRoom,
  IconScheduleRoom,
} from '@tencentcloud/uikit-base-component-vue3';
import useRoomControl from './useRoomControlHooks';
import ScheduleConferencePanel from '../../ScheduleConference/ScheduleConferencePanel';
import vClickOutside from '../../../directives/vClickOutside';
import {
  AudioSetting,
  VideoSetting,
  VideoPreview,
  useAudioDeviceState,
  useVideoDeviceState,
  MediaSettingDisplayMode,
} from '../../../core';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';

const { t } = useRoomControl();
const {
  isMicrophoneTesting,
  microphone,
  currentMicrophoneId,
  currentSpeakerId,
} = useAudioDeviceState();
const { currentCameraId, isCameraTesting } = useVideoDeviceState();

const props = withDefaults(
  defineProps<{
    userName?: string;
    givenRoomId: string | null;
    enableScheduledConference?: boolean;
  }>(),
  {
    userName: '',
    enableScheduledConference: true,
  }
);
defineExpose({
  getRoomParam,
});

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

function getRoomParam() {
  tuiRoomParam.defaultCameraId = currentCameraId.value;
  tuiRoomParam.defaultMicrophoneId = currentMicrophoneId.value;
  tuiRoomParam.defaultSpeakerId = currentSpeakerId.value;
  tuiRoomParam.isOpenMicrophone = isMicrophoneTesting.value;
  tuiRoomParam.isOpenCamera = isCameraTesting.value;
  return tuiRoomParam;
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

onMounted(() => {
  TUIRoomEngine.once('ready', () => {
    microphone.startMicDeviceTest({ interval: 200 });
  });
});

onUnmounted(() => {
  microphone.stopMicDeviceTest();
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
  border-radius: 24px;
  background-color: var(--bg-color-operate);
  box-shadow:
    0px 2px 6px var(--uikit-color-black-8),
    0px 8px 18px var(--uikit-color-black-8);

  .video-preview {
    width: 100%;
    height: 400px;
    background-color: var(--uikit-color-black-1);
    border-radius: 8px;
  }

  .control-region {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

      .button-text {
        font-size: 16px;
        font-style: normal;
        font-weight: 500;
        line-height: 24px;
      }

      .create-room-region {
        position: relative;

        .create-room-items {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          cursor: pointer;
          border-radius: 10px;
          box-shadow:
            0 2px 4px var(--uikit-color-black-8),
            0 6px 10px var(--uikit-color-black-8),
            0 3px 14px var(--uikit-color-black-8);
          transform: translateX(-50%);
          background-color: var(--dropdown-color-default);

          .create-room-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 19px 32px;
            color: var(--text-color-primary);
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
              border-radius: 10px;
              background-color: var(--dropdown-color-hover);
              color: var(--text-color-link);

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
          display: flex;
          position: relative;
          width: 156px;
          height: 48px;
          padding: 0 14px;
          line-height: 50px;
          border-radius: 30px;
          background-color: var(--bg-color-operate);
          border: 2px solid var(--button-color-primary-default);
          .input {
            max-width: 88px;
            padding: 0;
            font-size: 16px;
            font-weight: 500;
            line-height: 28px;
            background-color: transparent;
            border: 0;
            outline: none;
            color: var(--text-color-secondary);

            &::placeholder {
              // https://developer.mozilla.org/en-US/docs/Web/CSS/::placeholder
              color: var(--uikit-color-gray-7);
            }
          }

          .enter-button {
            position: absolute;
            top: 2px;
            right: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 26px;
            background-color: var(--button-color-primary-disabled);

            &.active {
              cursor: pointer;
              background-color: var(--button-color-primary-active);
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
