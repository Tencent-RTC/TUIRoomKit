<template>
  <div v-if="visible" class="whiteboard-view">
    <div ref="viewRef" class="whiteboard-view-canvas" />
    <div v-if="showLoading" class="whiteboard-view-loading">
      <TUILoading size="lg" :tip="t('Whiteboard.Loading')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  DeviceStatus,
  VideoStreamType,
  WhiteboardStatus,
  useDeviceState,
  useLoginState,
} from 'tuikit-atomicx-vue3/room';
import { TUILoading, t } from '../../../base';
import { useWhiteboardState, useWhiteboardViewBinding } from '../WhiteboardState';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const props = defineProps<{
  participant: RoomParticipant;
  streamType: VideoStreamType;
}>();

const { loginUserInfo } = useLoginState();
const { screenStatus } = useDeviceState();
const { whiteboardStatus, isWhiteboardOn } = useWhiteboardState();
const { isOpening, isLoading, bindView, applyToolbar } = useWhiteboardViewBinding();

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

let roleObserver: MutationObserver | null = null;
let bindGeneration = 0;

function tileWantsToolbar(view: HTMLElement): boolean {
  return view.closest('[data-tile-role]')?.getAttribute('data-tile-role') !== 'thumb';
}

function applyTileToolbar(view: HTMLElement): Promise<void> {
  return applyToolbar(view, tileWantsToolbar(view));
}

function observeTileRole(view: HTMLElement): void {
  roleObserver?.disconnect();
  roleObserver = null;
  const tile = view.closest('[data-tile-role]');
  if (!tile) {
    return;
  }
  roleObserver = new MutationObserver(() => {
    if (whiteboardStatus.value !== WhiteboardStatus.On) {
      return;
    }
    void applyTileToolbar(view);
  });
  roleObserver.observe(tile, { attributes: true, attributeFilter: ['data-tile-role'] });
}

watch([viewRef, whiteboardStatus], ([view, status]) => {
  if (!view || status !== WhiteboardStatus.On) {
    return;
  }
  const generation = ++bindGeneration;
  observeTileRole(view);
  void (async () => {
    try {
      await bindView(view);
      if (generation !== bindGeneration) {
        return;
      }
      await nextTick();
      if (generation !== bindGeneration || !view.isConnected) {
        return;
      }
      await applyTileToolbar(view);
    } catch (error: unknown) {
      console.warn('[WhiteboardView] attach view failed:', error);
    }
  })();
});

onBeforeUnmount(() => {
  roleObserver?.disconnect();
  roleObserver = null;
});
</script>

<style scoped lang="scss">
/* The plugin anchors its layers to the canvas and pins that element's width / height to
   the canvas ratio; margin: auto keeps the box centered in the tile. z-index plus
   isolation keep those layers inside the tile, under the caption floating on the stage. */
.whiteboard-view {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  isolation: isolate;
  border-radius: inherit;
}

.whiteboard-view-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  margin: auto;
  overflow: hidden;
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

/* The plugin draws from pointer events on its own root, so the tile overlay above it
   lets them through and keeps only its more chip clickable. */
:global(:has(> .whiteboard-view) > .participant-view-overlay) {
  pointer-events: none;
}

:global(:has(> .whiteboard-view) > .participant-view-overlay .participant-view-overlay-more) {
  pointer-events: auto;
}
</style>
