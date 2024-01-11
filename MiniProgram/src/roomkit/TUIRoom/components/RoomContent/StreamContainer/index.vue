<template>
  <div
    ref="streamContainerRef"
    class="stream-container"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div :class="streamContainerClass">
      <div
        v-if="layout === LAYOUT.LARGE_SMALL_WINDOW"
        ref="enlargedContainerRef"
        class="enlarged-stream-container"
      >
        <stream-region
          v-if="enlargeStream"
          :key="`${enlargeStream.userId}_${enlargeStream.streamType}`"
          :stream="enlargeStream"
        ></stream-region>
      </div>
      <div
        class="stream-list-container"
        :class="[onlyVideoStreamList.length > 1 ? 'multi-stream-container' : 'single-stream-container']"
      >
        <div
          ref="streamListRef"
          :class="['stream-list', `${isFirstPageInSixPointLayout ? '' : 'not-first-page'}`]"
        >
          <stream-region
            v-show="showPusher"
            :stream="localStream"
            :enlarge-dom-id="enlargeDomId"
            :show-room-tool="showRoomTool"
            :class="[onlyVideoStreamList.length > 1 ? 'multi-stream' : 'single-stream']"
          >
          </stream-region>
          <template v-for="(stream) in paginatedArray" :key="`${stream.userId}_${stream.streamType}`">
            <stream-region
              v-if="basicStore.userId !== stream.userId"
              :stream="stream"
              :show-room-tool="showRoomTool"
              :class="[onlyVideoStreamList.length > 1 ? 'multi-stream' : 'single-stream']"
            >
            </stream-region>
          </template>
        </div>
      </div>
    </div>
    <!--左右滑动控制栏 -->
    <div v-if="totalPageNumber > 1" class="swipe">
      <div
        v-for="(item, index) in totalPageNumber"
        :key="item"
        class="swipe-dots"
        :class="[isActiveDot(index) ? 'swipe-current-dots' : '']"
      ></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onUnmounted, Ref, ComputedRef, watch, computed, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import StreamRegion from '../StreamRegion/index.vue';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import logger from '../../../utils/common/logger';
import { throttle } from '../../../utils/utils';

import { TUIRoomEngine, TUIChangeReason, TUIRoomEvents,  TUIVideoStreamType, TRTCVolumeInfo } from '@tencentcloud/tuiroom-engine-wx';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import useStreamContainer from './useStreamContainerHooks';

const logPrefix = '[StreamContainer]';
const {
  onRemoteUserEnterRoom,
  onRemoteUserLeaveRoom,
  onSeatListChanged,
  onUserAudioStateChanged,
  t,
} = useStreamContainer();

const roomEngine = useGetRoomEngine();


defineProps<{
  showRoomTool: boolean,
}>();


const streamContainerRef = ref(null);

const roomStore = useRoomStore();
const {
  streamList,
  localStream,
  remoteStreamObj,
} = storeToRefs(roomStore);
const basicStore = useBasicStore();

const setLayout = async (layout: LAYOUT) => {
  await nextTick();
  basicStore.setLayout(layout);
};

const { layout } = storeToRefs(basicStore);

const enlargeStream: Ref<StreamInfo | null> = ref(null);
const enlargeDomId = computed(() => (enlargeStream.value ? `${enlargeStream.value.userId}_${enlargeStream.value.streamType}` : ''));
const currentSpeakerUserId: Ref<string> = ref('');
const startX = ref();
const startY = ref();

const onlyVideoStreamList = computed(() => (
  streamList.value.filter(stream => stream.streamType === TUIVideoStreamType.kCameraStream)
));
const currentPageIndex = ref(0);

const showPusher = computed(() => (layout.value === LAYOUT.SIX_EQUAL_POINTS && isFirstPageInSixPointLayout)
  || (layout.value === LAYOUT.LARGE_SMALL_WINDOW && currentSpeakerUserId.value === localStream.value.userId));

const paginatedArray = computed(() => {
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    return showStreamList.value;
  }
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    const start = enlargeDomId.value ? (currentPageIndex.value - 1) * 6 : currentPageIndex.value * 6;
    const end = start + 6;
    return onlyVideoStreamList.value.slice(start, end);
  }
  return [];
});
watch(() => onlyVideoStreamList.value.length, (val) => {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    const equalPointIndex = enlargeStream.value ? currentPageIndex.value - 1 : currentPageIndex.value;
    if (Math.ceil(val / 6) < equalPointIndex + 1 && equalPointIndex > 0) {
      currentPageIndex.value = currentPageIndex.value - 1;
    }
  }
});

const isFirstPageInSixPointLayout: Ref<Boolean> = computed(() => {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    return enlargeStream.value ? currentPageIndex.value === 1 : currentPageIndex.value === 0;
  }
  return false;
});

