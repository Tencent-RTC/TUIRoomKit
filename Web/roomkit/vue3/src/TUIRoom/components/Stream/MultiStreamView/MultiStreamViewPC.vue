<template>
  <div id="streamContainer">
    <stream-list
      :streamInfoList="streamInfoList"
      :column="column"
      :row="row"
      :streamPlayMode="StreamPlayMode.PLAY_IN_VISIBLE"
      :streamPlayQuality="StreamPlayQuality.Default"
      aspect-ratio="16:9"
      @stream-view-dblclick="handleStreamDblclick"
    />
    <!-- Nine-pane left and right page flip control bar -->
    <div v-if="showTurnPageControl && showRoomTool" class="turn-page-container">
      <div
        v-show="showTurnPageLeftArrow"
        class="turn-page-arrow-container left-container"
        @click="handleTurnPageLeft"
      >
        <IconArrowStrokeTurnPage size="20" />
      </div>
      <div
        v-show="showTurnPageRightArrow"
        class="turn-page-arrow-container right-container"
        @click="handleTurnPageRight"
      >
        <IconArrowStrokeTurnPage class="turn-page-right" size="20" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue';
import { IconArrowStrokeTurnPage } from '@tencentcloud/uikit-base-component-vue3';
import StreamList from '../common/StreamList/index.vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import {
  StreamPlayMode,
  StreamPlayQuality,
} from '../../../services/manager/mediaManager';
import useMultiStreamViewHook from './useMultiStreamViewHook';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../../stores/basic';
import { StreamInfo } from '../../../stores/room';

const props = defineProps<{
  maxColumn: number;
  maxRow: number;
  fillMode?: 'fill' | 'contain';
  excludeStreamInfoList?: { userId: string; streamType: TUIVideoStreamType }[];
}>();

const {
  column,
  row,
  totalPageNumber,
  isEqualPointsLayout,
  renderStreamInfoList,
  equalPointsLayoutStreamList,
  currentPageIndex,
} = useMultiStreamViewHook(props);

const basicStore = useBasicStore();
const { showRoomTool } = storeToRefs(basicStore);

const streamInfoList = computed(() => {
  if (isEqualPointsLayout.value) {
    return equalPointsLayoutStreamList.value[currentPageIndex.value];
  }
  return renderStreamInfoList.value;
});

const emits = defineEmits(['stream-view-dblclick']);

function handleStreamDblclick(streamInfo: StreamInfo) {
  emits('stream-view-dblclick', streamInfo);
}

const showTurnPageControl = computed(
  () => isEqualPointsLayout.value && totalPageNumber.value > 1
);
const showTurnPageLeftArrow = computed(
  () => isEqualPointsLayout.value && currentPageIndex.value > 0
);
const showTurnPageRightArrow = computed(
  () =>
    isEqualPointsLayout.value &&
    currentPageIndex.value < totalPageNumber.value - 1
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
</script>

<style lang="scss" scoped>
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
    color: var(--uikit-color-white-1);
    cursor: pointer;
    border-radius: 32px;
    background-color: var(--bg-color-tag-mask);

    &:hover {
      background-color: var(--button-color-secondary-hover);
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
