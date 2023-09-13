<template>
  <div :class="streamContainerClass">
    <div v-show="showIconControl" ref="enlargedContainerRef" class="enlarged-stream-container">
      <stream-region
        v-if="enlargeStream"
        :key="`${enlargeStream.userId}_${enlargeStream.streamType}`"
        :stream="enlargeStream"
        :style="enlargedStreamStyle"
      ></stream-region>
    </div>
    <div :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]">
      <div ref="streamListRef" class="stream-list">
        <stream-region
          v-for="(stream) in streamList"
          v-show="showStreamList.indexOf(stream) > -1"
          :key="`${stream.userId}_${stream.streamType}`"
          :stream="stream"
          :enlarge-dom-id="enlargeDomId"
          class="single-stream"
          :style="streamStyle"
          @room_dblclick="handleEnlargeStreamRegion(stream)"
        ></stream-region>
      </div>
    </div>
    <!--
    *Sidebar and upper sidebar arrows
    *
    *侧边栏和上边栏箭头
    -->
    <div v-if="showIconControl && showRoomTool" :class="arrowClass" @click="handleClickIcon">
      <svg-icon icon-name="line-arrow-up" size="medium"></svg-icon>
    </div>
    <!--
    *Nine-pane left and right page flip control bar
    *
    *九宫格左右翻页控制栏
    -->
    <div v-if="showTurnPageControl && showRoomTool" class="turn-page-container">
      <div
        v-show="showTurnPageLeftArrow"
        class="turn-page-arrow-container left-container"
        @click="handleTurnPageLeft"
      >
        <div class="turn-page-arrow"></div>
      </div>
      <div
        v-show="showTurnPageRightArrow"
        class="turn-page-arrow-container right-container"
        @click="handleTurnPageRight"
      >
        <div class="turn-page-arrow turn-page-right"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, ComputedRef, watch, nextTick, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import StreamRegion from '../StreamRegion';
import SvgIcon from '../../common/SvgIcon.vue';
import { ElMessage } from '../../../elementComp';
import { MESSAGE_DURATION } from '../../../constants/message';
import { debounce } from '../../../utils/utils';
import logger from '../../../utils/common/logger';

import TUIRoomEngine, { TUIUserInfo, TUIChangeReason, TUIRoomEvents,  TUIVideoStreamType, TUISeatInfo } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import useStreamContainer from './useStreamContainerHooks';

const logPrefix = '[StreamContainer]';
const {
  onRemoteUserEnterRoom,
  onUserAudioStateChanged,
  t,
} = useStreamContainer();
const roomEngine = useGetRoomEngine();


defineProps<{
  showRoomTool: boolean,
}>();

const streamStyle: Ref<Record<string, any>> = ref({ width: '0', height: '0' });
const enlargedStreamStyle: Ref<Record<string, any>> = ref({ width: '0', height: '0' });
const roomStore = useRoomStore();
const { streamList, streamNumber, remoteStreamList } = storeToRefs(roomStore);
const basicStore = useBasicStore();
const { layout } = storeToRefs(basicStore);
const showSideList = ref(true);

const enlargeStream: Ref<StreamInfo | null> = ref(null);
const enlargeDomId = computed(() => (enlargeStream.value ? `${enlargeStream.value.userId}_${enlargeStream.value.streamType}` : ''));

watch(() => remoteStreamList.value.length, (val) => {
  // 当没有远端流的时候，将流布局改为九宫格
  if (val === 0) {
    basicStore.setLayout(LAYOUT.NINE_EQUAL_POINTS);
    enlargeStream.value = null;
    return;
  }
});

watch(() => streamList.value.length, () => {
  if (layout.value === LAYOUT.RIGHT_SIDE_LIST || layout.value === LAYOUT.TOP_SIDE_LIST) {
    handleStreamContainerScroll();
  }
});

watch(() => enlargeDomId.value, () => {
  if (layout.value === LAYOUT.RIGHT_SIDE_LIST || layout.value === LAYOUT.TOP_SIDE_LIST) {
    handleStreamContainerScroll();
  }
});

