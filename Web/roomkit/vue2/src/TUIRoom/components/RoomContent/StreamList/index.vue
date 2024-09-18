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
        v-for="streamInfo in streamInfoList"
        class="stream-list-item"
        :key="`${streamInfo.userId}_${streamInfo.streamType}`"
        @room-dblclick="$emit('room-dblclick', streamInfo)"
        :streamInfo="streamInfo"
        :style="streamStyle"
        :isNeedPlayStream="isNeedPlayStream"
        :observerViewInVisible="observerViewInVisible"
        :isEnlarge="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  withDefaults,
  defineProps,
  ref,
  watch,
  computed,
  onMounted,
  onBeforeUnmount,
  defineEmits,
} from 'vue';
import type { Ref, ComputedRef } from 'vue';
import StreamRegion from '../StreamRegion';
import { StreamInfo } from '../../../stores/room';
import { isPC } from '../../../utils/environment';

defineEmits(['room-dblclick']);

interface Props {
  streamInfoList: StreamInfo[];
  aspectRatio?: string;
  horizontalCount: number;
  verticalCount: number;
  isNeedPlayStream?: boolean;
  observerViewInVisible?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  isNeedPlayStream: true,
});

const streamListContainerRef = ref();
const streamListRef = ref();

const currentPageIndex = ref(0);
const maxCountEveryPage = computed(
  () => props.horizontalCount * props.verticalCount
);
const isGridLayout = computed(
  () => props.horizontalCount !== Infinity && props.verticalCount !== Infinity
);

watch(
  () => props.streamInfoList.length,
  (val, oldVal) => {
    if (oldVal === 0) {
      handleLayout();
    }
    if (
      isGridLayout.value &&
      currentPageIndex.value > Math.ceil(val / maxCountEveryPage.value) - 1
    ) {
      currentPageIndex.value = Math.ceil(val / maxCountEveryPage.value) - 1;
      handleEqualPointsLayout();
    }
  }
);

// Single video stream window margin size
const singleStreamMargin = isPC ? 8 : 4;

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
  // The number of stream windows on the current page
  const number =
    currentPageIndex.value > 0
      ? maxCountEveryPage.value
      : props.streamInfoList.slice(0, maxCountEveryPage.value).length;
  if (number <= 0 || !streamListContainerRef.value) {
    return;
  }
  const containerWidth = streamListContainerRef.value?.offsetWidth;
  const containerHeight = streamListContainerRef.value?.offsetHeight;
  // The actual width and height of the container is offsetWidth/offsetHeight minus the size of padding
  const horizontalStreamNumber = props.horizontalCount;
  const verticalStreamNumber = props.verticalCount;
  // Subtract the margin size of a single video stream to ensure that the ratio of width and height is 16:9
  const contentWidth =
    (containerWidth - horizontalStreamNumber * singleStreamMargin) /
    horizontalStreamNumber;
  const contentHeight =
    (containerHeight - verticalStreamNumber * singleStreamMargin) /
    verticalStreamNumber;

  let width = containerWidth;
  let height = containerWidth;
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

  streamListStyle.value.width = `${horizontalStreamNumber * (width + singleStreamMargin)}px`;
  streamListStyle.value.height = `${verticalStreamNumber * (height + singleStreamMargin)}px`;
}

// Handles an unlimited number of streams horizontally
function handleHorizontalInfinityLayout() {
  streamListStyle.value = {};
  const containerHeight = streamListRef.value!.offsetHeight;
  const contentHeight = containerHeight;
  const contentWidth = (containerHeight * 16) / 9;

  streamStyle.value.width = `${contentWidth}px`;
  streamStyle.value.height = `${contentHeight}px`;
}

// Handles an infinite number of streams in the vertical direction
function handleVerticalInfinityLayout() {
  streamListStyle.value = {};
  const containerWidth = streamListRef.value!.offsetWidth;
  const contentWidth = containerWidth;
  const contentHeight = (containerWidth * 9) / 16;

  streamStyle.value.width = `${contentWidth}px`;
  streamStyle.value.height = `${contentHeight}px`;
}

const isHorizontalInfinityLayout = computed(
  () => props.horizontalCount === Infinity
);
const isVerticalInfinityLayout = computed(
  () => props.verticalCount === Infinity
);
const isEqualPointsLayout = computed(
  () => props.horizontalCount !== Infinity && props.verticalCount !== Infinity
);

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

onMounted(() => {
  handleLayout();
});

watch(
  () => [
    props.horizontalCount,
    props.verticalCount,
    props.streamInfoList.length,
  ],
  () => {
    handleLayout();
  },
  { immediate: true }
);

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
