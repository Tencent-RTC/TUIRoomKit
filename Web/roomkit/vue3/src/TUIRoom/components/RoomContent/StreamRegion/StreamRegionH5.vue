<template>
  <div
    v-if="props.layout === LAYOUT.SIX_EQUAL_POINTS || (playRegionDomId !== enlargeDomId)"
    ref="streamRegionRef"
    v-dbl-touch="() => { $emit('room-dblclick') }"
    class="user-stream-container"
    :class="[showVoiceBorder ? 'border' : '']"
  >
    <div :id="playRegionDomId" class="stream-region"></div>
    <div
      v-if="!stream.hasVideoStream && !stream.hasScreenStream"
      class="center-user-info-container"
    >
      <Avatar class="avatar-region" :img-src="stream.avatarUrl"></Avatar>
    </div>
    <div class="corner-user-info-container">
      <div v-if="showIcon" :class="showMasterIcon ? 'master-icon' : 'admin-icon' ">
        <svg-icon :icon="UserIcon"></svg-icon>
      </div>
      <audio-icon
        v-if="!isScreenStream"
        class="audio-icon"
        :user-id="stream.userId"
        :is-muted="!stream.hasAudioStream"
        size="small"
      ></audio-icon>
      <svg-icon v-if="isScreenStream" :icon="ScreenOpenIcon" class="screen-icon"></svg-icon>
      <span class="user-name" :title="userInfo">{{ userInfo }}</span>
      <span v-if="isScreenStream"> {{ t('is sharing their screen') }} </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import Avatar from '../../common/Avatar.vue';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../utils/common/logger';
import UserIcon from '../../common/icons/UserIcon.vue';
import AudioIcon from '../../common/AudioIcon.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
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
import vDblTouch from '../../../directives/vDblTouch';
import { LAYOUT } from '../../../constants/render';

const roomEngine = useGetRoomEngine();

const logPrefix = '[StreamRegion]';
const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { userVolumeObj } = storeToRefs(roomStore);

const { t } = useI18n();

interface Props {
  stream: StreamInfo;
  layout: LAYOUT;
  enlargeDomId?: string;
  isEnlarge?: Boolean;
}

const props = defineProps<Props>();
defineEmits(['room-dblclick']);

const streamRegionRef = ref();
const showVoiceBorder = computed(() => (
  props.stream.hasAudioStream && userVolumeObj.value[props.stream.userId] !== 0
));

const playRegionDomId = computed(() => {
  if (props.isEnlarge) {
    return `${props.stream.userId}_${props.stream.streamType}_enlarge`;
  }
  return `${props.stream.userId}_${props.stream.streamType}`;
});

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

async function playStream() {
  if (props.stream.streamType === TUIVideoStreamType.kCameraStream && !props.stream.hasVideoStream) {
    return;
  }
  if (props.stream.streamType === TUIVideoStreamType.kScreenStream && !props.stream.hasScreenStream) {
    return;
  }
  if (basicStore.userId === props.stream.userId) {
    await roomEngine.instance?.setLocalVideoView({
      view: `${playRegionDomId.value}`,
    });
  } else {
    roomEngine.instance?.setRemoteVideoView({
      userId: props.stream.userId,
      streamType: props.stream.streamType,
      view: `${playRegionDomId.value}`,
    });
    await roomEngine.instance?.startPlayRemoteVideo({
      userId: props.stream.userId,
      streamType: props.stream.streamType,
    });
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    const fillMode =  props.stream.streamType === TUIVideoStreamType.kScreenStream
      ? TRTCVideoFillMode.TRTCVideoFillMode_Fill
      : TRTCVideoFillMode.TRTCVideoFillMode_Fill;
    await trtcCloud?.setRemoteRenderParams(props.stream.userId, TRTCVideoStreamType.TRTCVideoStreamTypeBig, {
      mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      rotation: TRTCVideoRotation.TRTCVideoRotation0,
      fillMode,
    });
  }
}

watch(() => props.layout, async () => {
  await nextTick();
  if (props.enlargeDomId === `${props.stream.userId}_${props.stream.streamType}` && props.layout === LAYOUT.LARGE_SMALL_WINDOW && props.isEnlarge) {
    playStream();
  }
  if (props.enlargeDomId === `${props.stream.userId}_${props.stream.streamType}` && props.layout !== LAYOUT.LARGE_SMALL_WINDOW && !props.isEnlarge) {
    playStream();
  }
});

onMounted(() => {
  watch(
    () => props.stream.hasVideoStream,
    async (val) => {
      if (val) {
        await nextTick();
        const userIdEl = document?.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
        if (userIdEl) {
          logger.debug(`${logPrefix}watch isVideoStreamAvailable:`, props.stream.userId, userIdEl);
          playStream();
        }
      } else {
        if (basicStore.userId === props.stream.userId && props.stream.streamType === TUIVideoStreamType.kCameraStream) {
          await roomEngine.instance?.setLocalVideoView({
            view: null,
          });
        }
      }
    },
    { immediate: true },
  );
});

onMounted(() => {
  watch(
    () => props.stream.hasScreenStream,
    async (val) => {
      if (val) {
        await nextTick();
        const userIdEl = document?.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
        if (userIdEl) {
          logger.debug(`${logPrefix}watch isScreenStreamAvailable:`, props.stream.userId, userIdEl);
          await playStream();
        }
      }
    },
    { immediate: true },
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
      if (props.isEnlarge || playRegionDomId.value === oldVal || playRegionDomId.value === val) {
        await nextTick();
        const userIdEl = document?.getElementById(`${playRegionDomId.value}`) as HTMLDivElement;
        if (userIdEl) {
          playStream();
        }
      }
    },
  );
});
</script>

<style lang="scss" scoped>
.user-stream-container {
  position: relative;
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  overflow: hidden;
  border-radius: 10px;
  -webkit-transform: rotate(0deg);

  &.border {
    border: 2px solid #37E858;
  }

  .stream-region {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #000000;
    position: absolute;
    top: 0;
    left: 0;
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
    color: #FFFFFF;
    align-items: center;
    align-content: center;
    font-size: 14px;
    .user-name {
      margin-left: 8px;
      max-width: 60px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      padding-right: 5px;
    }
    .master-icon,
    .admin-icon {
      margin-left: 0;
      width: 32px;
      height: 32px;
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
    .audio-icon{
      max-width: 26px;
      max-height: 35px;
    }
  }
}
</style>
