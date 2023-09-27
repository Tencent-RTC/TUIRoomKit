<template>
  <div
    v-if="playRegionDomId !== enlargeDomId"
    ref="streamRegionRef"
    class="user-stream-container"
    @dblclick="$emit('room_dblclick')"
  >
    <div v-if="loading" class="loading-region">
      <svg-icon icon-name="loading" class="loading"></svg-icon>
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
      <svg-icon v-if="showMasterIcon" class="master-icon" icon-name="user"></svg-icon>
      <audio-icon
        v-if="!isScreenStream"
        :user-id="stream.userId"
        :is-muted="!stream.hasAudioStream"
        size="small"
      ></audio-icon>
      <svg-icon v-if="isScreenStream" icon-name="screen-share" class="screen-icon"></svg-icon>
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import Avatar from '../../base/Avatar.vue';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../utils/common/logger';
import AudioIcon from '../../base/AudioIcon.vue';
import SvgIcon from '../../common/SvgIcon.vue';
import { useI18n } from '../../../locales';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { isInnerScene } from '../../../utils/constants';

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


const streamRegionRef = ref();
const centerUserInfoRef = ref();
const loading = ref(false);

const playRegionDomId = computed(() => `${props.stream.userId}_${props.stream.streamType}`);

const showMasterIcon = computed(() => {
  const { userId, streamType } = props.stream;
  return userId === roomStore.masterUserId && streamType === TUIVideoStreamType.kCameraStream;
});

const isScreenStream = computed(() => props.stream.streamType === TUIVideoStreamType.kScreenStream);
const userInfo = computed(() => {
  if (isInnerScene) {
    return `${props.stream.userName} | ${props.stream.userId}` || props.stream.userId;
  }
  return props.stream.userName || props.stream.userId;
});

// 要拉取远端用户的流类型
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
  // 播放远端流
  loading.value = true;
  roomEngine.instance?.setRemoteVideoView({ userId, streamType: streamTypeToFetch.value, view: `${playRegionDomId.value}` });
  await roomEngine.instance?.startPlayRemoteVideo({ userId, streamType: streamTypeToFetch.value });
  // 播放远端流成功
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
        // 从有流且可见状态变为有流但不可见，无流但可见，无流且不可见状态，停止播放流
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
        // 从有流且可见状态变为有流但不可见，无流但可见，无流且不可见状态，停止播放流
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
 *
 * enlargeUserId 切换的时候需要让之前播放流对应的小窗口和需要新播放的流都重新播放
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
           *
           * 只有当本地视频流是打开状态的时候，才重新播放本地流
          **/
          if (props.stream.hasVideoStream) {
            await roomEngine.instance?.setLocalVideoView({
              streamType: streamTypeToFetch.value,
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
@import '../../../assets/style/var.scss';

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.user-stream-container {
  position: relative;
  .stream-region {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #000000;
  }
  .loading-region {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    .loading {
      animation: loading-rotate 0.7s linear infinite;
    }
  }
  .corner-user-info-container {
    position: absolute;
    bottom: 4px;
    left: 0;
    min-width: 118px;
    max-width: 100%;
    overflow: hidden;
    height: 30px;
    display: flex;
    background: rgba(0,0,0,0.60);
    color: $whiteColor;
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
    .master-icon {
      margin-left: 0;
      width: 30px;
      height: 30px;
      background-size: cover;
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
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--center-user-info-container-bg-color);
    .avatar-region {
        width: 130px;
        height: 130px;
        border-radius: 50%;
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
