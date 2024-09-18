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
import { useBasicStore } from '../../../../stores/basic';
import { storeToRefs } from 'pinia';
import { getNanoId } from '../../../../utils/utils';

const mediaManager = roomService.getMediaManager();
const basicStore = useBasicStore();
const roomStore = useRoomStore();

const { defaultStreamType, streamInfoObj } = storeToRefs(roomStore);

interface Props {
  streamInfo: StreamInfo;
  isEnlarge: boolean;
  isNeedPlayStream?: boolean;
  observerViewInVisible?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  isNeedPlayStream: true,
});

const playRegionDomRef = ref();
const nanoId = getNanoId(5);
const playRegionDomId = computed(
  () => `${props.streamInfo.userId}_${props.streamInfo.streamType}_${nanoId}`
);

// The stream type to be pulled from the remote user
const streamTypeToFetch = computed(() => {
  const { streamType, userId } = props.streamInfo;
  const { userId: localUserId } = basicStore;
  if (streamType === TUIVideoStreamType.kScreenStream) {
    return TUIVideoStreamType.kScreenStream;
  }
  if (props.isEnlarge || userId === localUserId) {
    return TUIVideoStreamType.kCameraStream;
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
  if (props.isNeedPlayStream && props.streamInfo.hasVideoStream) {
    await mediaManager.startPlayVideo({
      userId: props.streamInfo.userId,
      streamType: streamTypeToFetch.value,
      view: playRegionDomRef.value,
      observerViewInVisible: props.observerViewInVisible,
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
    props.streamInfo.hasVideoStream,
    props.isNeedPlayStream,
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
    if (props.isNeedPlayStream && props.streamInfo.hasVideoStream) {
      await startPlayVideo();
    } else {
      await stopPlayVideo();
    }
  }
);

watch(
  () => streamTypeToFetch,
  async () => {
    if (props.isNeedPlayStream && props.streamInfo.hasVideoStream) {
      await startPlayVideo();
    }
  }
);

onMounted(async () => {
  if (props.isNeedPlayStream && props.streamInfo.hasVideoStream) {
    await startPlayVideo();
  }
});

onBeforeUnmount(async () => {
  if (props.isNeedPlayStream && props.streamInfo.hasVideoStream) {
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