/**
 * ----- The following handles the nine-pane page flip logic -----
 *
 * ----- 以下处理九宫格翻页逻辑 -----
**/
const currentPageIndex = ref(0);
const showStreamList: ComputedRef<StreamInfo[]> = computed(() => {
  if (layout.value !== LAYOUT.NINE_EQUAL_POINTS) {
    return streamList.value.filter(item => `${item.userId}_${item.streamType}` !== enlargeDomId.value);
  }
  return streamList.value.slice(currentPageIndex.value * 9, currentPageIndex.value * 9 + 9);
});

watch([() => showStreamList.value.length, currentPageIndex], () => {
  if (layout.value === LAYOUT.NINE_EQUAL_POINTS) {
    const streamIdList: string[] = [];
    showStreamList.value.forEach((item) => {
      const currentStreamId = `${item.userId}_${item.streamType}`;
      streamIdList.push(currentStreamId);
    });
    roomStore.updateUserStreamVisible(streamIdList);
  }
});

watch(streamNumber, (val) => {
  if (currentPageIndex.value > Math.ceil(val / 9) - 1) {
    currentPageIndex.value = Math.ceil(val / 9) - 1;
    handleNineEqualPointsLayout();
  }
});

/**
 * Show left and right page flip icons
 *
 * 显示左右翻页图标
**/
const showTurnPageControl = computed(() => layout.value === LAYOUT.NINE_EQUAL_POINTS && streamNumber.value > 9);
/**
 * Whether or not to show the nine-page-to-left button
 *
 * 是否展示九宫格朝左翻页按钮
**/
const showTurnPageLeftArrow = computed(() => currentPageIndex.value > 0);
/**
 * Whether or not to display the nine-pane rightward-facing page button
 *
 * 是否展示九宫格朝右翻页按钮
**/
const showTurnPageRightArrow = computed(() => streamNumber.value > currentPageIndex.value * 9 + 9);

/**
 * Nine grid layout towards the left to turn the page
 *
 * 九宫格布局朝左翻页
**/
function handleTurnPageLeft() {
  currentPageIndex.value = currentPageIndex.value - 1;
  handleNineEqualPointsLayout();
}

/**
 * Nine grid layout towards the right to turn the page
 *
 * 九宫格布局朝右翻页
**/
function handleTurnPageRight() {
  currentPageIndex.value = currentPageIndex.value + 1;
  handleNineEqualPointsLayout();
}

/**
 * ----- The following processing stream layout ---------
 *
 * ----- 以下处理流布局 ---------
**/
const streamContainerClass = ref('');
const enlargedContainerRef = ref();
const streamListRef = ref();

const arrowClass = computed(() => {
  let arrowDirection = '';
  if (layout.value === LAYOUT.TOP_SIDE_LIST) {
    arrowDirection = showSideList.value ? 'up' : 'down';
  }
  if (layout.value === LAYOUT.RIGHT_SIDE_LIST) {
    arrowDirection = showSideList.value ? 'right' : 'left';
  }
  return `icon-control arrow-${arrowDirection}`;
});

