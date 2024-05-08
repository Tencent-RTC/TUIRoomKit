<template>
  <div id="streamContainer" :class="streamContainerClass">
    <div v-show="showIconControl" ref="enlargedContainerRef" class="enlarged-stream-container">
      <stream-region
        v-if="enlargeStream"
        :key="`${enlargeStream.userId}_${enlargeStream.streamType}`"
        :stream="enlargeStream"
        :style="enlargedStreamStyle"
      ></stream-region>
    </div>
    <div :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]">
      <div
        ref="streamListRef"
        :style="streamListStyle"
        class="stream-list"
        @scroll="handleStreamContainerScrollDebounce"
        @wheel="handleWheel"
      >
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
    -->
    <arrow-stroke
      v-if="showIconControl && (showRoomTool || showSideList)"
      :class="[`arrow-stroke-${arrowDirection}`]"
      :stroke-position="strokePosition"
      :arrow-direction="arrowDirection"
      :has-stroke="showSideList"
      @click-arrow="handleClickIcon"
    ></arrow-stroke>
    <!--
    *Nine-pane left and right page flip control bar
    *
    -->
    <div v-if="showTurnPageControl && showRoomTool" class="turn-page-container">
      <div
        v-show="showTurnPageLeftArrow"
        class="turn-page-arrow-container left-container"
        @click="handleTurnPageLeft"
      >
        <svg-icon :icon="ArrowStrokeTurnPageIcon"></svg-icon>
      </div>
      <div
        v-show="showTurnPageRightArrow"
        class="turn-page-arrow-container right-container"
        @click="handleTurnPageRight"
      >
        <svg-icon class="turn-page-right" :icon="ArrowStrokeTurnPageIcon"></svg-icon>
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
import StreamRegion from '../StreamRegion/index.vue';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import { debounce } from '../../../utils/utils';
import logger from '../../../utils/common/logger';
import ArrowStroke from '../../common/ArrowStroke.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import ArrowStrokeTurnPageIcon from '../../common/icons/ArrowStrokeTurnPageIcon.vue';

import TUIRoomEngine, { TUIUserInfo, TUIChangeReason, TUIRoomEvents,  TUIVideoStreamType, TUISeatInfo } from '@tencentcloud/tuiroom-engine-electron';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import useStreamContainer from './useStreamContainerHooks';
import { EventType, roomService } from '../../../services';

const logPrefix = '[StreamContainer]';
const {
  onRemoteUserEnterRoom,
  onUserAudioStateChanged,
  t,
} = useStreamContainer();
const roomEngine = useGetRoomEngine();

const verticalPadding = 50;
const horizontalPadding = 40;
const singleStreamMargin = 8;

defineProps<{
  showRoomTool: boolean,
}>();

const streamListStyle: Ref<Record<string, any>> = ref({ width: '0' });
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
**/
const currentPageIndex = ref(0);
const showStreamList: ComputedRef<StreamInfo[]> = computed(() => {
  if (layout.value !== LAYOUT.NINE_EQUAL_POINTS) {
    return streamList.value.filter(item => `${item.userId}_${item.streamType}` !== enlargeDomId.value);
  }
  return streamList.value.slice(currentPageIndex.value * 9, currentPageIndex.value * 9 + 9);
});

watch([() => showStreamList.value.map(item => item.userId), currentPageIndex], () => {
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
  if (layout.value === LAYOUT.NINE_EQUAL_POINTS && currentPageIndex.value > Math.ceil(val / 9) - 1) {
    currentPageIndex.value = Math.ceil(val / 9) - 1;
    handleNineEqualPointsLayout();
  }
});

/**
 * Show left and right page flip icons
 *
**/
const showTurnPageControl = computed(() => layout.value === LAYOUT.NINE_EQUAL_POINTS && streamNumber.value > 9);
/**
 * Whether or not to show the nine-page-to-left button
 *
**/
const showTurnPageLeftArrow = computed(() => currentPageIndex.value > 0);
/**
 * Whether or not to display the nine-pane rightward-facing page button
 *
**/
const showTurnPageRightArrow = computed(() => streamNumber.value > currentPageIndex.value * 9 + 9);

