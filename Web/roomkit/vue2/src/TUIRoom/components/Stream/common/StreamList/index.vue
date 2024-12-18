<template>
  <div
    ref="streamListContainerRef"
    :class="{
      'horizontal-infinity-layout': isHorizontalInfinityLayout,
      'vertical-infinity-layout': isVerticalInfinityLayout,
      'equal-points-layout': isEqualPointsLayout,
    }"
  >
    <div
      class="stream-list"
      ref="streamListRef"
      :style="streamListStyle"
      @wheel="handleWheel"
    >
      <StreamRegion
        v-for="streamInfo in validStreamInfoList"
        class="stream-list-item"
        :key="`${streamInfo.userId}_${streamInfo.streamType}`"
        :streamInfo="streamInfo"
        :style="streamStyle"
        :streamPlayMode="streamPlayMode"
        :streamPlayQuality="streamPlayQuality"
        @stream-view-dblclick="handleStreamDblClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  defineProps,
  ref,
  watch,
  computed,
  onMounted,
  onBeforeUnmount,
  defineEmits,
  nextTick,
} from 'vue';
import type { Ref, ComputedRef } from 'vue';
import StreamRegion from '../StreamRegion';
import { StreamInfo } from '../../../../stores/room';
import { isPC } from '../../../../utils/environment';
import {
  StreamPlayMode,
  StreamPlayQuality,
} from '../../../../services/manager/mediaManager';
import { getContentSize } from '../../../../utils/domOperation';
import { isUndefined } from '../../../../utils/utils';

const emits = defineEmits(['stream-view-dblclick']);
const singleStreamMargin = isPC ? 8 : 4;

interface Props {
  streamInfoList?: StreamInfo[];
  column: number;
  row: number;
  fillMode?: 'fill' | 'contain';
  aspectRatio?: string;
  streamPlayQuality?: StreamPlayQuality;
  streamPlayMode?: StreamPlayMode;
}

const props = defineProps<Props>();
const streamListContainerRef = ref();
const streamListRef = ref();

const isEqualPointsLayout = computed(
  () => props.column !== Infinity && props.row !== Infinity
);
const isHorizontalInfinityLayout = computed(() => props.column === Infinity);
const isVerticalInfinityLayout = computed(() => props.row === Infinity);

watch(
  () => [props.column, props.row],
  async () => {
    await nextTick();
    handleLayout();
  },
  { immediate: true }
);

const validStreamInfoList = computed(() => {
  return props.streamInfoList?.filter(
    item => item && item.userId && !isUndefined(item.streamType)
  );
});

function handleLayout() {
  if (isHorizontalInfinityLayout.value) {
    handleHorizontalInfinityLayout();
    return;
  }
  if (isVerticalInfinityLayout.value) {
    handleVerticalInfinityLayout();
    return;
  }
  if (isEqualPointsLayout.value) {
    handleEqualPointsLayout();
    return;
  }
}

// Single video stream window margin size
const streamListStyle: Ref<Record<string, any>> = ref({
  width: '0',
  height: '0',
});
const streamStyle: Ref<Record<string, any>> = ref({
  width: '0',
  height: '0',
  '--stream-margin': `${singleStreamMargin / 2}px`,
});

const widthRatio: ComputedRef<number> = computed(() => {
  if (!props.aspectRatio || props.aspectRatio?.indexOf(':') < 0) {
    return 0;
  }
  return Number(props.aspectRatio?.split(':')[0]);
});
const heightRatio: ComputedRef<number> = computed(() => {
  if (!props.aspectRatio || props.aspectRatio.indexOf(':') < 0) {
    return 0;
  }
  return Number(props.aspectRatio.split(':')[1]);
});
/**
 * Handle nine-pattern layout
 **/
async function handleEqualPointsLayout() {
  if (!props.streamInfoList || !streamListContainerRef.value) {
    return;
  }
  const containerRect = streamListContainerRef.value.getBoundingClientRect();
  const containerWidth = Math.floor(containerRect.width);
  const containerHeight = Math.floor(containerRect.height);
  // Subtract the margin size of a single video stream to ensure that the ratio of width and height is 16:9
  const contentWidth =
    (containerWidth - props.column * singleStreamMargin) / props.column;
  const contentHeight =
    (containerHeight - props.row * singleStreamMargin) / props.row;

  let width = contentWidth;
  let height = contentHeight;
  if (widthRatio.value && heightRatio.value) {
    const scaleWidth = contentWidth / widthRatio.value;
    const scaleHeight = contentHeight / heightRatio.value;
    if (scaleWidth > scaleHeight) {
      width = (contentHeight / heightRatio.value) * widthRatio.value;
      height = contentHeight;
    }
    if (scaleWidth <= scaleHeight) {
      width = contentWidth;
      height = (contentWidth / widthRatio.value) * heightRatio.value;
    }
  }
  streamStyle.value.width = `${width}px`;
  streamStyle.value.height = `${height}px`;

  streamListStyle.value.width = `${props.column * (width + singleStreamMargin)}px`;
  streamListStyle.value.height = `${props.row * (height + singleStreamMargin)}px`;
}

// Handles an unlimited number of streams horizontally
function handleHorizontalInfinityLayout() {
  streamListStyle.value = {};

  const contentHeight = getContentSize(streamListContainerRef.value).height;
  const contentWidth = (contentHeight * widthRatio.value) / heightRatio.value;
  streamStyle.value.width = `${contentWidth}px`;
  streamStyle.value.height = `${contentHeight}px`;
}

// Handles an infinite number of streams in the vertical direction
function handleVerticalInfinityLayout() {
  streamListStyle.value = {};

  const contentWidth = getContentSize(streamListContainerRef.value).width;
  const contentHeight = (contentWidth * heightRatio.value) / widthRatio.value;
  streamStyle.value.width = `${contentWidth}px`;
  streamStyle.value.height = `${contentHeight}px`;
}

function handleStreamDblClick(streamInfo: StreamInfo) {
  emits('stream-view-dblclick', streamInfo);
}

const resizeObserver = new ResizeObserver(() => {
  handleLayout();
});

onMounted(() => {
  resizeObserver.observe(streamListContainerRef.value);
});

onBeforeUnmount(() => {
  resizeObserver.unobserve(streamListContainerRef.value);
});

// Handle top layout horizontal sliding
function handleWheel(event: WheelEvent) {
  streamListContainerRef.value.scrollLeft += event.deltaY;
}
</script>

<style lang="scss" scoped>
.equal-points-layout {
  display: flex;
  place-content: center center;
  align-items: center;
  width: 100%;
  height: 100%;

  .stream-list {
    display: flex;
    flex-wrap: wrap;
    place-content: flex-start flex-start;

    .stream-list-item {
      margin: var(--stream-margin);
    }
  }
}

.horizontal-infinity-layout {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;

  .stream-list {
    display: flex;
    max-width: 100%;
    max-height: 100%;
    overflow-x: scroll;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .stream-list-item {
    &:not(:first-child) {
      margin-left: 14px;
    }
  }
}

.vertical-infinity-layout {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;

  .stream-list {
    max-width: 100%;
    max-height: 100%;
    padding: 10px 0;
    overflow-y: scroll;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .stream-list-item {
    &:not(:first-child) {
      margin-top: 14px;
    }
  }
}
</style>
