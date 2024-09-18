<template>
  <div id="streamContainer" :class="streamContainerClass">
    <div
      v-show="enlargeStream"
      ref="enlargedContainerRef"
      class="enlarged-stream-container"
    >
      <StreamRegion
        v-if="enlargeStream"
        :streamInfo="enlargeStream"
        aspectRatio="16:9"
        :isEnlarge="true"
        :observerViewInVisible="true"
      />
    </div>
    <StreamList
      :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]"
      :streamInfoList="showStreamList"
      :horizontalCount="horizontalCount"
      :verticalCount="verticalCount"
      aspectRatio="16:9"
      :observerViewInVisible="true"
      @room-dblclick="handleEnlargeStreamRegion"
    />
    <!-- Sidebar and upper sidebar arrows -->
    <arrow-stroke
      v-if="showIconControl && (showRoomTool || showSideList)"
      :class="[`arrow-stroke-${arrowDirection}`]"
      :stroke-position="strokePosition"
      :arrow-direction="arrowDirection"
      :has-stroke="showSideList"
      @click-arrow="handleClickIcon"
    />
    <!-- Nine-pane left and right page flip control bar -->
    <div v-if="showTurnPageControl && showRoomTool" class="turn-page-container">
      <div
        v-show="showTurnPageLeftArrow"
        class="turn-page-arrow-container left-container"
        @click="handleTurnPageLeft"
      >
        <svg-icon :icon="ArrowStrokeTurnPageIcon" />
      </div>
      <div
        v-show="showTurnPageRightArrow"
        class="turn-page-arrow-container right-container"
        @click="handleTurnPageRight"
      >
        <svg-icon class="turn-page-right" :icon="ArrowStrokeTurnPageIcon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, Ref, watch, computed, defineProps } from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import StreamRegion from '../StreamRegion';
import StreamList from '../StreamList/index.vue';
import logger from '../../../utils/common/logger';
import ArrowStrokeTurnPageIcon from '../../common/icons/ArrowStrokeTurnPageIcon.vue';
import ArrowStroke from '../../common/ArrowStroke.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';

import TUIRoomEngine, {
  TUIUserInfo,
  TUIChangeReason,
  TUIRoomEvents,
  TUIVideoStreamType,
  TUISeatInfo,
} from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';

const logPrefix = '[StreamContainer]';
const roomEngine = useGetRoomEngine();

defineProps<{
  showRoomTool: boolean;
}>();

const roomStore = useRoomStore();
const { streamList, streamNumber, remoteStreamList } = storeToRefs(roomStore);
const basicStore = useBasicStore();
const { layout } = storeToRefs(basicStore);
const showSideList = ref(true);

const enlargeStream: Ref<StreamInfo | null> = ref(null);
const horizontalCount = ref(1);
const verticalCount = ref(1);
const currentPageIndex = ref(0);
const maxCountEveryPage = computed(
  () => horizontalCount.value * verticalCount.value
);
const totalPage = computed(() =>
  Math.ceil(streamList.value.length / maxCountEveryPage.value)
);

/**
 * Show left and right page flip icons
 **/
const showTurnPageControl = computed(
  () => layout.value === LAYOUT.NINE_EQUAL_POINTS && totalPage.value > 1
);
/**
 * Whether or not to show the nine-page-to-left button
 **/
const showTurnPageLeftArrow = computed(
  () => layout.value === LAYOUT.NINE_EQUAL_POINTS && currentPageIndex.value > 0
);
/**
 * Whether or not to display the nine-pane rightward-facing page button
 **/
const showTurnPageRightArrow = computed(
  () =>
    layout.value === LAYOUT.NINE_EQUAL_POINTS &&
    currentPageIndex.value < totalPage.value - 1
);

/**
 * Nine grid layout towards the left to turn the page
 **/
function handleTurnPageLeft() {
  currentPageIndex.value = currentPageIndex.value - 1;
}

/**
 * Nine grid layout towards the right to turn the page
 **/
function handleTurnPageRight() {
  currentPageIndex.value = currentPageIndex.value + 1;
}

const showStreamList = computed(() => {
  if (layout.value === LAYOUT.NINE_EQUAL_POINTS) {
    return streamList.value.slice(
      currentPageIndex.value * maxCountEveryPage.value,
      (currentPageIndex.value + 1) * maxCountEveryPage.value
    );
  }
  if (enlargeStream.value?.streamType === TUIVideoStreamType.kScreenStream) {
    return streamList.value.filter(item => item !== enlargeStream.value);
  }
  return streamList.value;
});