function handleClickIcon() {
  showSideList.value = !showSideList.value;
  if (!showSideList.value) {
    let width = 0;
    let height = 0;
    const containerWidth = document.getElementById('roomContainer')!.offsetWidth;
    const containerHeight = document.getElementById('roomContainer')!.offsetHeight;
    const scaleWidth = containerWidth / 16;
    const scaleHeight = containerHeight / 9;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / 9) * 16;
      height = containerHeight;
    }
    if (scaleWidth <= scaleHeight) {
      width = containerWidth;
      height = (containerWidth / 16) * 9;
    }
    enlargedStreamStyle.value.width = `${width}px`;
    enlargedStreamStyle.value.height = `${height}px`;
    /**
     * Modify the width and height of the enlargedContainer
     *
     * 修改 enlargedContainer 的宽和高
    **/
    if (layout.value === LAYOUT.RIGHT_SIDE_LIST) {
      enlargedContainerRef.value.style.width = '100%';
      enlargedContainerRef.value.style.height = '100%';
      return;
    }
    if (layout.value === LAYOUT.TOP_SIDE_LIST) {
      enlargedContainerRef.value.style.top = '0px';
      enlargedContainerRef.value.style.width = '100%';
      enlargedContainerRef.value.style.height = '100%';
      return;
    }
  } else {
    if (layout.value  === LAYOUT.RIGHT_SIDE_LIST) {
      handleRightSideListLayout();
      enlargedContainerRef.value.style.width = 'calc(100% - 260px)';
      enlargedContainerRef.value.style.height = '100%';
      return;
    }
    if (layout.value === LAYOUT.TOP_SIDE_LIST) {
      handleTopSideListLayout();
      enlargedContainerRef.value.style.top = '175px';
      enlargedContainerRef.value.style.width = '100%';
      enlargedContainerRef.value.style.height = 'calc(100% - 175px)';
      return;
    }
  }
}

/**
 * Handle nine-pattern layout
 *
 * 处理九宫格布局
**/
async function handleNineEqualPointsLayout() {
  streamContainerClass.value = 'stream-container-flatten';

  enlargeStream.value = null;

  const number = showStreamList.value.length;
  let width = 0;
  let height = 0;
  const roomContainerElement = document.getElementById('roomContainer');
  if (!roomContainerElement) {
    return;
  }
  let containerWidth = roomContainerElement!.offsetWidth;
  let containerHeight = roomContainerElement!.offsetHeight;
  if (number <= 4) {
    containerWidth = number < 2 ? roomContainerElement!.offsetWidth / number : roomContainerElement!.offsetWidth / 2;
    containerHeight = roomContainerElement!.offsetHeight / Math.ceil(number / 2);
  } else if (number > 4) {
    containerWidth = number < 3 ? roomContainerElement!.offsetWidth / number : roomContainerElement!.offsetWidth / 3;
    containerHeight = roomContainerElement!.offsetHeight / Math.ceil(number / 3);
  }

  const scaleWidth = containerWidth / 16;
  const scaleHeight = containerHeight / 9;
  if (scaleWidth > scaleHeight) {
    width = (containerHeight / 9) * 16;
    height = containerHeight;
  }
  if (scaleWidth <= scaleHeight) {
    width = containerWidth;
    height = (containerWidth / 16) * 9;
  }
  // 九宫格模式需要减掉 streamRegion 的 margin 的尺寸
  streamStyle.value.width = `${width - 8}px`;
  streamStyle.value.height = `${height - 8}px`;
}

/**
 * Handle sidebar layout
 *
 * 处理侧边栏布局
**/
async function handleRightSideListLayout() {
  streamContainerClass.value = 'stream-container-right';

  if (!enlargeStream.value) {
    [enlargeStream.value] = remoteStreamList.value;
  }

  await nextTick();

  streamStyle.value = {};

  if (enlargedContainerRef.value) {
    const containerWidth = enlargedContainerRef.value.offsetWidth;
    const containerHeight = enlargedContainerRef.value.offsetHeight;
    let width = 0;
    let height = 0;
    const scaleWidth = containerWidth / 16;
    const scaleHeight = containerHeight / 9;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / 9) * 16;
      height = containerHeight;
    }
    if (scaleWidth <= scaleHeight) {
      width = containerWidth;
      height = (containerWidth / 16) * 9;
    }
    enlargedStreamStyle.value.width = `${width}px`;
    enlargedStreamStyle.value.height = `${height}px`;
  }
}

