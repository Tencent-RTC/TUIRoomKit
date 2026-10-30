<template>
  <div class="room-view-mobile">
    <GridLayoutMobile :share-locked="shareLocked" :pip-participant="pipParticipant">
      <template #participantViewUI="slotProps">
        <template v-if="!hideOverlay">
          <ParticipantViewOverlayMobile
            v-if="slotProps.streamType !== VideoStreamType.Screen"
            :participant="slotProps.participant"
            :stream-type="slotProps.streamType"
            :in-pip="slotProps.inPip"
            :flip-pending="isPending"
            @flip-camera="handleFlipCamera"
          />
        </template>
        <slot name="participantViewUI" v-bind="slotProps" />
      </template>
    </GridLayoutMobile>
  </div>
</template>

<script setup lang="ts">
/* The phone stage is always the 9:16 gallery. It takes no layout template: the
   speaker and cinema layouts are desktop-only, and a share gets a page of its own
   inside the gallery instead of switching layouts. Who the share page's corner
   window follows is the host's call, passed in as `pipParticipant`. */
import { ref } from 'vue';
import { MirrorType, VideoStreamType, useDeviceState } from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import ParticipantViewOverlayMobile from '../ParticipantViewOverlayMobile/ParticipantViewOverlayMobile.vue';
import GridLayoutMobile from './GridLayoutMobile.vue';

defineProps<{
  /** Drops the built-in overlay so a host-supplied participantViewUI replaces it. */
  hideOverlay?: boolean;
  /** Drawing on the share owns its touches: no zoom, no page swipe. */
  shareLocked?: boolean;
  /** Whose camera the share page's corner window shows; no window when omitted. */
  pipParticipant?: RoomParticipant | null;
}>();

const { isFrontCamera, switchCamera, localMirrorType, switchMirror } = useDeviceState();

/* Same rule as SwitchCameraButton: the back camera never mirrors, and the front
   camera's setting comes back on the return trip. Held here rather than on the tile,
   because paging remounts the tile and would drop it. */
let frontCameraMirror = isFrontCamera.value ? localMirrorType.value : MirrorType.Auto;

/* isFrontCamera only updates once switchCamera resolves, so overlapping flips would
   all aim the same way and save the back camera's Disable as the front setting.
   A flip that never settles frees the button after FLIP_TIMEOUT_MS; once a newer
   flip has started, the stale one neither applies its mirror nor clears the lock. */
const FLIP_TIMEOUT_MS = 5000;
const isPending = ref(false);
let flipId = 0;

async function handleFlipCamera() {
  if (isPending.value) {
    return;
  }
  const id = ++flipId;
  isPending.value = true;
  const timer = setTimeout(() => {
    if (id === flipId) {
      isPending.value = false;
    }
  }, FLIP_TIMEOUT_MS);
  try {
    const toFront = !isFrontCamera.value;
    if (!toFront) {
      frontCameraMirror = localMirrorType.value;
    }
    await switchCamera({ isFrontCamera: toFront });
    if (id !== flipId) {
      return;
    }
    await switchMirror({ mirror: toFront ? frontCameraMirror : MirrorType.Disable });
  } finally {
    clearTimeout(timer);
    if (id === flipId) {
      isPending.value = false;
    }
  }
}
</script>

<style scoped lang="scss">
.room-view-mobile {
  /* Tile fill before the first frame lands; the gallery's tiles read it. */
  --room-view-tile-bg: color-mix(in srgb, var(--rk-brand) 1.6%, #f8f7f9);

  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

.rk-root[data-rk-theme='dark'] .room-view-mobile {
  --room-view-tile-bg: color-mix(in srgb, var(--rk-brand) 2%, #141414);
}
</style>
