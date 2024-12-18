<template>
  <div ref="multiStreamViewRef" class="multi-stream-view">
    <stream-list
      v-if="!isEqualPointsLayout || totalPageNumber === 1"
      :streamInfoList="renderStreamInfoList"
      :column="column"
      :row="row"
      :streamPlayMode="streamPlayMode || StreamPlayMode.PLAY_IN_VISIBLE"
      :streamPlayQuality="StreamPlayQuality.Default"
      :aspect-ratio="aspectRatio"
      @stream-view-dblclick="handleStreamViewDblclick"
    />
    <TuiSwiper
      v-if="isEqualPointsLayout && totalPageNumber > 1"
      :activeIndex="currentPageIndex"
      :show-page-dots="totalPageNumber > 1"
      @change="handleActiveIndexChange"
    >
      <TuiSwiperItem v-for="(item, index) in totalPageNumber" :key="index">
        <stream-list
          :streamInfoList="equalPointsLayoutStreamList[index]"
          :column="column"
          :row="row"
          :streamPlayMode="getStreamPlayMode(index)"
          :streamPlayQuality="StreamPlayQuality.Default"
          :aspect-ratio="aspectRatio"
          @stream-view-dblclick="handleStreamViewDblclick"
        />
      </TuiSwiperItem>
    </TuiSwiper>
  </div>
</template>
<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue';
import type { ComputedRef } from 'vue';
import TuiSwiper from '../../common/base/Swiper.vue';
import TuiSwiperItem from '../../common/base/SwiperItem.vue';
import StreamList from '../common/StreamList/index.vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useMultiStreamViewHook from './useMultiStreamViewHook';
import {
  StreamPlayMode,
  StreamPlayQuality,
} from '../../../services/manager/mediaManager';

const props = defineProps<{
  maxColumn: number;
  maxRow: number;
  fillMode?: 'fill' | 'contain';
  streamInfoList?: { userId: string; streamType: TUIVideoStreamType }[];
  excludeStreamInfoList?: { userId: string; streamType: TUIVideoStreamType }[];
  streamPlayMode?: StreamPlayMode;
}>();

const emits = defineEmits(['stream-view-dblclick']);
const {
  column,
  row,
  isEqualPointsLayout,
  streamList,
  renderStreamInfoList,
  equalPointsLayoutStreamList,
  totalPageNumber,
  currentPageIndex,
} = useMultiStreamViewHook(props);

const multiStreamViewRef = ref();
function handleActiveIndexChange(index: number) {
  currentPageIndex.value = index;
}

function handleStreamViewDblclick(streamInfo: TUIVideoStreamType) {
  emits('stream-view-dblclick', streamInfo);
}

function getStreamPlayMode(index: number) {
  return Math.abs(index - currentPageIndex.value) <= 1
    ? StreamPlayMode.PLAY
    : StreamPlayMode.STOP;
}

const aspectRatio: ComputedRef<string> = computed(() => {
  if (isEqualPointsLayout.value) {
    return renderStreamInfoList.value.length > 1 ? '1:1' : 'auto';
  }
  return '16:9';
});
</script>

<style lang="scss" scoped>
.multi-stream-view {
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
</style>