/**
 * ----- The following handles the nine-pane page flip logic -----
 *
 * ----- 以下处理六宫格翻页逻辑 -----
**/
const showStreamList: ComputedRef<StreamInfo[]> = computed(() => {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    if (enlargeStream.value) {
      return onlyVideoStreamList.value.slice((currentPageIndex.value - 1) * 6, (currentPageIndex.value - 1) * 6 + 6);
    }
    return onlyVideoStreamList.value.slice(currentPageIndex.value * 6, currentPageIndex.value * 6 + 6);
  }
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    const userId = enlargeStream.value?.userId;
    if (currentSpeakerUserId.value) {
      return currentSpeakerUserId.value === localStream.value.userId
        ? [localStream.value]
        : [remoteStreamObj.value[`${currentSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`]];
    }
    return [remoteStreamObj.value[`${userId}_${TUIVideoStreamType.kCameraStream}`]];
  }
  return [];
});


/**
 * Show left and right page flip icons
 *
 * 显示左右翻页图标
**/
const totalPageNumber = computed(() => {
  const videoStreamNumber = onlyVideoStreamList.value.length;
  const totalPageOfVideoStream = videoStreamNumber > 6 ? Math.ceil(videoStreamNumber / 6) : 1;
  return enlargeStream.value ? totalPageOfVideoStream + 1 : totalPageOfVideoStream;
});

function isActiveDot(index: number) {
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    return index === 0;
  }
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    return index === currentPageIndex.value;
  }
  return false;
}

/**
 * Swipe left to turn the page
 *
 * 向左滑动翻页
**/
async function handleTurnPageLeft() {
  if (currentPageIndex.value === 0) {
    return;
  }
  currentPageIndex.value = currentPageIndex.value - 1;
  if (enlargeStream.value && currentPageIndex.value === 0) {
    await setLayout(LAYOUT.LARGE_SMALL_WINDOW);
  }
}

/**
 * Swipe right to turn the page
 *
 * 向右滑动翻页
**/
async function handleTurnPageRight() {
  if (currentPageIndex.value === totalPageNumber.value - 1) {
    return;
  }
  currentPageIndex.value = currentPageIndex.value + 1;
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    await setLayout(LAYOUT.SIX_EQUAL_POINTS);
  }
}

/**
 * ----- The following processing stream layout ---------
 *
 * ----- 以下处理流布局 ---------
**/
const enlargedContainerRef = ref();
const streamListRef = ref();

const streamContainerClass = computed(() => {
  let containerClass = '';
  switch (layout.value) {
    case LAYOUT.SIX_EQUAL_POINTS:
      containerClass = 'stream-container-flatten';
      break;
    case LAYOUT.LARGE_SMALL_WINDOW:
      containerClass = 'stream-container-large-small';
      break;
    default:
      break;
  }
  return containerClass;
});

function handleTouchStart(event:any) {
  startX.value = event?.changedTouches[0]?.pageX;
  startY.value = event?.changedTouches[0]?.pageY;
}

function handleTouchEnd(event:any) {
  const moveDirectionX = event?.changedTouches[0].pageX - startX.value;
  const moveDirectionY = event?.changedTouches[0].pageY - startY.value;
  if (Math.abs(moveDirectionY) > Math.abs(moveDirectionX) || Math.abs(moveDirectionX) < 5) {
    return;
  }
  if (moveDirectionX < 0) {
    // 右滑
    handleTurnPageRight();
  }
  if (moveDirectionX > 0) {
    // 左滑
    handleTurnPageLeft();
  }
}

/**
 * --- The following processing stream events ----
 *
 * --- 以下处理流事件 ----
**/


