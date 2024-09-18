<template>
  <div ref="streamContainerRef" class="stream-container">
    <TuiSwiper
      :activeIndex="currentPageIndex"
      @change="handleActiveIndexChange"
    >
      <TuiSwiperItem>
        <div class="page-stream-container">
          <StreamRegion
            class="enlarge-stream"
            :streamInfo="enlargeStream"
            :isEnlarge="true"
            :isNeedPlayStream="showPageIndexList.includes(0)"
          />
          <StreamRegion
            class="top-right-stream"
            :class="showRoomTool ? 'show-room-tool' : ''"
            v-if="topRightStream"
            :streamInfo="topRightStream"
            :isNeedPlayStream="showPageIndexList.includes(0)"
            :style="topRightStyle"
          />
        </div>
      </TuiSwiperItem>
      <TuiSwiperItem v-for="(streamList, index) in showStreamList" :key="index">
        <StreamList
          class="page-stream-container"
          @room-dblclick="handleEnlargeStreamRegion"
          aspectRatio="1:1"
          :horizontalCount="horizontalCount"
          :verticalCount="verticalCount"
          :isNeedPlayStream="showPageIndexList.includes(index + 1)"
          :streamInfoList="streamList"
        />
      </TuiSwiperItem>
    </TuiSwiper>
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
  defineProps,
  onMounted,
} from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import StreamRegion from '../StreamRegion';
import StreamList from '../StreamList/index.vue';
import logger from '../../../utils/common/logger';
import TuiSwiper from '../../common/base/Swiper.vue';
import TuiSwiperItem from '../../common/base/SwiperItem.vue';

import TUIRoomEngine, {
  TUIChangeReason,
  TUIRoomEvents,
  TUIVideoStreamType,
} from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import useStreamContainer from './useStreamContainerHooks';

const logPrefix = '[StreamContainer]';
const {
  currentRemoteSpeakerUserId,
  currentSpeakerUserId,
  onUserVoiceVolumeChanged,
  isSameStream,
  getStreamKey,
} = useStreamContainer();

const roomEngine = useGetRoomEngine();

defineProps<{
  showRoomTool: boolean;
}>();

const streamContainerRef = ref();

const roomStore = useRoomStore();
const {
  streamList,
  localStream,
  masterUserId,
  streamInfoObj,
  remoteStreamList,
} = storeToRefs(roomStore);
const basicStore = useBasicStore();

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
    return streamInfoObj.value[
      `${currentRemoteSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`
    ];
  }
  if (remoteStreamList.value.length === 1) {
    return remoteStreamList.value[0];
  }
  if (remoteStreamList.value.length > 1) {
    if (
      !masterUserId.value ||
      masterUserId.value === localStream.value.userId ||
      !streamInfoObj.value[
        `${masterUserId.value}_${TUIVideoStreamType.kCameraStream}`
      ]
    ) {
      return remoteStreamList.value[0];
    }
    return streamInfoObj.value[
      `${masterUserId.value}_${TUIVideoStreamType.kCameraStream}`
    ];
  }
  return localStream.value;
});

const horizontalCount = ref(1);
const verticalCount = ref(1);
const currentPageIndex = ref(0);
function handleActiveIndexChange(index: number) {
  currentPageIndex.value = index;
}

const cameraStreamList = computed(() =>
  streamList.value.filter(
    (stream: StreamInfo) =>
      stream.streamType === TUIVideoStreamType.kCameraStream
  )
);

watch(
  () => cameraStreamList.value.length,
  val => {
    horizontalCount.value = Math.min(Math.ceil(Math.sqrt(val)), 2);
    verticalCount.value = Math.min(Math.ceil(val / horizontalCount.value), 3);
    const equalPointIndex = enlargeStream.value
      ? currentPageIndex.value - 1
      : currentPageIndex.value;
    if (Math.ceil(val / 6) < equalPointIndex + 1 && equalPointIndex > 0) {
      currentPageIndex.value = currentPageIndex.value - 1;
    }
  }
);

