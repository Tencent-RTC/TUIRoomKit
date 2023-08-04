<template>
  <div
    ref="streamContainerRef"
    class="stream-container"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div :class="streamContainerClass">
      <div
        v-show="layout === LAYOUT.LARGE_SMALL_WINDOW"
        ref="enlargedContainerRef"
        class="enlarged-stream-container"
      >
        <stream-region
          v-if="enlargeStream"
          :stream="enlargeStream"
        ></stream-region>
      </div>
      <div :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]">
        <div ref="streamListRef" class="stream-list">
          <stream-region
            v-for="(stream) in streamList"
            v-show="showStreamList.indexOf(stream) > -1"
            :key="`${stream.userId}_${stream.streamType}`"
            :stream="stream"
            :status="currentStatus.status"
            :enlarge-dom-id="enlargeDomId"
            :show-room-tool="showRoomTool"
            :class="[streamList.length > 1 && 'multi-stream', streamList.length === 1 && 'single-stream']"
            :current-choose-stream="currentChooseStream"
            @click="handleChooseCurrentStream(stream)"
            @choose-click="handleEnlargeStreamRegion"
          >
          </stream-region>
        </div>
      </div>
    </div>
    <!--左右滑动控制栏 -->
    <div v-if="showPageDots > 1" class="swipe">
      <div
        v-for="(item, index) in showPageDots"
        :key="item"
        class="swipe-dots"
        :class="[isActiveDot(index) ? 'swipe-current-dots' : '']"
      ></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, ComputedRef, watch, nextTick, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import StreamRegion from '../StreamRegion/StreamRegionWX.vue';
import SvgIcon from '../../common/SvgIcon.vue';
import { ElMessage } from '../../../elementComp';
import { MESSAGE_DURATION } from '../../../constants/message';
import logger from '../../../utils/common/logger';

import TUIRoomEngine, { TUIChangeReason, TUIRoomEvents,  TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-wx';
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

const streamStyle: Ref<Record<string, any>> = ref({ width: '0', height: '0' });
const roomStore = useRoomStore();
const { streamList, streamNumber, remoteStreamList, localStream, remoteStreamObj } = storeToRefs(roomStore);
const basicStore = useBasicStore();
// 小程序默认布局为六宫格模式
basicStore.setLayout(LAYOUT.SIX_EQUAL_POINTS);
const { layout } = storeToRefs(basicStore);
const showSideList = ref(true);

const enlargeStream: Ref<StreamInfo | null> = ref(null);
const enlargeDomId = computed(() => (enlargeStream.value ? `${enlargeStream.value.userId}_${enlargeStream.value.streamType}` : ''));
const currentSpeakerStream: Ref<StreamInfo | null> = ref(null);
const startX = ref();
const startY = ref();
const currentStatus: Ref<Record<string, any>> = ref({
  status: '',
  showBigStream: null,
  showSmallStream: null,
  // locked: false,  为后续增加“钉住”状态预留字段
});
const currentChooseStream: Ref<StreamInfo | null> = ref(null);


// watch(() => remoteStreamList.value.length, (len) => {
//   // 当没有远端流的时候，将流布局改为九宫格
//   if (len === 0) {
//     currentStatus.value.status = 'one';
//   }
//   // if (len === 1) {
//   //   currentStatus.value.status = 'speaker';
//   //   currentStatus.value.showBigStream = remoteStreamList.value[0];
//   // }
//   if (len > 1
//     && currentStatus.value.status !== 'aux') {
//     currentStatus.value.status = 'grid';
//   }
// },  { immediate: true });

/**
 * ----- The following handles the nine-pane page flip logic -----
 *
 * ----- 以下处理六宫格翻页逻辑 -----
**/
const currentPageIndex = ref(0);
const showStreamList: ComputedRef<StreamInfo[]> = computed(() => {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    return streamList.value.slice(currentPageIndex.value * 6, currentPageIndex.value * 6 + 6);
  }
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    const userId = enlargeStream.value?.userId;
    return [remoteStreamObj.value[`${userId}_${TUIVideoStreamType.kCameraStream}`]];
  }
  return [];
});

// watch(streamNumber, (val) => {
//   if (currentPageIndex.value > Math.ceil(val / 6) - 1) {
//     currentPageIndex.value = Math.ceil(val / 6) - 1;
//     handleSixEqualPointsLayout();
//   }
// });

/**
 * Show left and right page flip icons
 *
 * 显示左右翻页图标
**/
const showPageDots = computed(() => {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    return streamNumber.value > 6 ?  Math.ceil(streamNumber.value / 6) : 1;
  }
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    return 2;
  }
  return 1;
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
function handleTurnPageLeft() {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    if (currentPageIndex.value === 0) {
      return;
    }
    currentPageIndex.value = currentPageIndex.value - 1;
  }
}