const onUserVideoStateChanged = async (eventInfo: {
  userId: string,
  streamType: TUIVideoStreamType,
  hasVideo: boolean,
  reason: TUIChangeReason,
}) => {
  const { userId, streamType, hasVideo, reason } = eventInfo;
  // 更新 roomStore 流状态数据
  roomStore.updateUserVideoState(userId, streamType, hasVideo);

  // 处理状态变更
  if (userId === basicStore.userId && !hasVideo && reason === TUIChangeReason.kChangedByAdmin) {
    // 主持人关闭摄像头
    if (streamType === TUIVideoStreamType.kCameraStream) {
      TUIMessage({
        type: 'warning',
        message: t('Your camera has been turned off'),
        duration: MESSAGE_DURATION.NORMAL,
      });
      // When the moderator opens the whole staff forbidden to draw,
      // open and then close the single person's camera alone, at this time
      // the corresponding user's camera status for inoperable
      // 主持人开启全员禁画时，单独打开再关闭单人的摄像头，此时对应用户的摄像头状态为无法操作
      roomStore.setCanControlSelfVideo(!roomStore.isCameraDisableForAllUser);
    }
    // 主持人关闭屏幕分享
    if (streamType === TUIVideoStreamType.kScreenStream) {
      TUIMessage({
        type: 'warning',
        message: t('The host has turned off your screen sharing'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  // 当远端屏幕分享变化的时候，处理流布局
  if (userId !== basicStore.userId && streamType === TUIVideoStreamType.kScreenStream) {
    if (hasVideo) {
      const largeStream = roomStore.remoteStreamObj[`${userId}_${streamType}`] as StreamInfo;
      if (largeStream) {
        enlargeStream.value = largeStream;
        await setLayout(LAYOUT.LARGE_SMALL_WINDOW);
        currentPageIndex.value = 0;
      }
    } else {
      if (userId === enlargeStream.value?.userId) {
        /**
         * Reset the stream playback layout when the remote screen sharing stream is stopped
         *
         * 远端屏幕分享流停止的时候，重新设置流播放布局
        **/
        logger.debug(`${logPrefix} onUserVideoStateChanged: stop`, userId, streamType);
        roomEngine.instance?.stopPlayRemoteVideo({
          userId,
          streamType,
        });
        if (enlargeStream.value) {
          enlargeStream.value = null;
        }
        if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
          await setLayout(LAYOUT.SIX_EQUAL_POINTS);
          currentPageIndex.value = 0;
        } else if (layout.value === LAYOUT.SIX_EQUAL_POINTS && currentPageIndex.value > 0) {
          currentPageIndex.value = currentPageIndex.value - 1;
        }
      }
    }
  }
};

// 计算音量最大的 userId
function handleLargestVoice(userVolumeList: Array<TRTCVolumeInfo>) {
  if (currentSpeakerUserId.value) {
    const lastSpeakerUserVolumeInfo = userVolumeList.find((item: TRTCVolumeInfo) => (
      item.userId === currentSpeakerUserId.value
    ));
    if (lastSpeakerUserVolumeInfo && lastSpeakerUserVolumeInfo.volume > 0) {
      return;
    }
  }
  let largestVolume = 0;
  let largestUserId = '';
  userVolumeList.forEach((item: TRTCVolumeInfo) => {
    const { userId, volume } = item;
    if (volume > largestVolume) {
      largestVolume = volume;
      largestUserId = userId;
    }
  });
  if (largestVolume === 0) {
    currentSpeakerUserId.value = '';
  } else {
    currentSpeakerUserId.value = largestUserId;
  }
}

const handleLargestVoiceThrottle = throttle(handleLargestVoice, 1000);

// 音量变化
const onUserVoiceVolumeChanged = (eventInfo: {
  userVolumeList: any[],
}) => {
  const { userVolumeList } = eventInfo;
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    if (userVolumeList.length === 0) {
      currentSpeakerUserId.value = '';
    } else {
      handleLargestVoiceThrottle(userVolumeList);
    }
  }
};


TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRemoteUserEnterRoom, onRemoteUserEnterRoom);
  roomEngine.instance?.on(TUIRoomEvents.onRemoteUserLeaveRoom, onRemoteUserLeaveRoom);
  roomEngine.instance?.on(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserVideoStateChanged, onUserVideoStateChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserAudioStateChanged, onUserAudioStateChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRemoteUserEnterRoom, onRemoteUserEnterRoom);
  roomEngine.instance?.off(TUIRoomEvents.onRemoteUserLeaveRoom, onRemoteUserLeaveRoom);
  roomEngine.instance?.off(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserVideoStateChanged, onUserVideoStateChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserAudioStateChanged, onUserAudioStateChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
});
</script>

<style lang="scss" scoped>
.stream-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.stream-container-flatten {
  width: 100%;
  height: 100%;
  background-color: var(--stream-container-flatten-bg-color);
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  align-content: center;
  .stream-list-container {
    width: 100%;
    padding-top: 150%;
    height: 0;
    position: relative;
    &.multi-stream-container {
      padding-top: 150%;
      height: 0;
    }
    &.single-stream-container {
      height: 100%;
    }
  }
  .stream-list {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    align-content: center;
    &.not-first-page {
      align-content: flex-start;
    }
    .single-stream {
      width: 100%;
      height: 100%;
      padding: 1px;
      border-radius: 10px;
    }
    .multi-stream {
      width: 50%;
      padding-top: 50%;
      height: 0;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }
  }
}

.stream-container-large-small {
  width: 100%;
  height: 100%;
  background-color: var(--stream-container-flatten-bg-color);
  overflow: hidden;
  .enlarged-stream-container {
    width: 100%;
    height: 100%;
  }
  .stream-list-container {
    width: 50%;
    padding-top: 50%;
    position: absolute;
    top: 0;
    right: 0;
    .stream-list {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      .single-stream {
        width: 100%;
        height: 100%;
        padding: 1px;
        border-radius: 10px;
      }
      .multi-stream {
        width: 100%;
        height: 100%;
        padding: 1px;
        border-radius: 10px;
      }
    }
  }
}

.icon-control {
  background-color: var(--layout-item);
  position: absolute;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.swipe {
  width: 100%;
  position: absolute;
  bottom: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  }
.swipe-dots {
  width: 8px;
  height: 8px;
  background: #FFFFFF;
  opacity: 0.6;
  border-radius: 20px;
  margin: 5px;
}
.swipe-current-dots {
  width: 8px;
  height: 8px;
  background: #FFFFFF;
  opacity: 1;
  border-radius: 20px;
  margin: 5px;
  }
</style>
