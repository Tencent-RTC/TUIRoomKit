<template>
  <div v-if="visible" class="whiteboard-view">
    <div ref="viewRef" class="whiteboard-view-canvas" />
    <div v-if="showLoading" class="whiteboard-view-loading">
      <TUILoading size="lg" :tip="t('Whiteboard.Loading')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  DeviceStatus,
  VideoStreamType,
  useDeviceState,
  useLoginState,
} from 'tuikit-atomicx-vue3/room';
import { TUILoading, t } from '../../../base';
import { useWhiteboardState, useWhiteboardViewBinding } from '../WhiteboardState';
import '../Whiteboard.global.scss';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const props = defineProps<{
  participant: RoomParticipant;
  streamType: VideoStreamType;
}>();

const { loginUserInfo } = useLoginState();
const { screenStatus } = useDeviceState();
const { isWhiteboardOn } = useWhiteboardState();
const { isOpening, isLoading, bindView } = useWhiteboardViewBinding();

/**
 * The local board shows up as the local share tile (the state marks the local
 * share on while it runs); the canvas element is the view it draws into.
 * The tile is already up while the SDK start is in flight.
 */
const visible = computed(() => (isWhiteboardOn.value || isOpening.value)
  && screenStatus.value === DeviceStatus.Off
  && props.streamType === VideoStreamType.Screen
  && props.participant.userId === loginUserInfo.value?.userId);

const showLoading = computed(() => visible.value && isLoading.value);

const viewRef = ref<HTMLElement | null>(null);

watch([viewRef, isWhiteboardOn], ([view, on]) => {
  if (!view || !on) {
    return;
  }
  bindView(view).catch((error: unknown) => {
    console.warn('[WhiteboardView] attach view failed:', error);
  });
});
</script>

<style scoped lang="scss">
/* The plugin anchors its layers to the canvas and pins that element's width / height to
   the canvas ratio; margin: auto keeps the box centered in the tile. z-index plus
   isolation keep those layers inside the tile, under the caption floating on the stage.
   Remote viewers get the board as a screen share, letterboxed black by the video, so the
   margins left by the canvas ratio are black here too.
   overflow is clip, not hidden: a hidden box is still a scroll container, so the caret of a
   long text line scrolls it and shifts the whole board out of place. */
.whiteboard-view {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: clip;
  background: #000;
  isolation: isolate;
  border-radius: inherit;
}

.whiteboard-view-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  margin: auto;
  overflow: clip;
  isolation: isolate;
}

.whiteboard-view-loading {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--room-view-tile-bg, var(--rk-bg-surface));
}
</style>