watch(
  () => streamList.value.map((stream: StreamInfo) => getStreamKey(stream)),
  (val, oldVal) => {
    if (fixedStream.value) {
      const fixedStreamKey = getStreamKey(fixedStream.value);
      if (!val.includes(fixedStreamKey) && oldVal.includes(fixedStreamKey)) {
        fixedStream.value = null;
      }
    }
    if (screenStream.value) {
      const screenStreamKey = getStreamKey(screenStream.value);
      if (!val.includes(screenStreamKey) && oldVal.includes(screenStreamKey)) {
        screenStream.value = null;
      }
    }
    if (currentRemoteSpeakerUserId.value) {
      const currentRemoteSpeakerUserKey = `${currentRemoteSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`;
      if (
        !val.includes(currentRemoteSpeakerUserKey) &&
        oldVal.includes(currentRemoteSpeakerUserKey)
      ) {
        currentRemoteSpeakerUserId.value = '';
      }
    }
  }
);

const topRightStyle = ref({ width: '0', height: '0 ' });
const topRightStream = computed(() => {
  if (
    fixedStream.value &&
    screenStream.value &&
    !isSameStream(fixedStream.value, screenStream.value)
  ) {
    return screenStream.value;
  }
  if (isSameStream(enlargeStream.value, screenStream.value)) {
    if (
      currentSpeakerUserId.value &&
      currentSpeakerUserId.value !== basicStore.userId
    ) {
      return streamInfoObj.value[
        `${currentSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`
      ];
    }
    return localStream.value;
  }
  if (isSameStream(enlargeStream.value, localStream.value)) {
    if (currentRemoteSpeakerUserId.value) {
      return streamInfoObj.value[
        `${currentRemoteSpeakerUserId.value}_${TUIVideoStreamType.kCameraStream}`
      ];
    }
    return remoteStreamList.value[0];
  }
  return localStream.value;
});

onMounted(() => {
  const containerWidth = streamContainerRef.value?.offsetWidth / 2;
  topRightStyle.value.width = `${containerWidth}px`;
  topRightStyle.value.height = `${containerWidth}px`;
});

const showPageIndexList = computed(() => {
  const showPageIndexList = [currentPageIndex.value];
  if (currentPageIndex.value - 1 >= 0) {
    showPageIndexList.unshift(currentPageIndex.value - 1);
  }
  if (currentPageIndex.value + 1 <= totalPageNumber.value) {
    showPageIndexList.push(currentPageIndex.value + 1);
  }
  return showPageIndexList;
});

/**
 * ----- The following handles the nine-pane page flip logic -----
 **/
const showStreamList: ComputedRef<StreamInfo[][]> = computed(() => {
  if (streamList.value.length <= 1) {
    return [];
  }
  return [...new Array(totalPageNumber.value - 1).keys()].map(
    (pageIndex: number) => {
      return cameraStreamList.value.slice(pageIndex * 6, pageIndex * 6 + 6);
    }
  );
});

/**
 * Show left and right page flip icons
 **/
const totalPageNumber = computed(() => {
  const videoStreamNumber = cameraStreamList.value.length;
  const totalPageOfVideoStream =
    videoStreamNumber > 6 ? Math.ceil(videoStreamNumber / 6) : 1;
  return totalPageOfVideoStream + 1;
});

/**
 * Double-click to switch the stream to the zoom in section
 **/
function handleEnlargeStreamRegion(stream: StreamInfo) {
  if (!stream?.hasVideoStream) {
    return;
  }
  currentPageIndex.value = 0;
  fixedStream.value = stream;
}

/**
 * --- The following processing stream events ----
 **/
const onUserVideoStateChanged = (eventInfo: {
  userId: string;
  streamType: TUIVideoStreamType;
  hasVideo: boolean;
  reason: TUIChangeReason;
}) => {
  const { userId, streamType, hasVideo } = eventInfo;
  if (streamType === TUIVideoStreamType.kScreenStream) {
    if (hasVideo) {
      screenStream.value = roomStore.streamInfoObj[
        `${userId}_${streamType}`
      ] as StreamInfo;
      fixedStream.value = null;
      currentPageIndex.value = 0;
    } else {
      logger.debug(
        `${logPrefix} onUserVideoStateChanged: stop`,
        userId,
        streamType
      );
      roomEngine.instance?.stopPlayRemoteVideo({
        userId,
        streamType,
      });
      screenStream.value = null;
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
  display: flex;
  width: 100%;
  height: 100%;
  background-color: var(--stream-container-flatten-bg-color);
}

.page-stream-container {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.enlarge-stream {
  width: 100%;
  height: 100%;
}

.top-right-stream {
  position: absolute;
  top: 0;
  right: 0;

  &.show-room-tool {
    top: 64px;
  }
}
</style>