/**
 * Nine grid layout towards the left to turn the page
 *
**/
function handleTurnPageLeft() {
  currentPageIndex.value = currentPageIndex.value - 1;
  handleNineEqualPointsLayout();
}

/**
 * Nine grid layout towards the right to turn the page
 *
**/
function handleTurnPageRight() {
  currentPageIndex.value = currentPageIndex.value + 1;
  handleNineEqualPointsLayout();
}

/**
 * ----- The following processing stream layout ---------
 *
**/
const streamContainerClass = ref('');
const enlargedContainerRef = ref();
const streamListRef = ref();

const arrowDirection = computed(() => {
  let arrowDirection = 'right';
  if (layout.value === LAYOUT.TOP_SIDE_LIST) {
    arrowDirection = showSideList.value ? 'up' : 'down';
  }
  if (layout.value === LAYOUT.RIGHT_SIDE_LIST) {
    arrowDirection = showSideList.value ? 'right' : 'left';
  }
  return arrowDirection;
});

const strokePosition = computed(() => {
  let strokePosition = '';
  if (layout.value === LAYOUT.TOP_SIDE_LIST) {
    strokePosition = 'bottom';
  }
  if (layout.value === LAYOUT.RIGHT_SIDE_LIST) {
    strokePosition = 'left';
  }
  return strokePosition;
});

function handleClickIcon() {
  showSideList.value = !showSideList.value;
  if (!showSideList.value) {
    let width = 0;
    let height = 0;
    const containerWidth = document.getElementById('roomContainer')!.offsetWidth - horizontalPadding;
    const containerHeight = document.getElementById('roomContainer')!.offsetHeight - verticalPadding;
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
    if (layout.value === LAYOUT.RIGHT_SIDE_LIST) {
      handleRightSideListLayout();
      return;
    }
    if (layout.value === LAYOUT.TOP_SIDE_LIST) {
      handleTopSideListLayout();
      return;
    }
  }
}

/**
 * Handle nine-pattern layout
 *
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
  const containerWidth = roomContainerElement!.offsetWidth - horizontalPadding;
  const containerHeight = roomContainerElement!.offsetHeight - verticalPadding;
  let horizontalStreamNumber = 1;
  let verticalStreamNumber = 1;
  if (number <= 4) {
    horizontalStreamNumber = Math.min(number, 2);
    verticalStreamNumber = Math.ceil(number / 2);
  } else if (number > 4) {
    horizontalStreamNumber = 3;
    verticalStreamNumber = Math.ceil(number / 3);
  }
  const contentWidth = (containerWidth - horizontalStreamNumber * singleStreamMargin) / horizontalStreamNumber;
  const contentHeight = (containerHeight - verticalStreamNumber * singleStreamMargin) / verticalStreamNumber;

  const scaleWidth = contentWidth / 16;
  const scaleHeight = contentHeight / 9;
  if (scaleWidth > scaleHeight) {
    width = (contentHeight / 9) * 16;
    height = contentHeight;
  }
  if (scaleWidth <= scaleHeight) {
    width = contentWidth;
    height = (contentWidth / 16) * 9;
  }
  streamStyle.value.width = `${width}px`;
  streamStyle.value.height = `${height}px`;

  streamListStyle.value.width = `${horizontalStreamNumber * (width + singleStreamMargin)}px`;
}

/**
 * Get stream information for large region areas
 *
 */
function getEnlargeStream() {
  if (roomStore.localScreenStream?.hasScreenStream) {
    return roomStore.localScreenStream;
  }
  if (remoteStreamList.value.length > 0) {
    const remoteScreenStream = remoteStreamList.value.find(stream => (
      stream.streamType === TUIVideoStreamType.kScreenStream && stream.hasScreenStream
    ));
    return remoteScreenStream ? remoteScreenStream : remoteStreamList.value[0];
  }
  return roomStore.localStream;
}