/**
 * Handle top bar layout
 *
 * 处理顶部栏布局
**/
async function handleTopSideListLayout() {
  streamContainerClass.value = 'stream-container-top';

  if (!enlargeStream.value) {
    [enlargeStream.value] = remoteStreamList.value;
  }

  await nextTick();

  streamStyle.value = {};

  if (enlargedContainerRef.value) {
    const containerWidth = enlargedContainerRef.value.offsetWidth;
    const containerHeight = enlargedContainerRef.value.offsetHeight;
    let width = 0;
    let height = 0;
    const scaleWidth = containerWidth / 16;
    const scaleHeight = containerHeight / 9;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / 9) * 16;
      height = containerHeight;
    }
    if (scaleWidth <= scaleHeight) {
      width = containerWidth;
      height = (containerWidth / 16) * 9;
    }
    enlargedStreamStyle.value.width = `${width}px`;
    enlargedStreamStyle.value.height = `${height}px`;
  }
}

/**
 * Double-click to switch the stream to the zoom in section
 *
 * 双击切换流到放大区域
**/
function handleEnlargeStreamRegion(stream: StreamInfo) {
  if (layout.value === LAYOUT.NINE_EQUAL_POINTS) {
    basicStore.setLayout(LAYOUT.RIGHT_SIDE_LIST);
  }
  enlargeStream.value = stream;
}

/**
 * Handle the page layout when the page loads or the layout changes
 *
 * 页面加载或者 layout 改变时，处理页面布局
**/
async function handleLayout() {
  switch (layout.value as any) {
    case LAYOUT.NINE_EQUAL_POINTS:
      await handleNineEqualPointsLayout();
      break;
    case LAYOUT.RIGHT_SIDE_LIST:
      showSideList.value = true;
      enlargedContainerRef.value.style.width = 'calc(100% - 260px)';
      enlargedContainerRef.value.style.height = '100%';
      await handleRightSideListLayout();
      await handleStreamContainerScroll();
      break;
    case LAYOUT.TOP_SIDE_LIST:
      showSideList.value = true;
      enlargedContainerRef.value.style.width = '100%';
      enlargedContainerRef.value.style.height = 'calc(100% - 175px)';
      await handleTopSideListLayout();
      await handleStreamContainerScroll();
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
async function handleResize() {
  switch (layout.value as any) {
    case LAYOUT.NINE_EQUAL_POINTS:
      await handleNineEqualPointsLayout();
      break;
    case LAYOUT.RIGHT_SIDE_LIST:
      await handleRightSideListLayout();
      await handleStreamContainerScroll();
      break;
    case LAYOUT.TOP_SIDE_LIST:
      await handleTopSideListLayout();
      await handleStreamContainerScroll();
      break;
    default:
      break;
  }
}

onMounted(() => {
  handleLayout();
  ['resize', 'pageshow'].forEach((event) => {
    window.addEventListener(event, handleResize);
  });
});

onUnmounted(() => {
  ['resize', 'pageshow'].forEach((event) => {
    window.removeEventListener(event, handleResize);
  });
});

watch(streamNumber, () => {
  if (layout.value === LAYOUT.NINE_EQUAL_POINTS) {
    handleNineEqualPointsLayout();
  }
});

watch(layout, () => {
  handleLayout();
});

const showIconControl = computed(() => [LAYOUT.RIGHT_SIDE_LIST, LAYOUT.TOP_SIDE_LIST].indexOf(layout.value) >= 0);


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
      roomStore.setHasOtherScreenShare(true);
      enlargeStream.value = roomStore.remoteStreamObj[`${userId}_${streamType}`] as StreamInfo;
      if (enlargeStream.value) {
        if (layout.value !== LAYOUT.RIGHT_SIDE_LIST && layout.value !== LAYOUT.TOP_SIDE_LIST) {
          basicStore.setLayout(LAYOUT.RIGHT_SIDE_LIST);
        }
      }
    } else {
      roomStore.setHasOtherScreenShare(false);
      /**
       * Reset the stream playback layout when the remote screen sharing stream is stopped
       *
       * 远端屏幕分享流停止的时候，重新设置流播放布局
      **/
      if (userId === enlargeStream.value?.userId) {
        handleLargeStreamLeave();
      }

      logger.debug(`${logPrefix} onUserVideoStateChanged: stop`, userId, streamType);
      roomEngine.instance?.stopPlayRemoteVideo({
        userId,
        streamType,
      });
    }
  }
};