/**
 * Swipe right to turn the page
 *
 * 向右滑动翻页
**/
function handleTurnPageRight() {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    if (currentPageIndex.value === showPageDots.value - 1) {
      return;
    }
    currentPageIndex.value = currentPageIndex.value + 1;
  }
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    enlargeStream.value = null;
    currentPageIndex.value = 0;
    basicStore.setLayout(LAYOUT.SIX_EQUAL_POINTS);
  }
}

/**
 * ----- The following processing stream layout ---------
 *
 * ----- 以下处理流布局 ---------
**/
const streamContainerClass = ref('');
const enlargedContainerRef = ref();
const streamListRef = ref();


/**
 * Handle six-pattern layout
 *
 * 处理六宫格布局
**/
async function handleSixEqualPointsLayout() {
  streamContainerClass.value = 'stream-container-flatten';
  const number = showStreamList.value.length;
  let width = 0;
  let height = 0;

  const roomContainerElement = streamContainerRef.value;
  if (!roomContainerElement) {
    return;
  }
  let containerWidth = roomContainerElement!.offsetWidth;
  let containerHeight = roomContainerElement!.offsetHeight;
  containerWidth = number < 2 ? roomContainerElement!.offsetWidth / number : roomContainerElement!.offsetWidth / 2;
  containerHeight = roomContainerElement!.offsetHeight / Math.ceil(number / 2);

  const scaleWidth = containerWidth / 9;
  const scaleHeight = containerHeight / 16;
  if (scaleWidth > scaleHeight) {
    width = (containerHeight / 16) * 9;
    height = containerHeight;
  }
  if (scaleWidth <= scaleHeight) {
    width = containerWidth;
    height = (containerWidth / 9) * 16;
  }
  streamStyle.value.width = `${width}px`;
  streamStyle.value.height = `${height}px`;
}

async function handleLargeSmallWindowLayout() {
  streamContainerClass.value = 'stream-container-large-small';
}

/**
 * Double-click to switch the stream to the zoom in section
 *
 * 单击切换流到放大区域
**/
function handleEnlargeStreamRegion(event: any) {
  if (streamNumber.value === 1) return;
  if (event.streamType === TUIVideoStreamType.kScreenStream) {
    currentStatus.value.status = 'aux';
  } else {
    currentStatus.value.status = 'speaker';
  }
  if (event !== localStream.value) {
    currentSpeakerStream.value = localStream.value;
  }
  currentStatus.value.showBigStream = event;
}

/**
 * Handle the page layout when the page loads or the layout changes
 *
 * 页面加载或者 layout 改变时，处理页面布局
**/
function handleLayout() {
  switch (layout.value as any) {
    case LAYOUT.SIX_EQUAL_POINTS:
      handleSixEqualPointsLayout();
      break;
    case LAYOUT.LARGE_SMALL_WINDOW:
      handleLargeSmallWindowLayout();
      break;
    default:
      break;
  }
}

/**
 * Processing stream window size when page rescaling
 *
 * 页面 resize 时，处理流窗口尺寸
**/
function handleResize() {
  switch (layout.value as any) {
    case LAYOUT.SIX_EQUAL_POINTS:
      handleSixEqualPointsLayout();
      break;
    default:
      break;
  }
}
// 选中要放大的流
function handleChooseCurrentStream(stream: StreamInfo) {
  currentChooseStream.value = stream;
}
function handleTouchStart(event:any) {
  startX.value = event?.changedTouches[0]?.pageX;
  startY.value = event?.changedTouches[0]?.pageY;
}

function handleTouchEnd(event:any) {
  const moveDirection = (event?.changedTouches[0].pageX - startX.value);
  if (Math.abs(moveDirection) < 5) return;
  if (moveDirection < 0) {
    // 右滑
    handleTurnPageRight();
  }
  if (moveDirection > 0) {
    // 左滑
    handleTurnPageLeft();
  }
}

onMounted(() => {
  handleLayout();
  ['resize', 'pageshow'].forEach((event) => {
    window?.addEventListener(event, handleResize);
  });
  // document?.addEventListener('touchstart', handleTouchStart, false);
  // document?.addEventListener('touchend', handleTouchEnd, false);
});

onUnmounted(() => {
  ['resize', 'pageshow'].forEach((event) => {
    window?.removeEventListener(event, handleResize);
  });
  // document?.removeEventListener('touchstart', handleTouchStart, false);
  // document?.removeEventListener('touchend', handleTouchEnd, false);
});


watch(layout, () => {
  handleLayout();
});


/**
 * --- The following processing stream events ----
 *
 * --- 以下处理流事件 ----
**/