/**
 * Handle sidebar layout
 *
**/
async function handleRightSideListLayout() {
  streamContainerClass.value = 'stream-container-right';

  if (!enlargeStream.value) {
    enlargeStream.value = getEnlargeStream();
  }

  await nextTick();

  streamStyle.value = {};
  streamListStyle.value = {};

  if (enlargedContainerRef.value) {
    enlargedContainerRef.value.style.width = showSideList.value ? 'calc(100% - 280px)' : '100%';
    enlargedContainerRef.value.style.height = '100%';
    const containerWidth = enlargedContainerRef.value.offsetWidth - horizontalPadding;
    const containerHeight = enlargedContainerRef.value.offsetHeight - verticalPadding;
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
**/
async function handleTopSideListLayout() {
  streamContainerClass.value = 'stream-container-top';

  if (!enlargeStream.value) {
    enlargeStream.value = getEnlargeStream();
  }

  await nextTick();

  streamStyle.value = {};
  streamListStyle.value = {};

  if (enlargedContainerRef.value) {
    enlargedContainerRef.value.style.top = showSideList.value ? '175px' : '0';
    enlargedContainerRef.value.style.width = '100%';
    enlargedContainerRef.value.style.height = showSideList.value ? 'calc(100% - 184px)' : '100%';
    const containerWidth = enlargedContainerRef.value.offsetWidth - horizontalPadding;
    const containerHeight = enlargedContainerRef.value.offsetHeight - verticalPadding;
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
**/
async function handleLayout() {
  switch (layout.value as any) {
    case LAYOUT.NINE_EQUAL_POINTS:
      await handleNineEqualPointsLayout();
      break;
    case LAYOUT.RIGHT_SIDE_LIST:
      showSideList.value = true;
      await handleRightSideListLayout();
      await handleStreamContainerScroll();
      break;
    case LAYOUT.TOP_SIDE_LIST:
      showSideList.value = true;
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
  roomService.on(EventType.ROOM_CONTAINER_RESIZE, handleResize);
  ['resize', 'pageshow'].forEach((event) => {
    window.addEventListener(event, handleResize);
  });
});

onUnmounted(() => {
  roomService.off(EventType.ROOM_CONTAINER_RESIZE, handleResize);
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
  roomStore.updateUserVideoState(userId, streamType, hasVideo);

  if (userId === basicStore.userId && !hasVideo && reason === TUIChangeReason.kChangedByAdmin) {
    if (streamType === TUIVideoStreamType.kCameraStream) {
      TUIMessage({
        type: 'warning',
        message: t('Your camera has been turned off'),
        duration: MESSAGE_DURATION.NORMAL,
      });
      // When the moderator opens the whole staff forbidden to draw,
      // open and then close the single person's camera alone, at this time
      // the corresponding user's camera status for inoperable
      roomStore.setCanControlSelfVideo(!roomStore.isCameraDisableForAllUser);
    }
    if (streamType === TUIVideoStreamType.kScreenStream) {
      TUIMessage({
        type: 'warning',
        message: t('The host has turned off your screen sharing'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  if (streamType === TUIVideoStreamType.kScreenStream) {
    if (hasVideo) {
      enlargeStream.value = userId === basicStore.userId ? roomStore.localScreenStream : roomStore.remoteStreamObj[`${userId}_${streamType}`];
      if (enlargeStream.value && [LAYOUT.RIGHT_SIDE_LIST, LAYOUT.TOP_SIDE_LIST].indexOf(layout.value) === -1) {
        basicStore.setLayout(LAYOUT.RIGHT_SIDE_LIST);
      }
      if (userId !== basicStore.userId) {
        roomStore.setHasOtherScreenShare(true);
      }
    } else {
      if (userId === enlargeStream.value?.userId) {
        handleLargeStreamLeave();
      }
      if (userId !== basicStore.userId) {
        roomStore.setHasOtherScreenShare(false);
      }
      logger.debug(`${logPrefix} onUserVideoStateChanged: stop`, userId, streamType);
      roomEngine.instance?.stopPlayRemoteVideo({
        userId,
        streamType,
      });
    }
  }
};

const onSeatListChanged = (eventInfo:
  { seatList: TUISeatInfo[], seatedList: TUISeatInfo[], leftList: TUISeatInfo[] }) => {
  const { seatedList, leftList } = eventInfo;
  roomStore.updateOnSeatList(seatedList, leftList);
  const leftUserIdList = leftList.map(item => item.userId);
  if (enlargeStream.value && leftUserIdList.includes(enlargeStream.value?.userId)) {
    handleLargeStreamLeave();
  }
};

const onRemoteUserLeaveRoom = (eventInfo: { userInfo: TUIUserInfo }) => {
  const { userInfo: { userId } } = eventInfo;
  roomStore.removeRemoteUser(userId);
  if (userId === enlargeStream.value?.userId) {
    handleLargeStreamLeave();
  }
};

const handleLargeStreamLeave = () => {
  if (roomStore.remoteStreamList.length === 0) {
    basicStore.setLayout(LAYOUT.NINE_EQUAL_POINTS);
    enlargeStream.value = null;
  } else {
    [enlargeStream.value] = roomStore.remoteStreamList;
  }
};

const handleStreamContainerScroll = async () => {
  const childDom = streamListRef.value.children[0];
  await nextTick();

  let index = 0;
  let finalIndex = 0;
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

  roomStore.updateUserStreamVisible(streamUserIdList);
};

function handleWheel(event: WheelEvent) {
  streamListRef.value.scrollLeft += event.deltaY;
}

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
.stream-container-flatten {
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 25px 20px;
  .stream-list-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-content: center;
  }
  .stream-list {
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

.arrow-stroke-right {
  position: absolute;
  right: 280px;
  top: 0;
}

.arrow-stroke-left {
  position: absolute;
  right: 12px;
  top: 0;
}

.arrow-stroke-up {
  position: absolute;
  top: 175px;
  left: 0;
}

.arrow-stroke-down {
  position: absolute;
  top: 76px;
  left: 0;
}

.stream-container-top {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  .enlarged-stream-container {
    width: 100%;
    height: calc(100% - 184px);
    padding: 25px 20px;
    position: absolute;
    top: 175px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .stream-list-container {
    width: 100%;
    height: 175px;
    position: absolute;
    top: 0;
    left: 0;
    padding: 20px 40px;
    display: flex;
    justify-content: center;
    &.hide-list {
      transform: translateY(-166px);
    }
    .stream-list {
      display: flex;
      overflow-x: scroll;
      max-width: 100%;
      max-height: 100%;
      scrollbar-width: none;
      -ms-overflow-style: none;
      &::-webkit-scrollbar {
        display: none;
      }
      .single-stream {
        width: 240px;
        height: 135px;
        border-radius: 8px;
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
  overflow: hidden;
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-content: center;
  position: relative;
  .enlarged-stream-container {
    width: calc(100% - 280px);
    height: calc(100%);
    padding: 25px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .stream-list-container {
    width: 280px;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    padding: 20px;
    display: flex;
    align-items: center;
    &.hide-list {
      transform: translateX(270px);
    }
    &::before {
      content: '';
      width: 100%;
      height: 40px;
      position: absolute;
      top: 10px;
      left: 0;
      opacity: 0.1;
    }
  }
  .stream-list {
    max-width: 100%;
    max-height: 100%;
    overflow-y: scroll;
    padding: 10px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
    .single-stream {
      width: 240px;
      height: 135px;
      border-radius: 8px;
      overflow: hidden;
      &:not(:first-child) {
        margin-top: 14px;
      }
    }
  }
}

.tui-theme-black .turn-page-container {
  --turn-page-background-color: rgba(114, 122, 138, 0.4);
  --turn-page-hover-background-color: rgba(114, 122, 138, 0.7);
  --turn-page-arrow-color: #D5E0F2;
}

.tui-theme-white .turn-page-container {
  --turn-page-background-color: rgba(114, 122, 138, 0.4);
  --turn-page-hover-background-color: rgba(114, 122, 138, 0.7);
  --turn-page-arrow-color: white;
}

.turn-page-container {
  width: 100%;
  height: 60px;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  .turn-page-arrow-container {
    width: 32px;
    height: 60px;
    background: var(--turn-page-background-color);
    backdrop-filter: blur(2.25px);
    border-radius: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: var(--turn-page-arrow-color);
    &:hover {
      background: var(--turn-page-hover-background-color);
    }
  }
  .left-container {
    position: absolute;
    left: 34px;
  }
  .right-container {
    position: absolute;
    right: 34px;
  }
  .turn-page-right {
    transform: rotateY(180deg);
  }
}
</style>