// 麦位变化
const onSeatListChanged = (eventInfo:
  { seatList: TUISeatInfo[], seatedList: TUISeatInfo[], leftList: TUISeatInfo[] }) => {
  const { seatList, seatedList, leftList } = eventInfo;
  roomStore.updateOnSeatList(seatList, seatedList, leftList);
  const leftUserIdList = leftList.map(item => item.userId);
  // 最大屏用户下麦时，需要更换最大屏用户
  if (enlargeStream.value && leftUserIdList.includes(enlargeStream.value?.userId)) {
    handleLargeStreamLeave();
  }
};

// 远端用户离开
const onRemoteUserLeaveRoom = (eventInfo: { userInfo: TUIUserInfo }) => {
  const { userInfo: { userId } } = eventInfo;
  roomStore.removeRemoteUser(userId);
  if (userId === enlargeStream.value?.userId) {
    handleLargeStreamLeave();
  }
};

// 处理大窗口流离开
const handleLargeStreamLeave = () => {
  if (roomStore.remoteStreamList.length === 0) {
    basicStore.setLayout(LAYOUT.NINE_EQUAL_POINTS);
    enlargeStream.value = null;
  } else {
    [enlargeStream.value] = roomStore.remoteStreamList;
  }
};

// 处理侧边栏&顶部栏的视频懒加载
const handleStreamContainerScroll = async () => {
  const childDom = streamListRef.value.children[0];
  // 添加 nextTick 处理顶部栏模式下新增用户触发 scroll，但是拿到的 streamListRef.value.offsetWidth 还没有更新的问题
  await nextTick();

  // 从第几个
  let index = 0;
  let finalIndex = 0;
  // 可视区域有几个
  let number = 0;

  if (layout.value === LAYOUT.RIGHT_SIDE_LIST) {
    const firstChildHeight = childDom.offsetHeight + 10;
    const normalChildHeight = childDom.offsetHeight + 14;
    const streamListRefEnd = streamListRef.value.scrollTop + streamListRef.value.offsetHeight;
    index = Math.floor((streamListRef.value.scrollTop - firstChildHeight) / normalChildHeight) + 1;
    finalIndex = Math.ceil((streamListRefEnd - firstChildHeight) / normalChildHeight) + 1;
  } else if (layout.value === LAYOUT.TOP_SIDE_LIST) {
    const firstChildWidth = childDom.offsetWidth;
    const normalChildWidth = childDom.offsetWidth + 14;
    const streamListRefEnd = streamListRef.value.scrollLeft + streamListRef.value.offsetWidth;
    index = Math.floor((streamListRef.value.scrollLeft - firstChildWidth) / normalChildWidth) + 1;
    finalIndex = Math.ceil((streamListRefEnd - firstChildWidth) / normalChildWidth) + 1;
  }
  if (index < 0) {
    index = 0;
  }
  number = finalIndex - index;
  if (number > (showStreamList.value.length - index)) {
    number = showStreamList.value.length - index;
  }

  const streamUserIdList = [];
  [...new Array(number)].forEach(() => {
    const currentStreamId = `${showStreamList.value[index].userId}_${showStreamList.value[index].streamType}`;
    streamUserIdList.push(currentStreamId);
    index = index + 1;
  });
  streamUserIdList.push(enlargeDomId.value);

  // 修改对应的 streamInfo 的 isVisible 为 true
  roomStore.updateUserStreamVisible(streamUserIdList);
};

const handleStreamContainerScrollDebounce = debounce(handleStreamContainerScroll, 300);

onMounted(() => {
  streamListRef.value.addEventListener('scroll', handleStreamContainerScrollDebounce);
});

