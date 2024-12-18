<template>
  <div
    ref="playRegionDomRef"
    :id="playRegionDomId"
    class="stream-play-container"
  ></div>
</template>

<script setup lang="ts">
import {
  ref,
  defineProps,
  computed,
  onMounted,
  watch,
  onBeforeUnmount,
  withDefaults,
  nextTick,
} from 'vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { StreamInfo, useRoomStore } from '../../../../stores/room';
import { roomService } from '../../../../services/roomService';
import {
  StreamPlayMode,
  StreamPlayQuality,
} from '../../../../services/manager/mediaManager';
import { useBasicStore } from '../../../../stores/basic';
import { storeToRefs } from 'pinia';
import { getNanoId } from '../../../../utils/utils';

const mediaManager = roomService.getMediaManager();
const basicStore = useBasicStore();
const roomStore = useRoomStore();

const { defaultStreamType, streamInfoObj } = storeToRefs(roomStore);

interface Props {
  streamInfo: StreamInfo;
  streamPlayQuality?: StreamPlayQuality;
  streamPlayMode?: StreamPlayMode;
}
const props = withDefaults(defineProps<Props>(), {
  streamPlayQuality: StreamPlayQuality.Default,
  streamPlayMode: StreamPlayMode.PLAY,
});

const playRegionDomRef = ref();
const nanoId = getNanoId(5);
const playRegionDomId = computed(
  () => `${props.streamInfo.userId}_${props.streamInfo.streamType}_${nanoId}`
);
const isNeedPlayStream = computed(
  () =>
    props.streamPlayMode !== StreamPlayMode.STOP &&
    props.streamInfo.hasVideoStream
);

// The stream type to be pulled from the remote user
const streamTypeToFetch = computed(() => {
  const { streamType, userId } = props.streamInfo;
  const { userId: localUserId } = basicStore;
  if (streamType === TUIVideoStreamType.kScreenStream) {
    return TUIVideoStreamType.kScreenStream;
  }
  if (
    props.streamPlayQuality === StreamPlayQuality.HIGH ||
    userId === localUserId
  ) {
    return TUIVideoStreamType.kCameraStream;
  }
  if (props.streamPlayQuality === StreamPlayQuality.LOW) {
    return TUIVideoStreamType.kCameraStreamLow;
  }
  return defaultStreamType.value;
});

async function startPlayVideo() {
  if (
    !streamInfoObj.value[
      `${props.streamInfo.userId}_${props.streamInfo.streamType}`
    ] ||
    !playRegionDomRef.value
  ) {
    return;
  }
  await nextTick();
  if (isNeedPlayStream.value) {
    await mediaManager.startPlayVideo({
      userId: props.streamInfo.userId,
      streamType: streamTypeToFetch.value,
      view: playRegionDomRef.value,
      observerViewInVisible:
        props.streamPlayMode === StreamPlayMode.PLAY_IN_VISIBLE,
    });
  }
}

async function stopPlayVideo() {
  await mediaManager.stopPlayVideo({
    userId: props.streamInfo.userId,
    streamType: streamTypeToFetch.value,
    view: playRegionDomRef.value,
  });
}

watch(
  () => [
    props.streamInfo.userId,
    props.streamInfo.streamType,
    isNeedPlayStream.value,
  ],
  async (val, oldVal) => {
    const [oldUserId, oldStreamType] = oldVal;
    if (
      oldUserId !== props.streamInfo.userId ||
      oldStreamType !== props.streamInfo.streamType
    ) {
      // Stops play of the previous stream of the current dom
      mediaManager.stopPlayVideo({
        userId: oldUserId as string,
        streamType: oldStreamType as TUIVideoStreamType,
        view: playRegionDomRef.value,
      });
    }
    if (isNeedPlayStream.value) {
      await startPlayVideo();
    } else {
      await stopPlayVideo();
    }
  }
);

watch(
  () => streamTypeToFetch,
  async () => {
    if (isNeedPlayStream.value) {
      await startPlayVideo();
    }
  }
);

onMounted(async () => {
  if (isNeedPlayStream.value) {
    await startPlayVideo();
  }
});

onBeforeUnmount(async () => {
  if (isNeedPlayStream.value) {
    await stopPlayVideo();
  }
});
</script>

<style lang="scss" scoped>
.stream-play-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
