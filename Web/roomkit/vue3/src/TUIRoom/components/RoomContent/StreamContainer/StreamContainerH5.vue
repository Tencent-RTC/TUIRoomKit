<template>
  <div ref="streamContainerRef" class="stream-container">
    <TuiSwiper
      :active-index="swiperActiveIndex"
      @change="handleSwiperChange"
      class="page-stream-container"
    >
      <TuiSwiperItem v-if="showLargeAndFloatPage">
        <single-stream-view
          class="enlarged-stream"
          :streamInfo="enlargeStream"
          :support-touch-scale="isEnlargeScreenStream"
        />
        <single-stream-view
          v-if="floatStream"
          :class="['float-stream', { 'show-room-tool': showRoomTool }]"
          :style="floatStreamStyle"
          :streamInfo="floatStream"
        />
      </TuiSwiperItem>
      <template v-if="showEqualPointsPage">
        <TuiSwiperItem
          v-for="(item, index) in equalPointsLayoutStreamList"
          :key="index"
        >
          <multi-stream-view
            class="page-stream-container"
            :maxColumn="maxColumn"
            :maxRow="maxRow"
            :stream-info-list="item"
            :stream-play-mode="getStreamPlayMode(index)"
            @stream-view-dblclick="handleStreamViewDblclick"
          />
        </TuiSwiperItem>
      </template>
    </TuiSwiper>
  </div>
</template>
<script setup lang="ts">
import { ref, Ref, watch, computed, onMounted, ComputedRef } from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import TuiSwiper from '../../common/base/Swiper.vue';
import TuiSwiperItem from '../../common/base/SwiperItem.vue';
import useStreamContainerHooks from './useStreamContainerHooks';
import SingleStreamView from '../../Stream/SingleStreamView/index.vue';
import MultiStreamView from '../../Stream/MultiStreamView';
import { StreamPlayMode } from '../../../services/manager/mediaManager';

const MAX_COLUMN = 2;
const MAX_ROW = 3;
const SUPPORT_LARGE_FLOAT_PAGE = true;

const basicStore = useBasicStore();
const { showRoomTool } = storeToRefs(basicStore);
const roomStore = useRoomStore();
const {
  streamList,
  cameraStreamList,
  localStream,
  masterUserId,
  streamInfoObj,
  remoteStreamList,
  remoteScreenStream,
  currentSpeakerInfo,
} = storeToRefs(roomStore);

const maxColumn = ref(MAX_COLUMN);
const maxRow = ref(MAX_ROW);
const showLargeAndFloatPage = computed(() => SUPPORT_LARGE_FLOAT_PAGE);
const showEqualPointsPage = computed(
  () => !SUPPORT_LARGE_FLOAT_PAGE || streamList.value.length > 2
);

const maxCountEveryPage = computed(() => maxColumn.value * maxRow.value);
const swiperActiveIndex = ref(0);
function handleSwiperChange(index: number) {
  swiperActiveIndex.value = index;
}

function getStreamPlayMode(index: number) {
  const equalPointsPageIndex = showLargeAndFloatPage.value
    ? swiperActiveIndex.value - 1
    : swiperActiveIndex.value;
  return Math.abs(index - equalPointsPageIndex) <= 1
    ? StreamPlayMode.PLAY
    : StreamPlayMode.STOP;
}

watch(
  () => cameraStreamList.value.length,
  val => {
    const equalPointsPages = showEqualPointsPage.value
      ? Math.ceil(val / maxCountEveryPage.value)
      : 0;
    const maxTotalPages = showLargeAndFloatPage.value
      ? equalPointsPages + 1
      : equalPointsPages;
    if (swiperActiveIndex.value > maxTotalPages - 1) {
      swiperActiveIndex.value = maxTotalPages - 1;
    }
  }
);

const equalPointsLayoutStreamList: ComputedRef<StreamInfo[][]> = computed(
  () => {
    return [
      ...new Array(
        Math.ceil(cameraStreamList.value.length / maxCountEveryPage.value)
      ).keys(),
    ].map((pageIndex: number) => {
      let currentPageStreamList = cameraStreamList.value.slice(
        pageIndex * maxCountEveryPage.value,
        (pageIndex + 1) * maxCountEveryPage.value
      );
      if (
        pageIndex > 0 &&
        currentPageStreamList.length < maxCountEveryPage.value
      ) {
        currentPageStreamList = currentPageStreamList.concat(
          ...new Array(maxCountEveryPage.value - currentPageStreamList.length)
        );
      }
      return currentPageStreamList;
    });
  }
);

