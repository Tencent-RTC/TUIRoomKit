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
          :layout="layout"
          :stream="enlargeStream"
          :enlarge-dom-id="enlargeDomId"
          :is-enlarge="true"
        ></stream-region>
      </div>
      <div
        class="stream-list-container"
        :class="[
          cameraStreamList.length > 1 ? 'multi-stream-container' : 'single-stream-container',
          showRoomTool ? 'show-room-tool' : '',
        ]"
      >
        <div
          ref="streamListRef"
          :class="['stream-list', `${isFirstPageInSixPointLayout ? '' : 'not-first-page'}`]"
        >
          <stream-region
            v-for="(stream) in streamList"
            v-show="showStreamList.indexOf(stream) > -1"
            :key="`${stream.userId}_${stream.streamType}`"
            :stream="stream"
            :layout="layout"
            :enlarge-dom-id="enlargeDomId"
            :show-room-tool="showRoomTool"
            :class="[cameraStreamList.length > 1 ? 'multi-stream' : 'single-stream']"
            @click="handelStreamRegionClick"
            @room-dblclick="handleEnlargeStreamRegion(stream)"
          >
          </stream-region>
        </div>
      </div>
    </div>
    <!--Slide the control bar left or right -->
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
import { ref, onUnmounted, Ref, ComputedRef, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import StreamRegion from '../StreamRegion';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
import logger from '../../../utils/common/logger';

import TUIRoomEngine, { TUIChangeReason, TUIRoomEvents, TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import useStreamContainer from './useStreamContainerHooks';

const logPrefix = '[StreamContainer]';
const {
  currentRemoteSpeakerUserId,
  currentSpeakerUserId,
  onUserAudioStateChanged,
  onRemoteUserEnterRoom,
  onSeatListChanged,
  onRemoteUserLeaveRoom,
  onUserVoiceVolumeChanged,
  isSameStream,
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
  masterUserId,
  remoteStreamObj,
  remoteStreamList,
} = storeToRefs(roomStore);
const basicStore = useBasicStore();
const { layout } = storeToRefs(basicStore);

const screenStream: Ref<StreamInfo | null> = ref(null);
const fixedStream: Ref<StreamInfo | null> = ref(null);

const enlargeStream = computed(() => {
  if (fixedStream.value) {
    return fixedStream.value;
  }
  if (screenStream.value) {
    return screenStream.value;
  }
  if (currentRemoteSpeakerUserId.value) {
    return remoteStreamObj.value[`${currentRemoteSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`];
  }
  if (remoteStreamList.value.length === 1) {
    return remoteStreamList.value[0];
  }
  if (remoteStreamList.value.length > 1) {
    if (!masterUserId.value || masterUserId.value === localStream.value.userId || !remoteStreamObj.value[`${masterUserId.value}_${TUIVideoStreamType.kCameraStream}`]) {
      return remoteStreamList.value[0];
    }
    return remoteStreamObj.value[`${masterUserId.value}_${TUIVideoStreamType.kCameraStream}`];
  }
  return localStream.value;
});

const enlargeDomId = computed(() => (enlargeStream.value ? `${enlargeStream.value.userId}_${enlargeStream.value.streamType}` : ''));
const startX = ref();
const startY = ref();

const currentPageIndex = ref(0);

const cameraStreamList = computed(() => (
  streamList.value.filter((stream: StreamInfo) => stream.streamType === TUIVideoStreamType.kCameraStream)
));

watch(() => cameraStreamList.value.length, (val) => {
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    const equalPointIndex = enlargeStream.value ? currentPageIndex.value - 1 : currentPageIndex.value;
    if (Math.ceil(val / 6) < equalPointIndex + 1 && equalPointIndex > 0) {
      currentPageIndex.value = currentPageIndex.value - 1;
    }
  }
});

watch(() => streamList.value.length, (val) => {
  if (val <= 2) {
    basicStore.setLayout(LAYOUT.LARGE_SMALL_WINDOW);
    currentPageIndex.value = 0;
  }
});

watch(() => streamList.value.map((stream: StreamInfo) => `${stream.userId}-${stream.streamType}`), (val) => {
  if (fixedStream.value && !val.includes(`${fixedStream.value.userId}-${fixedStream.value.streamType}`)) {
    fixedStream.value = null;
  }
  if (screenStream.value && !val.includes(`${screenStream.value.userId}-${screenStream.value.streamType}`)) {
    screenStream.value = null;
  }
  if (currentRemoteSpeakerUserId.value && !val.includes(`${currentRemoteSpeakerUserId.value}-${TUIVideoStreamType.kCameraStream}`)) {
    currentRemoteSpeakerUserId.value = '';
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
**/
const showStreamList: ComputedRef<StreamInfo[]> = computed(() => {
  if (streamList.value.length <= 1) {
    return [];
  }
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    if (enlargeStream.value) {
      return cameraStreamList.value.slice((currentPageIndex.value - 1) * 6, (currentPageIndex.value - 1) * 6 + 6);
    }
  }
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    if (fixedStream.value
      && screenStream.value
      && !isSameStream(fixedStream.value, screenStream.value)) {
      return [screenStream.value];
    }
    if (isSameStream(enlargeStream.value, screenStream.value)) {
      if (currentSpeakerUserId.value && currentSpeakerUserId.value !== basicStore.userId) {
        return [remoteStreamObj.value[`${currentSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`]];
      }
      return [localStream.value];
    }
    if (isSameStream(enlargeStream.value, localStream.value)) {
      if (currentRemoteSpeakerUserId.value) {
        return [remoteStreamObj.value[`${currentRemoteSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`]];
      }
      return [remoteStreamList.value[0]];
    }
    return [localStream.value];
  }
  return [];
});


/**
 * Show left and right page flip icons
**/
const totalPageNumber = computed(() => {
  if (streamList.value.length <= 2) {
    return 1;
  }
  const videoStreamNumber = cameraStreamList.value.length;
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
**/
function handleTurnPageLeft() {
  if (currentPageIndex.value === 0) {
    return;
  }
  currentPageIndex.value = currentPageIndex.value - 1;
  if (enlargeStream.value && currentPageIndex.value === 0) {
    basicStore.setLayout(LAYOUT.LARGE_SMALL_WINDOW);
  }
}

/**
 * Swipe right to turn the page
 *
**/
function handleTurnPageRight() {
  if (currentPageIndex.value === totalPageNumber.value - 1) {
    return;
  }
  currentPageIndex.value = currentPageIndex.value + 1;
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    basicStore.setLayout(LAYOUT.SIX_EQUAL_POINTS);
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
  if (Math.abs(moveDirectionY) > Math.abs(moveDirectionX) || Math.abs(moveDirectionX) < 5) {
    return;
  }
  if (moveDirectionX < 0) {
    // Swipe right
    handleTurnPageRight();
  }
  if (moveDirectionX > 0) {
    // Swipe left
    handleTurnPageLeft();
  }
}

/**
 * Double-click to switch the stream to the zoom in section
**/
function handleEnlargeStreamRegion(stream: StreamInfo) {
  if (!stream.hasVideoStream) {
    return;
  }
  if (layout.value === LAYOUT.SIX_EQUAL_POINTS) {
    basicStore.setLayout(LAYOUT.LARGE_SMALL_WINDOW);
    currentPageIndex.value = 0;
    fixedStream.value = stream;
  }
}

function handelStreamRegionClick(event: Event) {
  if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
    event.stopPropagation();
  }
}

/**
 * --- The following processing stream events ----
**/
const onUserVideoStateChanged = (eventInfo: {
  userId: string,
  streamType: TUIVideoStreamType,
  hasVideo: boolean,
  reason: TUIChangeReason,
}) => {
  const { userId, streamType, hasVideo, reason } = eventInfo;
  // Update roomStore flow state data
  roomStore.updateUserVideoState(userId, streamType, hasVideo);

  // Handle status changes
  if (userId === basicStore.userId && !hasVideo && reason === TUIChangeReason.kChangedByAdmin) {
    // The host turns off the camera
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
    // Host turns off screen sharing
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
      screenStream.value = roomStore.remoteStreamObj[`${userId}_${streamType}`] as StreamInfo;
      fixedStream.value = null;
      basicStore.setLayout(LAYOUT.LARGE_SMALL_WINDOW);
      currentPageIndex.value = 0;
    } else {
      logger.debug(`${logPrefix} onUserVideoStateChanged: stop`, userId, streamType);
      roomEngine.instance?.stopPlayRemoteVideo({
        userId,
        streamType,
      });
      screenStream.value = null;
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

    &.show-room-tool {
      top: 64px;
    }

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
