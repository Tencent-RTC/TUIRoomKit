<template>
  <div
    v-if="playRegionDomId !== enlargeDomId && props.streamInfo.userId"
    ref="streamRegionRef"
    class="user-stream-container"
    :class="[showVoiceBorder ? 'border' : '']"
  >
    <trtc-pusher
      v-if="basicStore.userId === props.streamInfo.userId"
      :id="playRegionDomId"
      ref="pusher"
    />
    <trtc-player
      v-if="basicStore.userId !== props.streamInfo.userId"
      :id="playRegionDomId"
      ref="player"
      :stream-id="playRegionDomId"
    />
    <div v-if="!streamInfo.hasVideoStream" class="center-user-info-container">
      <Avatar class="avatar-region" :img-src="userInfo.avatarUrl" />
    </div>
    <div class="corner-user-info-container">
      <div
        v-if="showIcon"
        :class="showMasterIcon ? 'master-icon' : 'admin-icon'"
      >
        <svg-icon :icon="UserIcon" />
      </div>
      <audio-icon
        v-if="!isScreenStream"
        class="audio-icon"
        :user-id="streamInfo.userId"
        :is-muted="!streamInfo.hasAudioStream"
        size="small"
      />
      <svg-icon
        v-if="isScreenStream"
        :icon="ScreenOpenIcon"
        class="screen-icon"
      />
      <span class="user-name" :title="displayName">{{ displayName }}</span>
      <span v-if="isScreenStream"> {{ t('is sharing their screen') }} </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, defineProps } from 'vue';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import Avatar from '../../common/Avatar.vue';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../utils/common/logger';
import AudioIcon from '../../common/AudioIcon.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import UserIcon from '../../common/icons/UserIcon.vue';
import ScreenOpenIcon from '../../common/icons/ScreenOpenIcon.vue';
import { useI18n } from '../../../locales';
import {
  TUIVideoStreamType,
  TRTCVideoStreamType,
  TRTCVideoFillMode,
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TUIRole,
} from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { isInnerScene } from '../../../utils/constants';
import { storeToRefs } from 'pinia';
const roomEngine = useGetRoomEngine();

const logPrefix = '[StreamRegion]';
const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { userVolumeObj } = storeToRefs(roomStore);
const pusher = ref();
const player = ref();

const { t } = useI18n();

interface Props {
  streamInfo: StreamInfo;
  enlargeDomId?: string;
}

const props = defineProps<Props>();

const streamRegionRef = ref();
const showVoiceBorder = computed(
  () =>
    props.streamInfo.hasAudioStream &&
    userVolumeObj.value[props.streamInfo.userId] !== 0
);
const playRegionDomId = computed(
  () => `${props.streamInfo.userId}_${props.streamInfo.streamType}`
);

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

const showIcon = computed(() => showMasterIcon.value || showAdminIcon.value);

const isScreenStream = computed(
  () => props.streamInfo.streamType === TUIVideoStreamType.kScreenStream
);

const userInfo = computed(() => roomStore.userInfoObj[props.streamInfo.userId]);
const displayName = computed(() => {
  const user = roomStore.userInfoObj[props.streamInfo.userId];
  if (isInnerScene) {
    return `${user.nameCard || user.userName} | ${user.userId}`;
  }
  return user.nameCard || user.userName || user.userId;
});

onMounted(() => {
  watch(
    () => props.streamInfo.hasVideoStream,
    async val => {
      if (val) {
        await nextTick();
        if (player.value) {
          logger.debug(
            `${logPrefix}watch isVideoStreamAvailable:`,
            props.streamInfo.userId,
            player.value
          );
          if (basicStore.userId === props.streamInfo.userId) {
            if (props.streamInfo.hasVideoStream) {
              await roomEngine.instance?.setLocalVideoView({
                view: `${playRegionDomId.value}`,
              });
            }
          } else {
            await player.value.setTRTCStreamId(playRegionDomId.value);
            roomEngine.instance?.setRemoteVideoView({
              userId: props.streamInfo.userId,
              streamType: props.streamInfo.streamType,
              view: `${playRegionDomId.value}`,
            });
            await roomEngine.instance?.startPlayRemoteVideo({
              userId: props.streamInfo.userId,
              streamType: props.streamInfo.streamType,
            });
            const trtcCloud = roomEngine.instance?.getTRTCCloud();
            await trtcCloud?.setRemoteRenderParams(
              props.streamInfo.userId,
              props.streamInfo.streamType === TUIVideoStreamType.kScreenStream
                ? TRTCVideoStreamType.TRTCVideoStreamTypeSub
                : TRTCVideoStreamType.TRTCVideoStreamTypeBig,
              {
                mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
                rotation: TRTCVideoRotation.TRTCVideoRotation0,
                fillMode:
                  props.streamInfo.streamType ===
                  TUIVideoStreamType.kScreenStream
                    ? TRTCVideoFillMode.TRTCVideoFillMode_Fit
                    : TRTCVideoFillMode.TRTCVideoFillMode_Fill,
              }
            );
          }
        }
      } else {
        if (
          basicStore.userId === props.streamInfo.userId &&
          props.streamInfo.streamType === TUIVideoStreamType.kCameraStream
        ) {
          await roomEngine.instance?.setLocalVideoView({
            view: null,
          });
        }
      }
    },
    { immediate: true }
  );
});

/**
 * enlargeUserId The switch requires that both the small window
 * corresponding to the previously played stream and the stream that needs to be newly played be replayed.
 **/
onMounted(() => {
  watch(
    () => props.enlargeDomId,
    async (val, oldVal) => {
      if (playRegionDomId.value === oldVal || playRegionDomId.value === val) {
        if (basicStore.userId === props.streamInfo.userId) {
          /**
           * Replay local video streams only when they are open
           **/
          if (props.streamInfo.hasVideoStream) {
            await roomEngine.instance?.setLocalVideoView({
              view: `${playRegionDomId.value}`,
            });
          }
        } else {
          await nextTick();
          await player.value.setTRTCStreamId(playRegionDomId.value);
          roomEngine.instance?.setRemoteVideoView({
            userId: props.streamInfo.userId,
            streamType: props.streamInfo.streamType,
            view: `${playRegionDomId.value}`,
          });
          await roomEngine.instance?.startPlayRemoteVideo({
            userId: props.streamInfo.userId,
            streamType: props.streamInfo.streamType,
          });
        }
      }
    }
  );
});
</script>

<style lang="scss" scoped>
.user-stream-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 10px;
  transform: rotate(0deg);

  &.border {
    border: 2px solid #37e858;
  }

  .center-user-info-container {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: var(--center-user-info-container-bg-color);

    .avatar-region {
      width: 130px;
      height: 130px;
      border-radius: 50%;
    }
  }

  .corner-user-info-container {
    position: absolute;
    bottom: 4px;
    left: 0;
    display: flex;
    align-content: center;
    align-items: center;
    min-width: 118px;
    max-width: 100%;
    height: 30px;
    overflow: hidden;
    font-size: 14px;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);

    .user-name {
      max-width: 60px;
      padding-right: 5px;
      margin-left: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .master-icon,
    .admin-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-left: 0;
      background-color: var(--active-color-1);
    }

    .admin-icon {
      background-color: var(--orange-color);
    }

    .screen-icon {
      background-size: cover;
      transform: scale(0.8);
    }

    .audio-icon {
      max-width: 26px;
      max-height: 35px;
    }
  }
}
</style>
