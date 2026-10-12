<template>
  <div class="room-view">
    <SingleLayout v-if="layoutTemplate === RoomLayoutTemplate.SingleLayout">
      <template #participantViewUI="slotProps">
        <ParticipantViewOverlay
          :participant="slotProps.participant"
          :stream-type="slotProps.streamType"
          :hide-actions="hideActions"
        />
        <slot name="participantViewUI" v-bind="slotProps" />
      </template>
    </SingleLayout>

    <GridLayout
      v-else-if="layoutTemplate === RoomLayoutTemplate.GridLayout"
      @stream-double-click="emit('stream-double-click', $event)"
    >
      <template #participantViewUI="slotProps">
        <ParticipantViewOverlay
          :participant="slotProps.participant"
          :stream-type="slotProps.streamType"
          :hide-actions="hideActions"
        />
        <slot name="participantViewUI" v-bind="slotProps" />
      </template>
    </GridLayout>

    <SpeakerLayout
      v-else-if="isSpeakerLayout"
      :layout-template="layoutTemplate"
      @stream-double-click="emit('stream-double-click', $event)"
    >
      <template #participantViewUI="slotProps">
        <ParticipantViewOverlay
          :participant="slotProps.participant"
          :stream-type="slotProps.streamType"
          :hide-actions="hideActions"
        />
        <slot name="participantViewUI" v-bind="slotProps" />
      </template>
    </SpeakerLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GridLayout from './GridLayout.vue';
import SingleLayout from './SingleLayout.vue';
import SpeakerLayout from './SpeakerLayout.vue';
import ParticipantViewOverlay from '../ParticipantViewOverlay/index.vue';
import { RoomLayoutTemplate } from '../../../core/types';
import type { StreamInfo } from './useParticipantStreams';

const props = defineProps<{
  layoutTemplate: RoomLayoutTemplate;
  /** Forwarded to every tile so a read-only surface can drop the more menu. */
  hideActions?: boolean;
}>();

const emit = defineEmits<{
  'stream-double-click': [streamInfo: StreamInfo];
}>();

const isSpeakerLayout = computed(() =>
  props.layoutTemplate === RoomLayoutTemplate.SidebarLayout
  || props.layoutTemplate === RoomLayoutTemplate.CinemaLayout,
);
</script>

<style scoped lang="scss">
.room-view {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

/* Name cards sit on the rounded tile and must not be clipped by it. AtomicX defaults
   the view to overflow:hidden; keep the video layer as the thing that clips to radius.
   Camera-off still hides the <video>: overflow+radius anti-aliases its black fringe
   into four corner ticks. */
.room-view :deep(.atomicx-participant-view) {
  overflow: visible;
  background: color-mix(in srgb, var(--rk-brand) 1.6%, #f8f7f9);
}

.room-view :deep(.stream-play-container) {
  overflow: hidden;
  border-radius: inherit;
}

.rk-root[data-rk-theme='dark'] .room-view :deep(.atomicx-participant-view) {
  background: color-mix(in srgb, var(--rk-brand) 2%, #141414);
}

.room-view :deep(.atomicx-participant-view:hover .participant-view-overlay-more),
.room-view :deep(.participant-view-overlay-more.is-open) {
  opacity: 1;
  transform: translateY(0);
}

.room-view :deep(.atomicx-participant-view:hover .participant-view-overlay-more:hover) {
  transform: translateY(0) scale(1.06);
}

.room-view :deep(.atomicx-participant-view:has(.participant-view-overlay-mask) .stream-play-container) {
  opacity: 0;
}

/* Camera-on: TRTC paints a 1px black fringe on <video>. Bleed 1px so the video-layer clip hides it. */
.room-view :deep(video) {
  width: calc(100% + 2px) !important;
  height: calc(100% + 2px) !important;
  margin: -1px !important;
}
</style>
