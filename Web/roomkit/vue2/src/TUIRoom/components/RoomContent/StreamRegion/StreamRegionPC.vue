<template>
  <div
    v-if="playRegionDomId !== enlargeDomId"
    ref="streamRegionRef"
    class="user-stream-container"
    @dblclick="$emit('room-dblclick')"
  >
    <local-screen-stream
      v-if="isLocalScreen"
      :is-mini-region="isMiniRegion"
    ></local-screen-stream>
    <template v-else>
      <div v-if="loading" class="loading-region">
        <svg-icon :icon="LoadingIcon" class="loading"></svg-icon>
      </div>
      <div :id="playRegionDomId" class="stream-region"></div>
      <div
        v-if="!stream.hasVideoStream && !stream.hasScreenStream"
        ref="centerUserInfoRef"
        class="center-user-info-container"
      >
        <Avatar class="avatar-region" :img-src="stream.avatarUrl"></Avatar>
      </div>
      <div class="corner-user-info-container">
        <div v-if="showIcon" :class="showMasterIcon ? 'master-icon' : 'admin-icon' ">
          <user-icon></user-icon>
        </div>
        <audio-icon
          v-if="!isScreenStream"
          :user-id="stream.userId"
          :is-muted="!stream.hasAudioStream"
          size="small"
        ></audio-icon>
        <svg-icon v-if="isScreenStream" :icon="ScreenOpenIcon" class="screen-icon"></svg-icon>
        <span class="user-name" :title="userInfo">{{ userInfo }}</span>
        <span v-if="isScreenStream"> {{ t('is sharing their screen') }} </span>
      </div>
      <!-- <div v-if="stream.isVideoMuted" ref="centerUserInfoRef" class="center-user-info-container">
        <div class="user-info">
          <img class="avatar-region" :src="stream.avatarUrl || defaultAvatar">
          <div class="user-gender-name">
            <svg-icon icon-name="user" size="medium"></svg-icon>
            <span class="user-name">{{ stream.userName || stream.userId }}</span>
          </div>
        </div>
      </div> -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import Avatar from '../../common/Avatar.vue';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../utils/common/logger';
