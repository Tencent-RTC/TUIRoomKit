<template>
  <div v-if="playRegionDomId !== enlargeDomId" ref="streamRegionRef" class="user-stream-container">
    <div :id="playRegionDomId" class="stream-region"></div>
    <div
      v-if="!stream.hasVideoStream && !stream.hasScreenStream"
      ref="centerUserInfoRef"
      class="center-user-info-container"
    >
      <img class="avatar-region" :src="stream.avatarUrl || defaultAvatar">
    </div>
    <div class="corner-user-info-container">
      <svg-icon v-if="showMasterIcon" class="master-icon" icon-name="user"></svg-icon>
      <audio-icon
        v-if="!isScreenStream"
        :audio-volume="stream.audioVolume"
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
import { StreamInfo, useRoomStore } from '../../stores/room';
import defaultAvatar from '../../assets/imgs/avatar.png';
import { useBasicStore } from '../../stores/basic';
import logger from '../../utils/common/logger';
import AudioIcon from '../base/AudioIcon.vue';
import SvgIcon from '../common/SvgIcon.vue';
import { useI18n } from 'vue-i18n';
import { TUIVideoStreamType, TRTCVideoStreamType, TRTCVideoFillMode, TRTCVideoMirrorType, TRTCVideoRotation } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../hooks/useRoomEngine';

const { VITE_RUNTIME_SCENE } = import.meta.env;

const roomEngine = useGetRoomEngine();

const logPrefix = '[StreamRegion]';
const basicStore = useBasicStore();
const roomStore = useRoomStore();

const { t } = useI18n();

interface Props {
  stream: StreamInfo,
  enlargeDomId?: string,
}

const props = defineProps<Props>();

const streamRegionRef = ref();
const centerUserInfoRef = ref();

const playRegionDomId = computed(() => `${props.stream.userId}_${props.stream.streamType}`);

const showMasterIcon = computed(() => {
  const { userId, streamType } = props.stream;
  return userId === roomStore.masterUserId && streamType === TUIVideoStreamType.kCameraStream;
});

const isScreenStream = computed(() => props.stream.streamType === TUIVideoStreamType.kScreenStream);

const userInfo = computed(() => {
  if (VITE_RUNTIME_SCENE === 'inner') {
    return `${props.stream.userName} | ${props.stream.userId}` || props.stream.userId;
  }
  return props.stream.userName || props.stream.userId;
});

watch(
  () => props.stream.hasVideoStream,
  async (val) => {
    if (val && props.stream.userId !== basicStore.userId) {
      await nextTick();
      const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
      if (userIdEl) {
        logger.debug(`${logPrefix}watch isVideoStreamAvailable:`, props.stream.userId, userIdEl);
        roomEngine.instance?.setRemoteRenderView({ userId: props.stream.userId, streamType: props.stream.streamType, view: `${playRegionDomId.value}` });
        await roomEngine.instance?.
          startPlayRemoteVideo({ userId: props.stream.userId, streamType: props.stream.streamType });
        const trtcCloud = roomEngine.instance?.getTRTCCloud();
        await trtcCloud.setRemoteRenderParams(props.stream.userId, TRTCVideoStreamType.TRTCVideoStreamTypeBig, {
          mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
          rotation: TRTCVideoRotation.TRTCVideoRotation0,
          fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fit,
        });
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.stream.hasScreenStream,
  async (val) => {
    if (val) {
      await nextTick();
      const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
      if (userIdEl) {
        logger.debug(`${logPrefix}watch isScreenStreamAvailable:`, props.stream.userId, userIdEl);
        roomEngine.instance?.setRemoteRenderView({ userId: props.stream.userId, streamType: props.stream.streamType, view: `${playRegionDomId.value}` });
        await roomEngine.instance?.startPlayRemoteVideo({
          userId: props.stream.userId,
          streamType: props.stream.streamType,
        });
        const trtcCloud = roomEngine.instance?.getTRTCCloud();
        await trtcCloud.setRemoteRenderParams(props.stream.userId, TRTCVideoStreamType.TRTCVideoStreamTypeSub, {
          mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
          rotation: TRTCVideoRotation.TRTCVideoRotation0,
          fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fit,
        });
      }
    }
  },
  { immediate: true },
);

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
            await roomEngine.instance?.setLocalRenderView({
              streamType: TUIVideoStreamType.kCameraStream,
              view: `${playRegionDomId.value}`,
            });
          }
        } else {
          roomEngine.instance?.setRemoteRenderView({ userId: props.stream.userId, streamType: props.stream.streamType, view: `${playRegionDomId.value}` });
          await roomEngine.instance?.startPlayRemoteVideo({
            userId: props.stream.userId,
            streamType: props.stream.streamType,
          });
        };
      }
    }
  },
);

// watch(
//   playRegionDomId,
//   async () => {
//     await nextTick();
//     const userIdEl = document.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
//     if (userIdEl) {
//       if (basicStore.userId !== props.stream.userId) {
//         if (props.stream.type === 'main') {
//           logger.debug(`${logPrefix}watch playRegionDomId:`, props.stream.userId, userIdEl, ETUIStreamType.CAMERA);
//           TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.CAMERA);
//         } else if (props.stream.type === 'screen') {
//           logger.debug(`${logPrefix}watch playRegionDomId:`, props.stream.userId, userIdEl, ETUIStreamType.SCREEN);
//           TUIRoomCore.startRemoteView(props.stream.userId as string, userIdEl, ETUIStreamType.SCREEN);
//         }
//       }
//     }
//   },
// );

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
    overflow: hidden;
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
