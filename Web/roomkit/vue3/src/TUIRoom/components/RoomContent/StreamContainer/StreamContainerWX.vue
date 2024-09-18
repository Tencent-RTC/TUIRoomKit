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
          :streamInfo="enlargeStream"
        />
      </div>
      <div
        class="stream-list-container"
        :class="[
          onlyVideoStreamList.length > 1
            ? 'multi-stream-container'
            : 'single-stream-container',
        ]"
      >
        <div
          ref="streamListRef"
          :class="[
            'stream-list',
            `${isFirstPageInSixPointLayout ? '' : 'not-first-page'}`,
          ]"
        >
          <stream-region
            v-show="showPusher"
            :streamInfo="localStream"
            :enlarge-dom-id="enlargeDomId"
            :show-room-tool="showRoomTool"
            :class="[
              onlyVideoStreamList.length > 1 ? 'multi-stream' : 'single-stream',
            ]"
          />
          <template
            v-for="stream in paginatedArray"
            :key="`${stream.userId}_${stream.streamType}`"
          >
            <stream-region
              v-if="basicStore.userId !== stream.userId"
              :streamInfo="stream"
              :show-room-tool="showRoomTool"
              :class="[
                onlyVideoStreamList.length > 1
                  ? 'multi-stream'
                  : 'single-stream',
              ]"
            />
          </template>
        </div>
      </div>
    </div>
    <!-- Slide the control bar left or right -->
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
import {
  ref,
  onUnmounted,
  Ref,
  ComputedRef,
  watch,
  computed,
  nextTick,
  defineProps,
} from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import StreamRegion from '../StreamRegion';
import logger from '../../../utils/common/logger';

import TUIRoomEngine, {
  TUIChangeReason,
  TUIRoomEvents,
  TUIVideoStreamType,
} from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import useStreamContainer from './useStreamContainerHooks';

const logPrefix = '[StreamContainer]';

const roomEngine = useGetRoomEngine();
const { currentSpeakerUserId, onUserVoiceVolumeChanged } = useStreamContainer();

defineProps<{
  showRoomTool: boolean;
}>();

const streamContainerRef = ref(null);

const roomStore = useRoomStore();
const { streamList, localStream, streamInfoObj } = storeToRefs(roomStore);
const basicStore = useBasicStore();

const setLayout = async (layout: LAYOUT) => {
  await nextTick();
  basicStore.setLayout(layout);
};

const { layout } = storeToRefs(basicStore);

const enlargeStream: Ref<StreamInfo | null> = ref(null);
const enlargeDomId = computed(() =>
  enlargeStream.value
    ? `${enlargeStream.value.userId}_${enlargeStream.value.streamType}`
    : ''
);
const startX = ref();
const startY = ref();

const onlyVideoStreamList = computed(() =>
  streamList.value.filter(
    stream => stream.streamType === TUIVideoStreamType.kCameraStream
  )
);
const currentPageIndex = ref(0);

const showPusher = computed(
  () =>
    (layout.value === LAYOUT.SIX_EQUAL_POINTS && isFirstPageInSixPointLayout) ||
    (layout.value === LAYOUT.LARGE_SMALL_WINDOW &&
      currentSpeakerUserId.value === localStream.value.userId)
);

const paginatedArray = computed(() => {
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    return showStreamList.value;
  }
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    const start = enlargeDomId.value
      ? (currentPageIndex.value - 1) * 6
      : currentPageIndex.value * 6;
    const end = start + 6;
    return onlyVideoStreamList.value.slice(start, end);
  }
  return [];
});
watch(
  () => onlyVideoStreamList.value.length,
  val => {
    if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
      const equalPointIndex = enlargeStream.value
        ? currentPageIndex.value - 1
        : currentPageIndex.value;
      if (Math.ceil(val / 6) < equalPointIndex + 1 && equalPointIndex > 0) {
        currentPageIndex.value = currentPageIndex.value - 1;
      }
    }
  }
);

const isFirstPageInSixPointLayout: Ref<boolean> = computed(() => {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    return enlargeStream.value
      ? currentPageIndex.value === 1
      : currentPageIndex.value === 0;
  }
  return false;
});

/**
 * ----- The following handles the nine-pane page flip logic -----
 **/
const showStreamList: ComputedRef<StreamInfo[]> = computed(() => {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    if (enlargeStream.value) {
      return onlyVideoStreamList.value.slice(
        (currentPageIndex.value - 1) * 6,
        (currentPageIndex.value - 1) * 6 + 6
      );
    }
    return onlyVideoStreamList.value.slice(
      currentPageIndex.value * 6,
      currentPageIndex.value * 6 + 6
    );
  }
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    const userId = enlargeStream.value?.userId;
    if (currentSpeakerUserId.value) {
      return currentSpeakerUserId.value === localStream.value.userId
        ? [localStream.value]
        : [
            streamInfoObj.value[
              `${currentSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`
            ],
          ];
    }
    return [
      streamInfoObj.value[`${userId}_${TUIVideoStreamType.kCameraStream}`],
    ];
  }
  return [];
});

