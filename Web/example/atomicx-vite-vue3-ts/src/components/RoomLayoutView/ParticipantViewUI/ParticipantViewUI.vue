<template>
  <div
    class="stream-cover-container"
  >
    <div v-if="participant.cameraStatus === DeviceStatus.Off" class="center-user-info-container">
      <Avatar
        class="avatar-region"
        size="xxl"
        :src="participant.avatarUrl"
        :user-id="participant.userId"
      />
    </div>
    <div class="corner-user-info-container">
      <div
        v-if="showIcon"
        :class="showMasterIcon ? 'master-icon' : 'admin-icon'"
      >
        <IconUser />
      </div>
      <div v-if="!isScreenStream" :class="['audio-icon-container']">
        <div class="audio-level-container">
          <div class="audio-level" :style="audioLevelStyle" />
        </div>
        <IconMicOff
          v-if="participant.microphoneStatus === DeviceStatus.Off"
          class="audio-icon"
          size="20"
        />
        <IconMicOn
          v-else
          class="audio-icon"
          size="20"
        />
      </div>
      <IconScreenOpen
        v-if="isScreenStream"
        class="screen-icon"
        size="18"
      />
      <span
        :class="['user-name', 'is-pc']"
        :title="displayName"
      >
        {{ displayName }}
      </span>
      <span v-if="isScreenStream" class="screen-info"> {{ t('RoomView.IsSharingTheirScreen') }} </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';
import {
  IconScreenOpen,
  IconUser,
  IconMicOff,
  IconMicOn,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { Avatar, RoomParticipantRole, DeviceStatus, VideoStreamType, useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();

interface Props {
  participant: RoomParticipant;
  streamType: VideoStreamType;
}
const props = defineProps<Props>();

const { speakingUsers } = useRoomParticipantState();

const activeSpeaking = computed(() => {
  const currentSpeakingVolume = speakingUsers.value.get(props.participant.userId);
  if (!currentSpeakingVolume) {
    return false;
  }
  return currentSpeakingVolume > 0;
});

const speakingAudioVolume = computed(() => speakingUsers.value.get(props.participant.userId) || 0);

const audioLevelStyle = computed(() => {
  if (props.participant.microphoneStatus === DeviceStatus.Off || !activeSpeaking.value) {
    return '';
  }
  return `height: ${speakingAudioVolume.value * 4}%`;
});

const displayName = computed(() => props.participant.nameCard || props.participant.userName || props.participant.userId);

const showMasterIcon = computed(() => {
  const { role } = props.participant;
  return role === RoomParticipantRole.Owner && props.streamType === VideoStreamType.Camera;
});

const showAdminIcon = computed(() => {
  const { role } = props.participant;
  return (role === RoomParticipantRole.Admin && props.streamType === VideoStreamType.Camera);
});

const showIcon = computed(() => showMasterIcon.value || showAdminIcon.value);
const isScreenStream = computed(() => props.streamType === VideoStreamType.Screen);
</script>

<style lang="scss" scoped>
.stream-cover-container {
  $border-width: 2px;

  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: $border-width solid transparent;
  border-radius: 12px;
  pointer-events: none;

  &.border {
    border: $border-width solid var(--uikit-color-green-5);
  }

  .center-user-info-container {
    position: absolute;
    top: 0 - $border-width;
    left: 0 - $border-width;
    width: calc(100% + $border-width * 2);
    height: calc(100% + $border-width * 2);
    background-color: var(--bg-color-bubble-reciprocal);

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      content: '';
      background-color: var(--bg-color-bubble-reciprocal);
    }

    .avatar-region {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .corner-user-info-container {
    position: absolute;
    bottom: 8px;
    left: 8px;
    display: flex;
    align-content: center;
    align-items: center;
    box-sizing: border-box;
    min-width: 118px;
    max-width: calc(100% - 24px);
    padding-right: 10px;
    height: 32px;
    overflow: hidden;
    font-size: 14px;
    color: var(--uikit-color-white-1);
    border-radius: 16px;
    background-color: var(--uikit-color-black-5);

    .master-icon,
    .admin-icon {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-left: 0;
      border-radius: 50%;
      background-color: var(--button-color-primary-default);
    }

    .admin-icon {
      background-color: var(--text-color-warning);
    }

    .audio-icon-container {
      margin-left: 4px;
      position: relative;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      min-width: 20px;
      &:first-child {
        margin-left: 8px;
      }
      .audio-level-container {
        position: absolute;
        top: 2px;
        left: 6px;
        display: flex;
        flex-flow: column-reverse wrap;
        justify-content: space-between;
        width: 8px;
        height: 12px;
        overflow: hidden;
        border-radius: 4px;

        .audio-level {
          width: 100%;
          background-color: var(--text-color-success);
          transition: height 0.2s;
        }
      }

      .audio-icon {
        position: absolute;
        top: 0;
        left: 0;
      }
    }

    .user-name {
      margin-left: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .screen-icon {
      flex-shrink: 0;
      min-width: 0;
      color: var(--uikit-color-white-1);
      margin-left: 4px;
      margin-right: 2px;
    }

    .screen-info {
      margin-left: 4px;
      font-size: 12px;
      color: var(--uikit-color-white-1);
      flex-shrink: 0;
      min-width: 0;
    }
  }
}
</style>