import AudioIcon from '../../common/AudioIcon.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import UserIcon from '../../common/icons/UserIcon.vue';
import LoadingIcon from '../../common/icons/LoadingIcon.vue';
import { useI18n } from '../../../locales';
import { TUIRole, TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { isInnerScene } from '../../../utils/constants';
import ScreenOpenIcon from '../../common/icons/ScreenOpenIcon.vue';
import LocalScreenStream from '../LocalScreenStream/index.vue';

const roomEngine = useGetRoomEngine();

const logPrefix = '[StreamRegion]';
const basicStore = useBasicStore();
const roomStore = useRoomStore();

const { t } = useI18n();

interface Props {
  stream: StreamInfo,
  enlargeDomId?: string,
  changeLargeStream?:boolean,
}

const props = defineProps<Props>();
defineEmits(['room-dblclick']);

// Whether it is a local screen sharing placeholder window
const isLocalScreen = computed(() => (
  props.stream
  && (props.stream.userId === basicStore.userId && props.stream.streamType === TUIVideoStreamType.kScreenStream)
));

// Whether it is a small window
const isMiniRegion = computed(() => !!(props.enlargeDomId && `${props.stream.userId}_${props.stream.streamType}` !== props.enlargeDomId));

const streamRegionRef = ref();
const centerUserInfoRef = ref();
const loading = ref(false);

const playRegionDomId = computed(() => `${props.stream.userId}_${props.stream.streamType}`);

const showMasterIcon = computed(() => {
  const { userId, streamType } = props.stream;
  return userId === roomStore.masterUserId && streamType === TUIVideoStreamType.kCameraStream;
});

const showAdminIcon = computed(() => {
  const { userId, streamType } = props.stream;
  return roomStore.getUserRole(userId) === TUIRole.kAdministrator
    && streamType === TUIVideoStreamType.kCameraStream;
});

const showIcon = computed(() => showMasterIcon.value || showAdminIcon.value);
const isScreenStream = computed(() => props.stream.streamType === TUIVideoStreamType.kScreenStream);
const userInfo = computed(() => {
  if (isInnerScene) {
    return `${props.stream.nameCard || props.stream.userName} | ${props.stream.userId}`;
  }
  return props.stream.nameCard || props.stream.userName || props.stream.userId;
});

watch(
  () => props.stream.hasVideoStream,
  async (val) => {
    if (props.stream.userId === basicStore.userId && props.stream.streamType === TUIVideoStreamType.kCameraStream) {
      if (val) {
        await nextTick();
        const userIdEl = document?.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
        if (userIdEl) {
          logger.debug(`${logPrefix}watch isVideoStreamAvailable:`, props.stream.userId, userIdEl);
          await roomEngine.instance?.setLocalVideoView({
            view: `${playRegionDomId.value}`,
          });
        }
      } else {
        await roomEngine.instance?.setLocalVideoView({
          view: null,
        });
      }
    }
  },
  { immediate: true },
);

// The stream type to be pulled from the remote user
const streamTypeToFetch = computed(() => {
  const { streamType, userId } = props.stream;
  const { kScreenStream, kCameraStream } = TUIVideoStreamType;
  const { defaultStreamType } = roomStore;
  const { userId: localUserId } = basicStore;
  if (streamType === kScreenStream) {
    return kScreenStream;
  }
  if (playRegionDomId.value === props.enlargeDomId || userId === localUserId) {
    return kCameraStream;
  }
  if (streamType === kCameraStream) {
    return defaultStreamType;
  }
  return streamType;
});

const startPlayRemoteVideo = async () => {
  const { userId } = props.stream;
  // Play remote stream
  loading.value = true;
  roomEngine.instance?.setRemoteVideoView({ userId, streamType: streamTypeToFetch.value, view: `${playRegionDomId.value}` });
  await roomEngine.instance?.startPlayRemoteVideo({ userId, streamType: streamTypeToFetch.value });
  // Playing remote stream successfully
  loading.value = false;
};

const stopPlayRemoteVideo = async () => {
  loading.value = false;
  await roomEngine.instance?.
    stopPlayRemoteVideo({ userId: props.stream.userId, streamType: streamTypeToFetch.value });
};

if (props.stream.streamType === TUIVideoStreamType.kCameraStream
  || props.stream.streamType === TUIVideoStreamType.kCameraStreamLow) {
  watch(
    () => [props.stream.hasVideoStream, props.stream.isVisible],
    async (val, oldVal) => {
      if (props.stream.userId === basicStore.userId) {
        return;
      }
      const [hasVideoStream, isVisible] = val;
      if (hasVideoStream && isVisible) {
        await nextTick();
        const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
        if (userIdEl) {
          logger.debug(`${logPrefix}watch isVideoStreamAvailable:`, props.stream.userId, userIdEl);
          await startPlayRemoteVideo();
        }
      }
      if (oldVal) {
        const [oldHasVideoStream, oldIsVisible] = oldVal;
        // From flow and visible state to flow but invisible, no stream but visible, no stream and invisible state, stop playing the stream
        if ((oldHasVideoStream && oldIsVisible) && (!hasVideoStream || !isVisible)) {
          await stopPlayRemoteVideo();
        }
      }
    },
    { immediate: true },
  );
}

if (props.stream.streamType === TUIVideoStreamType.kScreenStream) {
  watch(
    () => [props.stream.hasScreenStream, props.stream.isVisible],
    async (val, oldVal) => {
      if (props.stream.userId === basicStore.userId) {
        return;
      }
      const [hasScreenStream, isVisible] = val;
      if (hasScreenStream && isVisible) {
        await nextTick();
        const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
        if (userIdEl) {
          logger.debug(`${logPrefix}watch isScreenStreamAvailable:`, props.stream.userId, userIdEl);
          await startPlayRemoteVideo();
        }
      }
      if (oldVal) {
        const [oldHasScreenStream, oldIsVisible] = oldVal;
        // From flow and visible state to flow but invisible, no stream but visible, no stream and invisible state, stop playing the stream
        if ((oldHasScreenStream && oldIsVisible) && (!hasScreenStream || !isVisible)) {
          await stopPlayRemoteVideo();
        }
      }
    },
    { immediate: true },
  );
}


/**
 * enlargeUserId The switch requires that both the small window
 * corresponding to the previously played stream and the stream that needs to be newly played be replayed.
**/
watch(
  () => props.enlargeDomId,
  async (val, oldVal) => {
    if (playRegionDomId.value === oldVal || playRegionDomId.value === val) {
      await nextTick();
      const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
      if (userIdEl) {
        if (basicStore.userId === props.stream.userId) {
          /**
           * Replay local video streams only when they are open
          **/
          if (props.stream.hasVideoStream) {
            await roomEngine.instance?.setLocalVideoView({
              view: `${playRegionDomId.value}`,
            });
          }
        } else {
          await startPlayRemoteVideo();
        };
      }
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.tui-theme-white .user-stream-container {
  --screen-font-color: #8F9AB2;
  --user-has-no-camera-bg-color: rgba(228, 232, 238, 0.40);
  --user-info-container-bg-color: rgba(18, 23, 35, 0.80);
}

.tui-theme-black .user-stream-container {
  --screen-font-color: #B2BBD1;
  --user-has-no-camera-bg-color: rgba(34, 38, 46, 0.50);
  --user-info-container-bg-color: rgba(34, 38, 46, 0.80);
}

.user-stream-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background-color: #000000;

  .stream-region {
    width: 100%;
    height: 100%;
    overflow: hidden;
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
    min-width: 118px;
    max-width: 100%;
    overflow: hidden;
    height: 32px;
    border-radius: 16px;
    display: flex;
    background: var(--user-info-container-bg-color);
    color: #FFFFFF;
    align-items: center;
    align-content: center;
    padding: 0 10px 0 0;
    font-size: 14px;
    > *{
      margin-left: 8px;
      max-width: 160px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .master-icon,
    .admin-icon {
      margin-left: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--active-color-1);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .admin-icon {
      background-color: var(--orange-color);
    }
    .screen-icon {
      transform: scale(0.8);
      background-size: cover;
    }
  }
  .center-user-info-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--background-color-1);
    &::before {
      content: '';
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background-color: var(--user-has-no-camera-bg-color);
    }
    .avatar-region {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(130px, 40%);
      padding-top: min(130px, 40%);
      height: 0;
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
          margin-left: 6px;
          font-size: 14px;
          font-weight: 400;
          max-width: 100px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          vertical-align: bottom;
        }
      }
    }
  }
}
</style>
