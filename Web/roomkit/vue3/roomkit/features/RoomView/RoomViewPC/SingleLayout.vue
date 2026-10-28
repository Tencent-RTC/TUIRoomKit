<template>
  <div class="single-layout">
    <div v-if="stream" class="single-layout-stream">
      <RoomParticipantView
        class="single-layout-video"
        :class="{ 'is-hidden': isCameraOff(stream), 'is-screen': stream.streamType === VideoStreamType.Screen }"
        :participant="stream.participant"
        :stream-type="stream.streamType"
        :fill-mode="stream.streamType === VideoStreamType.Screen ? FillMode.Fit : FillMode.Fill"
        :lazy-load="{ enable: false }"
      />
      <slot
        name="participantViewUI"
        :participant="stream.participant"
        :stream-type="stream.streamType"
        tile-role="stage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
} from 'tuikit-atomicx-vue3/room';
import { isCameraOff, useParticipantStreams } from '../useParticipantStreams';
import type { StreamInfo } from '../useParticipantStreams';

const props = defineProps<{
  /** The one picture to show; the first stream in display order when omitted. */
  stageStream?: StreamInfo | null;
}>();

const { participantStreamList } = useParticipantStreams();

const stream = computed(() => props.stageStream ?? participantStreamList.value[0] ?? null);
</script>

<style scoped lang="scss">
.single-layout {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding: 6px;
  overflow: hidden;
  background: color-mix(in srgb, var(--rk-brand) 1.6%, #f8f7f9);
}

.rk-root[data-rk-theme='dark'] .single-layout {
  background: color-mix(in srgb, var(--rk-brand) 2%, #141414);
}

/* Sets the corners only; the participant view rounds its own video to them, and the
   overlay's speaking glow needs the edge left unclipped. */
.single-layout-stream {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--room-view-tile-bg);
  border-radius: 18px;
}

.single-layout-video.is-hidden {
  opacity: 0;
}
</style>