/**
 * Show left and right page flip icons
 **/
const totalPageNumber = computed(() => {
  const videoStreamNumber = onlyVideoStreamList.value.length;
  const totalPageOfVideoStream =
    videoStreamNumber > 6 ? Math.ceil(videoStreamNumber / 6) : 1;
  return enlargeStream.value
    ? totalPageOfVideoStream + 1
    : totalPageOfVideoStream;
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

function handleTouchStart(event: any) {
  startX.value = event?.changedTouches[0]?.pageX;
  startY.value = event?.changedTouches[0]?.pageY;
}

function handleTouchEnd(event: any) {
  const moveDirectionX = event?.changedTouches[0].pageX - startX.value;
  const moveDirectionY = event?.changedTouches[0].pageY - startY.value;
  if (
    Math.abs(moveDirectionY) > Math.abs(moveDirectionX) ||
    Math.abs(moveDirectionX) < 5
  ) {
    return;
  }
  if (moveDirectionX < 0) {
    handleTurnPageRight();
  }
  if (moveDirectionX > 0) {
    handleTurnPageLeft();
  }
}

/**
 * --- The following processing stream events ----
 **/
const onUserVideoStateChanged = async (eventInfo: {
  userId: string;
  streamType: TUIVideoStreamType;
  hasVideo: boolean;
  reason: TUIChangeReason;
}) => {
  const { userId, streamType, hasVideo } = eventInfo;
  // Handle flow layout when screen sharing flow changes
  if (
    userId !== basicStore.userId &&
    streamType === TUIVideoStreamType.kScreenStream
  ) {
    if (hasVideo) {
      const largeStream = roomStore.streamInfoObj[
        `${userId}_${streamType}`
      ] as StreamInfo;
      if (largeStream) {
        enlargeStream.value = largeStream;
        await setLayout(LAYOUT.LARGE_SMALL_WINDOW);
        currentPageIndex.value = 0;
      }
    } else {
      if (userId === enlargeStream.value?.userId) {
        /**
         * Reset the stream playback layout when the remote screen sharing stream is stopped
         **/
        logger.debug(
          `${logPrefix} onUserVideoStateChanged: stop`,
          userId,
          streamType
        );
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
        } else if (
          layout.value === LAYOUT.SIX_EQUAL_POINTS &&
          currentPageIndex.value > 0
        ) {
          currentPageIndex.value = currentPageIndex.value - 1;
        }
      }
    }
  }
};

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(
    TUIRoomEvents.onUserVideoStateChanged,
    onUserVideoStateChanged
  );
  roomEngine.instance?.on(
    TUIRoomEvents.onUserVoiceVolumeChanged,
    onUserVoiceVolumeChanged
  );
});

onUnmounted(() => {
  roomEngine.instance?.off(
    TUIRoomEvents.onUserVideoStateChanged,
    onUserVideoStateChanged
  );
  roomEngine.instance?.off(
    TUIRoomEvents.onUserVoiceVolumeChanged,
    onUserVoiceVolumeChanged
  );
});
</script>

<style lang="scss" scoped>
.stream-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.stream-container-flatten {
  display: flex;
  flex-wrap: wrap;
  place-content: center flex-start;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--stream-container-flatten-bg-color);

  .stream-list-container {
    position: relative;
    width: 100%;
    height: 0;
    padding-top: 150%;

    &.multi-stream-container {
      height: 0;
      padding-top: 150%;
    }

    &.single-stream-container {
      height: 100%;
    }
  }

  .stream-list {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-wrap: wrap;
    place-content: center flex-start;
    align-items: center;
    width: 100%;
    height: 100%;

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
      position: relative;
      width: 50%;
      height: 0;
      padding-top: 50%;
      overflow: hidden;
      border-radius: 10px;
    }
  }
}

.stream-container-large-small {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--stream-container-flatten-bg-color);

  .enlarged-stream-container {
    width: 100%;
    height: 100%;
  }

  .stream-list-container {
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    padding-top: 50%;

    .stream-list {
      position: absolute;
      top: 0;
      left: 0;
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
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: var(--layout-item);
}

.swipe {
  position: absolute;
  bottom: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.swipe-dots {
  width: 8px;
  height: 8px;
  margin: 5px;
  background: #fff;
  border-radius: 20px;
  opacity: 0.6;
}

.swipe-current-dots {
  width: 8px;
  height: 8px;
  margin: 5px;
  background: #fff;
  border-radius: 20px;
  opacity: 1;
}
</style>
