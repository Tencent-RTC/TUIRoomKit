<template>
  <div id="streamContainer" :class="streamContainerClass">
    <single-stream-view
      v-if="enlargeStream"
      class="enlarged-stream-container"
      :streamInfo="enlargeStream"
    />
    <multi-stream-view
      :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]"
      :maxColumn="maxColumn"
      :maxRow="maxRow"
      :excludeStreamInfoList="excludeStreamInfoList"
      @stream-view-dblclick="handleStreamViewDblclick"
    />
    <arrow-stroke
      v-if="isSideListLayout && (showRoomTool || showSideList)"
      :class="[`arrow-stroke-${arrowDirection}`]"
      :stroke-position="strokePosition"
      :arrow-direction="arrowDirection"
      :has-stroke="showSideList"
      @click-arrow="handleClickIcon"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import { LAYOUT } from '../../../constants/render';
import SingleStreamView from '../../Stream/SingleStreamView/index.vue';
import MultiStreamView from '../../Stream/MultiStreamView';
import ArrowStroke from '../../common/ArrowStroke.vue';
import useStreamContainerHooks from './useStreamContainerHooks';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';

const roomStore = useRoomStore();
const {
  localStream,
  streamList,
  remoteStreamList,
  localScreenStream,
  remoteScreenStream,
} = storeToRefs(roomStore);
const basicStore = useBasicStore();
const { showRoomTool, layout } = storeToRefs(basicStore);

const { getStreamKey } = useStreamContainerHooks();

const maxColumn = ref();
const maxRow = ref();
const excludeStreamInfoList = computed(() => {
  if (enlargeStream.value?.streamType === TUIVideoStreamType.kScreenStream) {
    return [enlargeStream.value];
  }
  return [];
});

const isSideListLayout = computed(
  () =>
    [LAYOUT.RIGHT_SIDE_LIST, LAYOUT.TOP_SIDE_LIST].indexOf(layout.value) >= 0
);

const fixedStream: Ref<StreamInfo | null> = ref(null);
const enlargeStream = computed(() => {
  if (!isSideListLayout.value) {
    return null;
  }
  if (fixedStream.value) {
    return fixedStream.value;
  }
  if (localScreenStream.value) {
    return localScreenStream.value;
  }
  if (remoteScreenStream.value) {
    return remoteScreenStream.value;
  }
  if (remoteStreamList.value.length > 0) {
    return remoteStreamList.value[0];
  }
  return localStream.value;
});

watch(
  () => streamList.value.length,
  val => {
    if (val === 1 && isSideListLayout.value) {
      basicStore.setLayout(LAYOUT.NINE_EQUAL_POINTS);
    }
  }
);

watch(
  () =>
    localScreenStream.value?.hasVideoStream ||
    remoteScreenStream.value?.hasVideoStream,
  (val, oldVal) => {
    if (val && !oldVal) {
      fixedStream.value = null;
      if (!isSideListLayout.value) {
        basicStore.setLayout(LAYOUT.RIGHT_SIDE_LIST);
      }
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
  }
);

/**
 * Double-click to switch the stream to the zoom in section
 **/
function handleStreamViewDblclick(stream: StreamInfo) {
  if (!isSideListLayout.value && streamList.value.length > 1) {
    basicStore.setLayout(LAYOUT.RIGHT_SIDE_LIST);
  }
  fixedStream.value = stream;
}

/**
 * ----- The following processing stream layout ---------
 **/
const streamContainerClass = ref('stream-container-flatten');
async function handleLayout() {
  switch (layout.value as any) {
    case LAYOUT.NINE_EQUAL_POINTS:
      streamContainerClass.value = 'stream-container-flatten';
      maxColumn.value = 3;
      maxRow.value = 3;
      break;
    case LAYOUT.RIGHT_SIDE_LIST:
      streamContainerClass.value = 'stream-container-right';
      maxColumn.value = 1;
      maxRow.value = Infinity;
      break;
    case LAYOUT.TOP_SIDE_LIST:
      streamContainerClass.value = 'stream-container-top';
      maxColumn.value = Infinity;
      maxRow.value = 1;
      break;
    default:
      break;
  }
}

watch(
  layout,
  () => {
    handleLayout();
  },
  { immediate: true }
);

const showSideList = ref(true);
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
</style>