onUnmounted(() => {
  streamListRef.value && streamListRef.value.removeEventListener('scroll', handleStreamContainerScrollDebounce);
});

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRemoteUserEnterRoom, onRemoteUserEnterRoom);
  roomEngine.instance?.on(TUIRoomEvents.onRemoteUserLeaveRoom, onRemoteUserLeaveRoom);
  roomEngine.instance?.on(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserVideoStateChanged, onUserVideoStateChanged);
  roomEngine.instance?.on(TUIRoomEvents.onUserAudioStateChanged, onUserAudioStateChanged);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRemoteUserEnterRoom, onRemoteUserEnterRoom);
  roomEngine.instance?.off(TUIRoomEvents.onRemoteUserLeaveRoom, onRemoteUserLeaveRoom);
  roomEngine.instance?.off(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserVideoStateChanged, onUserVideoStateChanged);
  roomEngine.instance?.off(TUIRoomEvents.onUserAudioStateChanged, onUserAudioStateChanged);
});
</script>

<style lang="scss" scoped>
@import '../../../assets/style/var.scss';

.stream-container-flatten {
  width: 100%;
  height: 100%;
  background-color: var(--stream-container-flatten-bg-color);
  overflow: hidden;
  .stream-list-container {
    width: 100%;
    height: 100%
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
      margin: 4px;
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
  * {
    transform: rotate(180deg);
  }
}
.arrow-right {
  width: 20px;
  height: 52px;
  position: fixed;
  right: 250px;
  transform: translate(-50%);
  top: calc((100% - 148px) / 2 + 58px);
  border-radius: 4px 0 0 4px;
  * {
    transform: rotate(90deg);
  }
}
.arrow-left {
  width: 20px;
  height: 52px;
  position: fixed;
  right: -10px;
  transform: translate(-50%);
  top: calc((100% - 148px) / 2 + 58px);
  border-radius: 4px 0 0 4px;
  * {
    transform: rotate(270deg);
  }
}

.stream-container-top {
  width: 100%;
  height: 100%;
  background-color: var(--stream-container-flatten-bg-color);
  overflow: hidden;
  position: relative;
  .enlarged-stream-container {
    width: 100%;
    height: calc(100% - 175px);
    position: absolute;
    top: 175px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .stream-list-container {
    width: 100%;
    height: 175px;
    background-color: var(--stream-list-container);
    position: absolute;
    top: 0;
    left: 0;
    padding: 20px 40px;
    display: flex;
    justify-content: center;
    &.hide-list {
      transform: translateY(-175px);
    }
    .stream-list {
      display: flex;
      overflow-x: scroll;
      max-width: 100%;
      max-height: 100%;
      &::-webkit-scrollbar {
        display: none;
      }
      .single-stream {
        width: 240px;
        height: 135px;
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;
        &:not(:first-child) {
          margin-left: 14px;
        }
      }
    }
  }
}

.stream-container-right {
  width: 100%;
  height: 100%;
  background-color: var(--stream-container-flatten-bg-color);
  overflow: hidden;
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-content: center;
  .enlarged-stream-container {
    width: calc(100% - 260px);
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .stream-list-container {
    width: 260px;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    padding: 48px 10px 80px;
    background-color: var(--stream-list-container);
    display: flex;
    align-items: center;
    &.hide-list {
      transform: translateX(260px);
    }
    &::before {
      content: '';
      width: 100%;
      height: 40px;
      position: absolute;
      top: 48px;
      left: 0;
      opacity: 0.1;
    }
  }
  .stream-list {
    max-width: 100%;
    max-height: 100%;
    overflow-y: scroll;
    padding: 10px 0;
    &::-webkit-scrollbar {
      display: none;
    }
    .single-stream {
      width: 240px;
      height: 135px;
      border-radius: 4px;
      overflow: hidden;
      &:not(:first-child) {
        margin-top: 14px;
      }
    }
  }
}

.turn-page-container {
  width: 100%;
  height: 86px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  .turn-page-arrow-container {
    width: 40px;
    height: 86px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4.21px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .left-container {
    position: absolute;
    left: 24px;
  }
  .right-container {
    position: absolute;
    right: 24px;
  }
  .turn-page-arrow {
    background-image: url(../../../assets/icons/svg/turn-page-arrow-left.svg);
    width: 14px;
    height: 23px;
    background-size: 100% 100%;
  }
  .turn-page-right {
    transform: rotateY(180deg);
  }
}
</style>
