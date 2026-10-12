<template>
  <div class="grid-layout">
    <div
      ref="streamListContainerRef"
      class="grid-layout-body"
    >
      <div
        class="grid-layout-content"
        :style="streamListContentStyle"
      >
        <RoomParticipantView
          v-for="streamInfo in currentPageStreamInfoList"
          :key="`${streamInfo.participant.userId}_${streamInfo.streamType}`"
          class="grid-layout-tile"
          :style="streamItemStyle"
          :participant="streamInfo.participant"
          :stream-type="streamInfo.streamType"
          :fill-mode="FillMode.Fit"
          :lazy-load="streamInfo.streamType === VideoStreamType.Screen ? { enable: false } : undefined"
          @dblclick="emit('stream-double-click', streamInfo)"
        >
          <template #participantViewUI>
            <slot
              name="participantViewUI"
              :participant="streamInfo.participant"
              :stream-type="streamInfo.streamType"
            />
          </template>
        </RoomParticipantView>
      </div>

      <div v-if="showTurnPageControl" class="grid-layout-pager">
        <button
          class="grid-layout-page-btn"
          type="button"
          :aria-label="t('RoomView.PrevPage')"
          :disabled="!showTurnPageLeftArrow"
          @click="currentPageIndex -= 1"
        >
          <IconChevron class="grid-layout-page-icon is-prev" :size="14" />
        </button>
        <button
          class="grid-layout-page-btn"
          type="button"
          :aria-label="t('RoomView.NextPage')"
          :disabled="!showTurnPageRightArrow"
          @click="currentPageIndex += 1"
        >
          <IconChevron class="grid-layout-page-icon is-next" :size="14" />
        </button>
      </div>
    </div>
    <div v-if="showTurnPageControl" class="grid-layout-page-ind">
      {{ currentPageIndex + 1 }} / {{ totalPageNumber }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
} from 'tuikit-atomicx-vue3/room';
import { IconChevron } from '../../../base/icons';
import { t } from '../../../i18n';
import { useParticipantStreams } from './useParticipantStreams';
import { useStreamItemDimensions } from './useStreamItemDimensions';
import type { StreamInfo } from './useParticipantStreams';

const emit = defineEmits<{
  'stream-double-click': [streamInfo: StreamInfo];
}>();

const { participantStreamList } = useParticipantStreams();

const maxColumn = 3;
const maxRow = 3;
const currentPageIndex = ref(0);
const maxCountEveryPage = maxColumn * maxRow;
const gap = 8;

const gridStreamInfoList = participantStreamList;

const totalPageNumber = computed(() =>
  Math.max(1, Math.ceil(gridStreamInfoList.value.length / maxCountEveryPage)),
);

const currentPageStreamInfoList = computed(() =>
  gridStreamInfoList.value.slice(
    currentPageIndex.value * maxCountEveryPage,
    (currentPageIndex.value + 1) * maxCountEveryPage,
  ),
);

const gridColumns = computed(() => {
  const count = Math.min(gridStreamInfoList.value.length, maxCountEveryPage);
  if (count <= 0) {
    return 1;
  }
  return Math.min(Math.ceil(Math.sqrt(count)), maxColumn);
});

const gridRows = computed(() => {
  const count = Math.min(gridStreamInfoList.value.length, maxCountEveryPage);
  if (count <= 0) {
    return 1;
  }
  return Math.min(Math.ceil(count / gridColumns.value), maxRow);
});

const streamListContainerRef = ref<HTMLElement | null>(null);
const { itemStyle: streamItemStyle } = useStreamItemDimensions({
  containerRef: streamListContainerRef,
  columns: gridColumns,
  rows: gridRows,
  itemCount: computed(() => currentPageStreamInfoList.value.length),
  gap,
  aspectRatio: 16 / 9,
  watchDependencies: [
    () => gridColumns.value,
    () => gridRows.value,
    () => currentPageStreamInfoList.value.length,
  ],
});

const streamListContentStyle = computed(() => {
  const { width, height } = streamItemStyle.value;
  if (!width || !height) {
    return {};
  }
  return {
    width: `${Math.ceil(parseInt(width, 10) * gridColumns.value + (gridColumns.value - 1) * gap)}px`,
    height: `${Math.ceil(parseInt(height, 10) * gridRows.value + (gridRows.value - 1) * gap)}px`,
  };
});

watch(
  () => gridStreamInfoList.value.length,
  (length) => {
    const lastPage = Math.max(0, Math.ceil(length / maxCountEveryPage) - 1);
    if (currentPageIndex.value > lastPage) {
      currentPageIndex.value = lastPage;
    }
  },
);

const showTurnPageControl = computed(() => totalPageNumber.value > 1);
const showTurnPageLeftArrow = computed(() => currentPageIndex.value > 0);
const showTurnPageRightArrow = computed(
  () => currentPageIndex.value < totalPageNumber.value - 1,
);
</script>

<style scoped lang="scss">
.grid-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 6px;
  overflow: visible;
}

.grid-layout-body {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.grid-layout-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  place-content: flex-start;
}

.grid-layout-tile {
  position: relative;
  flex: 0 0 auto;
  /* Name card must render intact; the video layer clips itself to this radius. */
  overflow: visible;
  border-radius: var(--rk-radius-lg);
}

/* Same reasoning as the speaker layout: the halo sits outside the tile box, so the
   layout draws it while the overlay keeps owning the state. The grid's 8px gaps give
   the glow room to bleed. */
.grid-layout-tile:has(.participant-view-overlay.is-speaking) {
  box-shadow:
    0 0 0 1.5px color-mix(in srgb, #34c759 60%, transparent),
    0 0 18px color-mix(in srgb, #34c759 18%, transparent);
}

.grid-layout-pager {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  pointer-events: none;
}

.grid-layout-page-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #fff;
  pointer-events: none;
  cursor: pointer;
  background: color-mix(in srgb, #000 42%, transparent);
  border: 0;
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.92);
  transition: opacity 0.16s ease, transform 0.16s ease, background 0.15s;
}

.grid-layout:hover .grid-layout-page-btn {
  pointer-events: auto;
  opacity: 1;
  transform: scale(1);
}

.grid-layout-page-btn:hover {
  background: color-mix(in srgb, #000 58%, transparent);
}

.grid-layout:hover .grid-layout-page-btn:disabled {
  pointer-events: none;
  cursor: default;
  opacity: 0.22;
}

.grid-layout-page-icon.is-prev {
  transform: rotate(90deg);
}

.grid-layout-page-icon.is-next {
  transform: rotate(-90deg);
}

/* Lives in the 20px stage gap under the tiles, not on the video. */
.grid-layout-page-ind {
  position: absolute;
  bottom: 0;
  left: 50%;
  z-index: 8;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: max-content;
  height: 20px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: #fff;
  letter-spacing: 0.04em;
  pointer-events: none;
  background: color-mix(in srgb, #000 42%, transparent);
  border-radius: 10px;
  opacity: 0;
  transform: translate(-50%, 100%);
  transition: opacity 0.16s ease;
}

.grid-layout:hover .grid-layout-page-ind {
  opacity: 1;
}
</style>