watch(
  () => streamList.value.length,
  val => {
    // When there is only one stream, switch to a nine-grid layout
    if (val === 1) {
      basicStore.setLayout(LAYOUT.NINE_EQUAL_POINTS);
      enlargeStream.value = null;
      return;
    }
  }
);

/**
 * ----- The following processing stream layout ---------
 **/
const streamContainerClass = ref('stream-container-flatten');
const enlargedContainerRef = ref();

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
}

/**
 * Get stream information for large region areas
 */
function getEnlargeStream() {
  if (roomStore.localScreenStream?.hasVideoStream) {
    return roomStore.localScreenStream;
  }
  if (remoteStreamList.value.length > 0) {
    const remoteScreenStream = remoteStreamList.value.find(
      stream =>
        stream.streamType === TUIVideoStreamType.kScreenStream &&
        stream.hasVideoStream
    );
    return remoteScreenStream ? remoteScreenStream : remoteStreamList.value[0];
  }
  return roomStore.localStream;
}

async function handleNineEqualPointsLayout() {
  streamContainerClass.value = 'stream-container-flatten';
  enlargeStream.value = null;
  horizontalCount.value = Math.min(
    Math.ceil(Math.sqrt(streamList.value.length)),
    3
  );
  verticalCount.value = Math.min(
    Math.ceil(streamList.value.length / horizontalCount.value),
    3
  );
  currentPageIndex.value = 0;
}

/**
 * Handle sidebar layout
 **/
async function handleRightSideListLayout() {
  streamContainerClass.value = 'stream-container-right';
  horizontalCount.value = 1;
  verticalCount.value = Infinity;
  if (!enlargeStream.value) {
    enlargeStream.value = getEnlargeStream();
  }
}

/**
 * Handle top bar layout
 **/
async function handleTopSideListLayout() {
  streamContainerClass.value = 'stream-container-top';
  horizontalCount.value = Infinity;
  verticalCount.value = 1;
  if (!enlargeStream.value) {
    enlargeStream.value = getEnlargeStream();
  }
}

/**
 * Double-click to switch the stream to the zoom in section
 **/
function handleEnlargeStreamRegion(stream: StreamInfo) {
  if (
    layout.value === LAYOUT.NINE_EQUAL_POINTS &&
    streamList.value.length > 1
  ) {
    basicStore.setLayout(LAYOUT.RIGHT_SIDE_LIST);
  }
  enlargeStream.value = stream;
}

/**
 * Handle the page layout when the page loads or the layout changes
 **/
async function handleLayout() {
  switch (layout.value as any) {
    case LAYOUT.NINE_EQUAL_POINTS:
      handleNineEqualPointsLayout();
      break;
    case LAYOUT.RIGHT_SIDE_LIST:
      handleRightSideListLayout();
      break;
    case LAYOUT.TOP_SIDE_LIST:
      handleTopSideListLayout();
      break;
    default:
      break;
  }
}

watch(streamNumber, val => {
  if (layout.value === LAYOUT.NINE_EQUAL_POINTS) {
    horizontalCount.value = Math.min(Math.ceil(Math.sqrt(val)), 3);
    verticalCount.value = Math.min(Math.ceil(val / horizontalCount.value), 3);
    if (currentPageIndex.value > Math.ceil(val / maxCountEveryPage.value) - 1) {
      currentPageIndex.value = Math.ceil(val / maxCountEveryPage.value) - 1;
    }
  }
});

watch(
  layout,
  () => {
    handleLayout();
  },
  { immediate: true }
);

const showIconControl = computed(
  () =>
    [LAYOUT.RIGHT_SIDE_LIST, LAYOUT.TOP_SIDE_LIST].indexOf(layout.value) >= 0
);

