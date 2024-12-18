<template>
  <div class="stream-region-container" ref="streamRegionContainerRef">
    <div
      class="stream-region"
      @stream-view-dblclick="handleStreamDblClick"
      v-dbl-touch="handleStreamDblClick"
      :style="streamStyle"
    >
      <LocalScreenView v-if="isLocalScreen" :streamInfo="streamInfo" />
      <template v-else>
        <StreamPlay
          v-touch-scale="props.supportTouchScale"
          :streamInfo="streamInfo"
          :stream-play-mode="streamPlayMode"
          :stream-play-quality="streamPlayQuality"
        />
        <StreamCover :streamInfo="streamInfo" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  defineProps,
  computed,
  defineEmits,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import type { ComputedRef } from 'vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import StreamPlay from '../StreamPlay/index.vue';
import StreamCover from '../StreamCover/index.vue';
import LocalScreenView from '../LocalScreenView/index.vue';
import { StreamInfo } from '../../../../stores/room';
import { useBasicStore } from '../../../../stores/basic';
import vDblTouch from '../../../../directives/vDblTouch';
import vTouchScale from '../../../../directives/vTouchScale';
import {
  StreamPlayMode,
  StreamPlayQuality,
} from '../../../../services/manager/mediaManager';
import { getContentSize } from '../../../../utils/domOperation';

interface Props {
  streamInfo: StreamInfo;
  streamPlayQuality?: StreamPlayQuality;
  streamPlayMode?: StreamPlayMode;
  aspectRatio?: string;
  supportTouchScale?: boolean;
}

const props = defineProps<Props>();
const emits = defineEmits(['stream-view-dblclick']);

const basicStore = useBasicStore();

const isLocalScreen = computed(
  () =>
    props.streamInfo &&
    props.streamInfo.userId === basicStore.userId &&
    props.streamInfo.streamType === TUIVideoStreamType.kScreenStream
);

const streamRegionContainerRef = ref();
const streamStyle = ref({ width: '', height: '' });

const widthRatio: ComputedRef<number> = computed(() => {
  if (!props.aspectRatio || props.aspectRatio.indexOf(':') < 0) {
    return 0;
  }
  return Number(props.aspectRatio.split(':')[0]);
});
const heightRatio: ComputedRef<number> = computed(() => {
  if (!props.aspectRatio || props.aspectRatio.indexOf(':') < 0) {
    return 0;
  }
  return Number(props.aspectRatio.split(':')[1]);
});

function handleStreamRegionSize() {
  if (!streamRegionContainerRef.value) {
    return;
  }
  const containerWidth = getContentSize(streamRegionContainerRef.value).width;
  const containerHeight = getContentSize(streamRegionContainerRef.value).height;
  let width = containerWidth;
  let height = containerHeight;
  if (widthRatio.value && heightRatio.value) {
    const scaleWidth = containerWidth / widthRatio.value;
    const scaleHeight = containerHeight / heightRatio.value;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / heightRatio.value) * widthRatio.value;
      height = containerHeight;
    }
    if (scaleWidth <= scaleHeight) {
      width = containerWidth;
      height = (containerWidth / widthRatio.value) * heightRatio.value;
    }
  }
  streamStyle.value.width = `${width}px`;
  streamStyle.value.height = `${height}px`;
}

function handleStreamDblClick() {
  emits('stream-view-dblclick', props.streamInfo);
}

const ro = new ResizeObserver(() => {
  handleStreamRegionSize();
});

onMounted(() => {
  ro.observe(streamRegionContainerRef.value as Element);
});

onBeforeUnmount(() => {
  ro.unobserve(streamRegionContainerRef.value as Element);
});
</script>

<style lang="scss" scoped>
.stream-region-container {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .stream-region {
    position: relative;
    overflow: hidden;
    background-color: #000;
    border-radius: 12px;
  }
}
</style>