const onUserVideoStateChanged = (eventInfo: {
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
      ElMessage({
        type: 'warning',
        message: t('The host has turned off your camera'),
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
      ElMessage({
        type: 'warning',
        message: t('The host has turned off your screen sharing'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  // 当远端屏幕分享变化的时候，处理流布局
  if (userId !== basicStore.userId && streamType === TUIVideoStreamType.kScreenStream) {
    if (hasVideo) {
      enlargeStream.value = roomStore.remoteStreamObj[`${userId}_${streamType}`] as StreamInfo;
      if (enlargeStream.value) {
        basicStore.setLayout(LAYOUT.LARGE_SMALL_WINDOW);
      }
    } else {
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
      if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
        enlargeStream.value = null;
        currentPageIndex.value = 0;
        basicStore.setLayout(LAYOUT.SIX_EQUAL_POINTS);
      }
    }
  }
};


// 计算音量最大的 userId
// function handleLargestVoice(userVolumeList: any) {
//   const voiceList = [] as any;
//   userVolumeList.forEach((volumeList:any) => {
//     voiceList.push(volumeList.volume);
//   });
//   largestVoice.value = Math.max(...voiceList as any);
//   if (largestVoice.value === 0) return;
//   const currentSpeakerUserId = userVolumeList.find((item : any) => item.volume === largestVoice.value).userId;
//   currentStatus.value.showSmallStream = streamList.value.find((item : any) => item.userId === currentSpeakerUserId) as StreamInfo;
// }

// 音量变化
// const onUserVoiceVolumeChanged = (eventInfo: {
//   userVolumeList: any[],
// }) => {
//   const { userVolumeList } = eventInfo;
//   // if (userVolumeList.length === 0) return;
//   // if (streamNumber.value > 1 && currentStatus.value.status !== 'grid') {
//   //   handleLargestVoice(userVolumeList);
//   // }
// };


TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRemoteUserEnterRoom, onRemoteUserEnterRoom);
  roomEngine.instance?.on(TUIRoomEvents.onRemoteUserLeaveRoom, onRemoteUserLeaveRoom);
  roomEngine.instance?.on(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserVideoStateChanged, onUserVideoStateChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserAudioStateChanged, onUserAudioStateChanged);
  // roomEngine.instance?.on(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
  // roomEngine.instance?.on(TUIRoomEvents.onUserNetworkQualityChanged, onUserNetworkQualityChanged);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRemoteUserEnterRoom, onRemoteUserEnterRoom);
  roomEngine.instance?.off(TUIRoomEvents.onRemoteUserLeaveRoom, onRemoteUserLeaveRoom);
  roomEngine.instance?.off(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserVideoStateChanged, onUserVideoStateChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserAudioStateChanged, onUserAudioStateChanged);
  // roomEngine.instance?.off(TUIRoomEvents.onUserVoiceVolumeChanged, onUserVoiceVolumeChanged);
});
</script>

<style lang="scss" scoped>
@import '../../../assets/style/var.scss';

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
  .stream-list-container {
    width: 100%;
    height: 100%;
  }
  .stream-list {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    align-content: center;
    .single-stream {
      width: 100%;
      height: 100%;
      padding: 1px;
      border-radius: 10px;
    }
    .multi-stream {
      width: 50%;
      height: 12.5rem;
      border-radius: 10px;
      overflow: hidden;
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
    width: 12.5rem;
    height: 12.5rem;
    position: absolute;
    top: 0;
    right: 0;
    .stream-list {
      width: 100%;
      height: 100%;
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
.arrow-up {
  width: 52px;
  height: 20px;
  position: fixed;
  left: 50%;
  transform: translate(-50%);
  top: 175px;
  border-radius: 0 0 4px 4px;
}
.arrow-down {
  width: 52px;
  height: 20px;
  position: fixed;
  left: 50%;
  transform: translate(-50%);
  top: 48px;
  border-radius: 0 0 4px 4px;
  // * {
  //   transform: rotate(180deg);
  // }
}
.arrow-right {
  width: 20px;
  height: 52px;
  position: fixed;
  right: 250px;
  transform: translate(-50%);
  top: calc((100% - 148px) / 2 + 58px);
  border-radius: 4px 0 0 4px;
  // * {
  //   transform: rotate(90deg);
  // }
}
.arrow-left {
  width: 20px;
  height: 52px;
  position: fixed;
  right: -10px;
  transform: translate(-50%);
  top: calc((100% - 148px) / 2 + 58px);
  border-radius: 4px 0 0 4px;
  // * {
  //   transform: rotate(270deg);
  // }
}
// .stream-container {
//   width: 100vw;
//   height: 100vh;
// }
// .top-right-container {
//   width: 150px;
//   height: 235px;
//   position: absolute;
//   top: 5%;
//   right: 20px;
// }
// .enlarged-stream-container {
//   width: 100vw;
//   height: 100vh;
// }
// .large-stream {
//   width: 100% !important;
//   height: 100% !important;
// }
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