const fixedStream: Ref<StreamInfo | null> = ref(null);

const enlargeStream = computed(() => {
  if (fixedStream.value) {
    return fixedStream.value;
  }
  if (remoteScreenStream.value) {
    return remoteScreenStream.value;
  }
  if (currentSpeakerInfo.value.remoteSpeakerUserId) {
    return streamInfoObj.value[
      `${currentSpeakerInfo.value.remoteSpeakerUserId}_${TUIVideoStreamType.kCameraStream}`
    ];
  }
  if (remoteStreamList.value.length === 1) {
    return remoteStreamList.value[0];
  }
  if (remoteStreamList.value.length > 1) {
    if (
      !masterUserId.value ||
      masterUserId.value === localStream.value?.userId ||
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

const isEnlargeScreenStream = computed(
  () => enlargeStream.value?.streamType === TUIVideoStreamType.kScreenStream
);

const { isSameStream, getStreamKey } = useStreamContainerHooks();
watch(
  () => streamList.value.map((stream: StreamInfo) => getStreamKey(stream)),
  (val, oldVal) => {
    if (fixedStream.value) {
      const fixedStreamKey = getStreamKey(fixedStream.value);
      if (!val.includes(fixedStreamKey) && oldVal.includes(fixedStreamKey)) {
        fixedStream.value = null;
      }
    }
  }
);

watch(remoteScreenStream, (val, oldVal) => {
  if (val?.hasVideoStream && !oldVal?.hasVideoStream) {
    fixedStream.value = null;
    swiperActiveIndex.value = 0;
  }
});

const floatStreamStyle = ref({ width: '0', height: '0 ' });
const floatStream = computed(() => {
  if (isSameStream(enlargeStream.value, fixedStream.value)) {
    if (
      remoteScreenStream.value &&
      !isSameStream(fixedStream.value, remoteScreenStream.value)
    ) {
      return remoteScreenStream.value;
    }
    if (
      localStream.value &&
      !isSameStream(fixedStream.value, localStream.value)
    ) {
      return localStream.value;
    }
  }
  if (isSameStream(enlargeStream.value, remoteScreenStream.value)) {
    if (currentSpeakerInfo.value.speakerUserId) {
      const currentSpeakerCameraInfo =
        streamInfoObj.value[
          `${currentSpeakerInfo.value.speakerUserId}_${TUIVideoStreamType.kCameraStream}`
        ];
      return currentSpeakerCameraInfo;
    }
    return localStream.value;
  }
  if (isSameStream(enlargeStream.value, localStream.value)) {
    if (remoteScreenStream.value) {
      return remoteScreenStream.value;
    }
    if (currentSpeakerInfo.value.remoteSpeakerUserId) {
      const currentSpeakerCameraInfo =
        streamInfoObj.value[
          `${currentSpeakerInfo.value.remoteSpeakerUserId}_${TUIVideoStreamType.kCameraStream}`
        ];
      return currentSpeakerCameraInfo;
    }
    if (streamList.value.length >= 2) {
      return streamList.value.find(
        item => !isSameStream(item, enlargeStream.value)
      );
    }
    return null;
  }
  return localStream.value;
});

const streamContainerRef = ref();
onMounted(() => {
  const containerWidth = streamContainerRef.value?.offsetWidth / 2;
  floatStreamStyle.value.width = `${containerWidth}px`;
  floatStreamStyle.value.height = `${containerWidth}px`;
});

/**
 * Double-click to switch the stream to the zoom in section
 **/
function handleStreamViewDblclick(stream: StreamInfo) {
  swiperActiveIndex.value = 0;
  fixedStream.value = stream;
}
</script>

<style lang="scss">
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

.float-stream {
  position: absolute;
  top: 0;
  right: 0;

  &.show-room-tool {
    top: 64px;
  }
}
</style>
