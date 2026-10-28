<template>
  <div class="room-view">
    <SingleLayout v-if="layoutTemplate === RoomLayoutTemplate.SingleLayout" :stage-stream="stageStream">
      <template #participantViewUI="slotProps">
        <ParticipantViewOverlay
          v-if="!hideOverlay"
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
          v-if="!hideOverlay"
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
      :stage-stream="stageStream"
      @stream-double-click="emit('stream-double-click', $event)"
    >
      <template #participantViewUI="slotProps">
        <ParticipantViewOverlay
          v-if="!hideOverlay"
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
/* Renders the template it is given. Which stream takes the stage, and what a double-click
   does, belong to the host: it passes `stageStream` and listens to `stream-double-click`. */
import { computed } from 'vue';
import GridLayout from './GridLayout.vue';
import SingleLayout from './SingleLayout.vue';
import SpeakerLayout from './SpeakerLayout.vue';
import ParticipantViewOverlay from '../ParticipantViewOverlayPC/ParticipantViewOverlayPC.vue';
import { RoomLayoutTemplate } from '../../../core/types';
import type { StreamInfo } from '../useParticipantStreams';

const props = defineProps<{
  layoutTemplate: RoomLayoutTemplate;
  /** Single and speaker layouts: the stage picture; the first stream in display order when omitted. */
  stageStream?: StreamInfo | null;
  /** Forwarded to every tile so a read-only surface can drop the more menu. */
  hideActions?: boolean;
  /** Drops the built-in overlay so a host-supplied participantViewUI replaces it. */
  hideOverlay?: boolean;
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
  /* Tile fill before the first frame lands; every layout's tile reads it. */
  --room-view-tile-bg: color-mix(in srgb, var(--rk-brand) 1.6%, #f8f7f9);

  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

.rk-root[data-rk-theme='dark'] .room-view {
  --room-view-tile-bg: color-mix(in srgb, var(--rk-brand) 2%, #141414);
}

/* The tile overlay lets presses through, so a right-click would open the browser's
   video menu (save, picture-in-picture) on the stream. */
.room-view :deep(video) {
  pointer-events: none;
}
</style>
