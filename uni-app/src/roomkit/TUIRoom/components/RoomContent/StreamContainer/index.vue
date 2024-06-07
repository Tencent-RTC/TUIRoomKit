<template>
  <div
    ref="streamContainerRef"
    class="stream-container"
    @tap="() => {}"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="stream-swiper" :style="swiperContainerStyle">
      <div v-if="enlargeStream" class="stream-container-large-small" :style="swiperItemStyle">
        <div
          id="enlargedStreamContainer"
          ref="enlargedContainerRef"
          class="enlarged-stream-container"
        >
          <stream-region
            v-if="enlargeStream"
            :enlarge-dom-id="enlargeDomId"
            :stream="enlargeStream"
            :audio-volume="userVolumeObj[enlargeStream.userId] || 0"
            :style-object="flexStyle"
            :is-play-stream="currentPageIndex === 0"
            :layout="LAYOUT.LARGE_SMALL_WINDOW"
          ></stream-region>
        </div>
        <div
          ref="streamListRef"
          :class="[
            'stream-list',
            `${isFirstPageInSixPointLayout ? '' : 'not-first-page'}`,
            `${onlyVideoStreamList.length > 1 ? '' : 'single-stream'}`
          ]"
          :style="streamListStyleObject[0]"
        >
          <stream-region
            :stream="topRightStream"
            :audio-volume="userVolumeObj[topRightStream.userId] || 0"
            :enlarge-dom-id="enlargeDomId"
            :style-object="styleObject"
            :is-play-stream="currentPageIndex === 0"
            :layout="LAYOUT.LARGE_SMALL_WINDOW"
            :class="[onlyVideoStreamList.length > 1 ? 'multi-stream' : 'single-stream']"
          >
          </stream-region>
        </div>
      </div>
      <div
        v-for="(item, key) in Math.ceil(onlyVideoStreamList.length / 6)"
        :key="key"
        :style="swiperItemStyle"
        class="stream-container-flatten"
        :class="[
          onlyVideoStreamList.length > 1 ? 'multi-stream-container' : '',
          `${isFirstPageInSixPointLayout ? '' : 'not-first-page'}`
        ]"
      >
        <div
          ref="streamListRef"
          class="stream-list"
          :style="streamListStyleObject[item]"
        >
          <stream-region
            v-for="(stream) in onlyVideoStreamList.slice(key * 6, key * 6 + 6)"
            :key="`${stream.userId}_${stream.streamType}`"
            :stream="stream"
            :audio-volume="userVolumeObj[stream.userId] || 0"
            :enlarge-dom-id="enlargeDomId"
            :style-object="styleObject"
            :layout="LAYOUT.SIX_EQUAL_POINTS"
            :is-play-stream="(enlargeStream && currentPageIndex === item) || (!enlargeStream && currentPageIndex === item - 1)"
          >
          </stream-region>
        </div>
      </div>
    </div>
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
import { ref, onUnmounted, Ref, ComputedRef, watch, computed, nextTick, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import StreamRegion from '../StreamRegion/index.nvue';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import logger from '../../../utils/common/logger';
import { throttle } from '../../../utils/utils';
import { useRoomStore, StreamInfo } from '../../../stores/room';

import { TUIRoomEngine, TUIChangeReason, TUIRoomEvents,  TUIVideoStreamType, TRTCVolumeInfo } from '@tencentcloud/tuiroom-engine-uniapp-app';
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
const streamContainerRef = ref(null);
const roomStore = useRoomStore();
const {
  streamList,
  localStream,
  remoteStreamObj,
  userVolumeObj,
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

const topRightStream = computed(() => {
  if (currentSpeakerUserId.value) {
    return currentSpeakerUserId.value === localStream.value.userId
      ? localStream.value
      : remoteStreamObj.value[`${currentSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`];
  }
  return remoteStreamObj.value[`${enlargeStream.value?.userId}_${TUIVideoStreamType.kCameraStream}`];
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
        layout.value = LAYOUT.LARGE_SMALL_WINDOW;
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
    const lastSpeakerUserVolumeInfo = userVolumeList?.find((item: TRTCVolumeInfo) => (
      item.userId === currentSpeakerUserId.value
    ));
    if (lastSpeakerUserVolumeInfo && lastSpeakerUserVolumeInfo.volume > 0) {
      return;
    }
  }
  let largestVolume = 0;
  let largestUserId = '';
  userVolumeList?.forEach((item: TRTCVolumeInfo) => {
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
    if (userVolumeList?.length === 0) {
      currentSpeakerUserId.value = '';
    } else {
      handleLargestVoiceThrottle(userVolumeList);
    }
  }
};

const streamContainerRefSize = ref(null);
const dom = uni.requireNativePlugin('dom');

onMounted(() => {
  setTimeout(() => {
    dom.getComponentRect(streamContainerRef.value, (data) => {
      streamContainerRefSize.value = data.size;
    });
  }, 50);
});


const swiperItemStyle = computed(() => {
  if (!streamContainerRefSize.value) {
    return {};
  }
  return {
    width: `${streamContainerRefSize.value.width}px`,
    height: `${streamContainerRefSize.value.height}px`,
  };
});

const swiperContainerStyle = computed(() => {
  if (!streamContainerRefSize.value) {
    return {};
  }
  const pageNumber = enlargeStream.value
    ? Math.ceil(onlyVideoStreamList.value.length / 6) + 1 : Math.ceil(onlyVideoStreamList.value.length / 6);
  return {
    transform: `translateX(${0 - currentPageIndex.value * streamContainerRefSize.value.width}px)`,
    width: `${streamContainerRefSize.value.width * pageNumber}px`,
    height: `${streamContainerRefSize.value.height}px`,
  };
});


const flexStyle = ref({ flex: 1 });

const styleObject = computed(() => {
  if (onlyVideoStreamList.value.length > 1) {
    if (!streamContainerRefSize.value) {
      return {};
    }
    return {
		  width: `${Math.floor(streamContainerRefSize.value.width) / 2}px`,
		  height: `${Math.floor(streamContainerRefSize.value.width) / 2}px`,
    };
  }
  if (onlyVideoStreamList.value.length === 1) {
    return flexStyle.value;
  }
  return {};
});

const streamListStyleObject = computed(() => {
  if (!streamContainerRefSize.value) {
    return [];
  }
  return [
    // 大小流页面
    {
      width: `${Math.floor(streamContainerRefSize.value.width / 2)}px`,
      height: `${Math.floor(streamContainerRefSize.value.width / 2)}px`,
    },
    // 6 宫格第一页
    onlyVideoStreamList.value.length === 1
      ? flexStyle.value
      : { width: `${streamContainerRefSize.value.width}px` },
    // 6 宫格第二页
    {
      width: `${streamContainerRefSize.value.width}px`,
      height: `${Math.ceil(streamContainerRefSize.value.width) / 2 * 3}px`,
    },
  ];
});

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
	flex: 1;
	display: flex;
	position: relative;
	justify-content: center;
}

.stream-swiper {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
}

.stream-container-large-small {
	display: flex;
  background-color: rgba(242,242,242,1);
  overflow: hidden;
	position: relative;
  .enlarged-stream-container {
		flex: 1;
		display: flex;
  }
  .stream-list {
    position: absolute;
    top: 0;
    right: 0;
		overflow: hidden;
    // .single-stream {
    //   width: 100%;
    //   height: 100%;
    //   padding: 1px;
    //   border-radius: 10px;
    // }
    // .multi-stream {
    //   width: 100%;
    //   height: 100%;
    //   padding: 1px;
    //   border-radius: 10px;
    // }
  }
}


.stream-container-flatten {
  background-color: rgba(242,242,242,1);
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  &.not-first-page {
    align-items: flex-start;
  }
  &.multi-stream-container {
    align-items: center;
    align-content: center;
  }
  .stream-list {
    display: flex;
    flex-wrap: wrap;
	  flex-direction: row;
    justify-content: flex-start;
    flex: 1;
  }
}

.icon-control {
  background-color: #FFFFFF;
  position: absolute;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.swipe {
  position: absolute;
  bottom: 100px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  left: 0;
  right: 0;
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
