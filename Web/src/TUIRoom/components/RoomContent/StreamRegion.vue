<template>
  <div v-if="playRegionDomId !== enlargeDomId" ref="streamRegionRef" class="user-stream-container">
    <div :id="playRegionDomId" class="stream-region"></div>
    <div
      v-if="!stream.isVideoStreamAvailable && !stream.isScreenStreamAvailable"
      ref="centerUserInfoRef"
      class="center-user-info-container"
    >
      <img class="avatar-region" :src="stream.userAvatar || defaultAvatar">
    </div>
    <div class="corner-user-info-container">
      <svg-icon v-if="showMasterIcon" class="master-icon" icon-name="user"></svg-icon>
      <audio-icon
        v-if="!isScreenStream"
        :audio-volume="stream.audioVolume"
        :is-muted="!stream.isAudioStreamAvailable"
        size="small"
      ></audio-icon>
      <svg-icon v-if="isScreenStream" icon-name="screen-share" class="screen-icon"></svg-icon>
      <span class="user-name">{{ userInfo }}</span>
    </div>
    <!-- <div v-if="stream.isVideoMuted" ref="centerUserInfoRef" class="center-user-info-container">
      <div class="user-info">
        <img class="avatar-region" :src="stream.userAvatar || defaultAvatar">
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
import { StreamInfo } from '../../stores/stream';
import defaultAvatar from '../../assets/imgs/avatar.png';
import TUIRoomCore, { ETUIStreamType } from '../../tui-room-core';
import { useBasicStore } from '../../stores/basic';
import logger from '../../tui-room-core/common/logger';
import AudioIcon from '../base/AudioIcon.vue';
import SvgIcon from '../common/SvgIcon.vue';
const logPrefix = '[StreamRegion]';
const basicStore = useBasicStore();

interface Props {
  stream: StreamInfo,
  enlargeDomId?: string,
}

const props = defineProps<Props>();

const streamRegionRef = ref();
const centerUserInfoRef = ref();

const playRegionDomId = computed(() => `${props.stream.userId}_${props.stream.type}`);

const showMasterIcon = computed(() => props.stream.userId === basicStore.masterUserId && props.stream.type === 'main');

const isScreenStream = computed(() => (props.stream.type === 'main' && props.stream.userId?.indexOf('share_') === 0) || props.stream.type === 'screen');

const userInfo = computed(() => {
  let userInfo = props.stream.userName || props.stream.userId;
  if (isScreenStream.value) {
    if (props.stream.userId?.indexOf('share_') === 0 && userInfo === props.stream.userId) {
      userInfo = userInfo.slice(6);
    }
    return `${userInfo} 的屏幕分享`;
  }
  return userInfo;
});

watch(
  () => props.stream.isAudioStreamAvailable,
  (val) => {
    if (val && props.stream.userId !== basicStore.userId) {
      const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
      if (userIdEl) {
        logger.debug(`${logPrefix}watch isAudioStreamAvailable:`, props.stream.userId, userIdEl, ETUIStreamType.CAMERA);
        TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.CAMERA);
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.stream.isVideoStreamAvailable,
  (val) => {
    if (val && props.stream.userId !== basicStore.userId) {
      const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
      if (userIdEl) {
        logger.debug(`${logPrefix}watch isVideoStreamAvailable:`, props.stream.userId, userIdEl, ETUIStreamType.CAMERA);
        TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.CAMERA);
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.stream.isScreenStreamAvailable,
  async (val) => {
    if (val) {
      await nextTick();
      const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
      if (userIdEl) {
        logger.debug(`${logPrefix}watch isScreenStreamAvailable:`, props.stream.userId, userIdEl, ETUIStreamType.SCREEN);
        TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.SCREEN);
      }
    }
  },
  { immediate: true },
);

// enlargeUserId 切换的时候需要让之前播放流对应的小窗口和需要新播放的流都重新播放
watch(
  () => props.enlargeDomId,
  async (val, oldVal) => {
    if (playRegionDomId.value === oldVal || playRegionDomId.value === val) {
      await nextTick();
      const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
      if (userIdEl) {
        if (basicStore.userId === props.stream.userId) {
          TUIRoomCore.startCameraPreview(userIdEl);
        } else {
          if (props.stream.type === 'main') {
            logger.debug(`${logPrefix}watch enlargeDomId:`, props.stream.userId, userIdEl, ETUIStreamType.CAMERA);
            TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.CAMERA);
          } else if (props.stream.type === 'screen') {
            logger.debug(`${logPrefix}watch enlargeDomId:`, props.stream.userId, userIdEl, ETUIStreamType.SCREEN);
            TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.SCREEN);
          }
        };
      }
    }
  },
);

watch(
  playRegionDomId,
  async () => {
    await nextTick();
    const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
    if (userIdEl) {
      if (basicStore.userId !== props.stream.userId) {
        if (props.stream.type === 'main') {
          logger.debug(`${logPrefix}watch playRegionDomId:`, props.stream.userId, userIdEl, ETUIStreamType.SCREEN);
          TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.CAMERA);
        } else if (props.stream.type === 'screen') {
          logger.debug(`${logPrefix}watch playRegionDomId:`, props.stream.userId, userIdEl, ETUIStreamType.SCREEN);
          TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.SCREEN);
        }
      }
    }
  },
);

// watch(streamRegionRef.value.offsetWidth, () => {
//   centerUserInfoRef.value.style.transform = `scale(${streamRegionRef.value.offsetWidth / 1280})`;
// });

// watch(
//   () => props.stream.isVideoMuted,
//   async (val) => {
//     if (val) {
//       await nextTick();
//       centerUserInfoRef.value.style.transform = `scale(${streamRegionRef.value.offsetWidth / 1280})`;
//     }
//   },
// );


// onMounted(() => {
//   centerUserInfoRef.value.style.transform = `scale(${streamRegionRef.value.offsetWidth / 1280})`;
// });

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.user-stream-container {
  position: relative;
  .stream-region {
    width: 100%;
    height: 100%;
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
    }
    .master-icon {
      margin-left: 0;
      width: 30px;
      height: 30px;
    }
    .screen-icon {
      transform: scale(0.8);
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
    background-color: $roomBackgroundColor;
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