const onUserVideoStateChanged = (eventInfo: {
  userId: string;
  streamType: TUIVideoStreamType;
  hasVideo: boolean;
  reason: TUIChangeReason;
}) => {
  const { userId, streamType, hasVideo } = eventInfo;
  // Handle flow layout when screen sharing flow changes
  if (streamType === TUIVideoStreamType.kScreenStream) {
    if (hasVideo) {
      enlargeStream.value =
        userId === basicStore.userId
          ? roomStore.localScreenStream
          : roomStore.streamInfoObj[`${userId}_${streamType}`];
      if (
        enlargeStream.value &&
        [LAYOUT.RIGHT_SIDE_LIST, LAYOUT.TOP_SIDE_LIST].indexOf(layout.value) ===
          -1
      ) {
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
      logger.debug(
        `${logPrefix} onUserVideoStateChanged: stop`,
        userId,
        streamType
      );
      roomEngine.instance?.stopPlayRemoteVideo({
        userId,
        streamType,
      });
    }
  }
};

// Wheat level changes
const onSeatListChanged = (eventInfo: {
  seatList: TUISeatInfo[];
  seatedList: TUISeatInfo[];
  leftList: TUISeatInfo[];
}) => {
  const { leftList } = eventInfo;
  const leftUserIdList = leftList.map(item => item.userId);
  // When the user with the largest screen logs in, the user with the largest screen needs to be replaced.
  if (
    enlargeStream.value &&
    leftUserIdList.includes(enlargeStream.value?.userId)
  ) {
    handleLargeStreamLeave();
  }
};

// Remote user leaves
const onRemoteUserLeaveRoom = (eventInfo: { userInfo: TUIUserInfo }) => {
  const {
    userInfo: { userId },
  } = eventInfo;
  if (userId === enlargeStream.value?.userId) {
    handleLargeStreamLeave();
  }
};

// Handle large window stream leaving
const handleLargeStreamLeave = () => {
  if (roomStore.remoteStreamList.length === 0) {
    basicStore.setLayout(LAYOUT.NINE_EQUAL_POINTS);
    enlargeStream.value = null;
  } else {
    [enlargeStream.value] = roomStore.remoteStreamList;
  }
};

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(
    TUIRoomEvents.onRemoteUserLeaveRoom,
    onRemoteUserLeaveRoom
  );
  roomEngine.instance?.on(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.on(
    TUIRoomEvents.onUserVideoStateChanged,
    onUserVideoStateChanged
  );
});

onUnmounted(() => {
  roomEngine.instance?.off(
    TUIRoomEvents.onRemoteUserLeaveRoom,
    onRemoteUserLeaveRoom
  );
  roomEngine.instance?.off(TUIRoomEvents.onSeatListChanged, onSeatListChanged);
  roomEngine.instance?.off(
    TUIRoomEvents.onUserVideoStateChanged,
    onUserVideoStateChanged
  );
});
</script>

<style lang="scss" scoped>
.stream-container-flatten {
  width: 100%;
  height: 100%;
  padding: 25px 20px;
  overflow: hidden;

  .stream-list-container {
    width: 100%;
    height: 100%;
  }
}

.arrow-stroke-right {
  position: absolute;
  top: 0;
  right: 280px;
}

.arrow-stroke-left {
  position: absolute;
  top: 0;
  right: 12px;
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

.stream-container-top .single-stream:not(:first-child) {
  margin-left: 14px;
}

.stream-container-right .single-stream:not(:first-child) {
  margin-top: 14px;
}

.stream-container-top {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .enlarged-stream-container {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    padding: 25px 20px;
  }

  .stream-list-container {
    position: relative;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 175px;
    padding: 20px 40px;

    &.hide-list {
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-166px);
    }
  }
}

.stream-container-right {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  place-content: center space-between;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .enlarged-stream-container {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    width: calc(100% - 280px);
    height: calc(100%);
    padding: 25px 20px;
  }

  .stream-list-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 280px;
    height: 100%;
    padding: 20px;

    &.hide-list {
      position: absolute;
      top: 0;
      right: 0;
      width: 280px;
      transform: translateX(270px);
    }

    &::before {
      position: absolute;
      top: 10px;
      left: 0;
      width: 100%;
      height: 40px;
      content: '';
      opacity: 0.1;
    }
  }
}

.turn-page-container {
  position: absolute;
  top: 50%;
  left: 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  transform: translateY(-50%);

  .turn-page-arrow-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 60px;
    color: var(--turn-page-arrow-color);
    cursor: pointer;
    background: var(--turn-page-background-color);
    backdrop-filter: blur(2.25px);
    border-radius: 32px;

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

.tui-theme-black .turn-page-container {
  --turn-page-background-color: rgba(114, 122, 138, 0.4);
  --turn-page-hover-background-color: rgba(114, 122, 138, 0.7);
  --turn-page-arrow-color: #d5e0f2;
}

.tui-theme-white .turn-page-container {
  --turn-page-background-color: rgba(114, 122, 138, 0.4);
  --turn-page-hover-background-color: rgba(114, 122, 138, 0.7);
  --turn-page-arrow-color: white;
}
</style>
