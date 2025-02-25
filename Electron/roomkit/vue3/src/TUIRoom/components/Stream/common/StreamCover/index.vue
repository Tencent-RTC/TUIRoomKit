<template>
  <div
    class="stream-cover-container"
    :class="[showVoiceBorder ? 'border' : '']"
  >
    <div v-if="streamInfo.isLoading" class="loading-region">
      <svg-icon :icon="LoadingIcon" class="loading" />
    </div>
    <div v-if="!streamInfo.hasVideoStream" class="center-user-info-container">
      <Avatar class="avatar-region" :img-src="userInfo?.avatarUrl" />
    </div>
    <div class="corner-user-info-container">
      <div
        v-if="showIcon"
        :class="showMasterIcon ? 'master-icon' : 'admin-icon'"
      >
        <user-icon />
      </div>
      <audio-icon
        v-if="!isScreenStream"
        :class="['audio-icon', { 'is-mobile': isMobile }]"
        :user-id="streamInfo.userId"
        :is-muted="!streamInfo.hasAudioStream"
        size="small"
      />
      <svg-icon
        v-if="isScreenStream"
        :icon="ScreenOpenIcon"
        class="screen-icon"
      />
      <span
        :class="['user-name', isPC ? 'is-pc' : 'is-mobile']"
        :title="displayName"
        >{{ displayName }}
      </span>
      <span v-if="isScreenStream"> {{ t('is sharing their screen') }} </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { StreamInfo, useRoomStore } from '../../../../stores/room';
import Avatar from '../../../common/Avatar.vue';
import AudioIcon from '../../../common/AudioIcon.vue';
import SvgIcon from '../../../common/base/SvgIcon.vue';
import UserIcon from '../../../common/icons/UserIcon.vue';
import { useI18n } from '../../../../locales';
import { TUIRole, TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-electron';
import { isInnerScene } from '../../../../utils/constants';
import ScreenOpenIcon from '../../../common/icons/ScreenOpenIcon.vue';
import { isPC, isMobile } from '../../../../utils/environment';
import { storeToRefs } from 'pinia';
import LoadingIcon from '../../../common/icons/LoadingIcon.vue';

const roomStore = useRoomStore();

const { t } = useI18n();

interface Props {
  streamInfo: StreamInfo;
  enlargeDomId?: string;
  changeLargeStream?: boolean;
}
const props = defineProps<Props>();
const { userVolumeObj } = storeToRefs(roomStore);
const userInfo = computed(() => roomStore.userInfoObj[props.streamInfo.userId]);

const displayName = computed(() => {
  if (isInnerScene) {
    return `${roomStore.getDisplayName(props.streamInfo.userId)} | ${props.streamInfo.userId}`;
  }
  return roomStore.getDisplayName(props.streamInfo.userId);
});

const showMasterIcon = computed(() => {
  const { userId, streamType } = props.streamInfo;
  return (
    userId === roomStore.masterUserId &&
    streamType === TUIVideoStreamType.kCameraStream
  );
});

const showAdminIcon = computed(() => {
  const { userId, streamType } = props.streamInfo;
  return (
    roomStore.getUserRole(userId) === TUIRole.kAdministrator &&
    streamType === TUIVideoStreamType.kCameraStream
  );
});

const showVoiceBorder = computed(() => {
  if (isPC) {
    return false;
  }
  return (
    props.streamInfo.hasAudioStream &&
    userVolumeObj.value[props.streamInfo.userId] !== 0
  );
});

const showIcon = computed(() => showMasterIcon.value || showAdminIcon.value);
const isScreenStream = computed(
  () => props.streamInfo.streamType === TUIVideoStreamType.kScreenStream
);
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

  @keyframes loading-rotate {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .loading-region {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    .loading {
      animation: loading-rotate 1.5s linear infinite;
    }
  }

  .corner-user-info-container {
    position: absolute;
    bottom: 8px;
    left: 8px;
    display: flex;
    align-content: center;
    align-items: center;
    min-width: 118px;
    max-width: 100%;
    height: 32px;
    padding: 0 10px 0 0;
    overflow: hidden;
    font-size: 14px;
    color: var(--uikit-color-white-1);
    border-radius: 16px;
    background-color: var(--uikit-color-black-5);

    .user-name {
      margin-left: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.is-pc {
        max-width: 160px;
      }

      &.is-mobile {
        max-width: 60px;
        margin-left: 4px;
      }
    }

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

    .audio-icon {
      margin-left: 8px;

      &.is-mobile {
        max-width: 26px;
        max-height: 35px;
        margin-left: 4px;
      }
    }

    .screen-icon {
      background-size: cover;
      transform: scale(0.8);
    }
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
      width: min(130px, 40%);
      height: 0;
      padding-top: min(130px, 40%);
      transform: translate(-50%, -50%);
    }

    .user-info {
      width: 130px;
      text-align: center;

      .avatar-region {
        width: 130px;
        height: 130px;
        border-radius: 50%;
      }

      .user-gender-name {
        svg {
          vertical-align: bottom;
        }

        .user-name {
          display: inline-block;
          max-width: 100px;
          margin-left: 6px;
          overflow: hidden;
          font-size: 14px;
          font-weight: 400;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: bottom;
          color: var(--uikit-color-white-1);
        }
      }
    }
  }
}
</style>
