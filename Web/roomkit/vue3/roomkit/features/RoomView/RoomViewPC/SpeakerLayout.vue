<template>
  <div class="speaker-layout" :class="streamContainerClass">
    <div
      v-if="enlargeStreamInfo?.participant"
      class="speaker-layout-main"
    >
      <div class="speaker-layout-tile speaker-layout-tile-main" data-tile-role="stage">
        <RoomParticipantView
          class="speaker-layout-video"
          :class="{ 'is-hidden': isCameraOff(enlargeStreamInfo) }"
          :participant="enlargeStreamInfo.participant"
          :stream-type="enlargeStreamInfo.streamType"
          :fill-mode="FillMode.Fit"
          :lazy-load="{ enable: false }"
        />
        <slot
          name="participantViewUI"
          :participant="enlargeStreamInfo.participant"
          :stream-type="enlargeStreamInfo.streamType"
        />
      </div>
    </div>

    <div class="speaker-layout-list">
      <div class="speaker-layout-list-content">
        <div
          v-for="streamInfo in sideStreamInfoList"
          :key="`${streamInfo.participant.userId}_${streamInfo.streamType}`"
          class="speaker-layout-tile"
          data-tile-role="thumb"
          @dblclick.capture="handleStreamViewDblclick(streamInfo, $event)"
        >
          <RoomParticipantView
            class="speaker-layout-video"
            :class="{ 'is-hidden': isCameraOff(streamInfo) }"
            :participant="streamInfo.participant"
            :stream-type="streamInfo.streamType"
            :fill-mode="FillMode.Fit"
          />
          <slot
            name="participantViewUI"
            :participant="streamInfo.participant"
            :stream-type="streamInfo.streamType"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import {
  FillMode,
  RoomParticipantEvent,
  RoomParticipantView,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-vue3/room';
import { RoomLayoutTemplate } from '../../../core/types';
import { isCameraOff, useParticipantStreams } from '../useParticipantStreams';
import type { RoomUser } from 'tuikit-atomicx-vue3/room';
import type { StreamInfo } from '../useParticipantStreams';

const props = defineProps<{
  layoutTemplate: RoomLayoutTemplate;
}>();

const emit = defineEmits<{
  'stream-double-click': [streamInfo: StreamInfo];
}>();

const { sortedParticipantCameraList } = useParticipantStreams();
const {
  localParticipant,
  participantListWithVideo,
  participantWithScreen,
  subscribeEvent,
  unsubscribeEvent,
} = useRoomParticipantState();

const primaryStreamInfo = ref<StreamInfo | null>(null);

const enlargeStreamInfo = computed<StreamInfo | null>(() => {
  if (primaryStreamInfo.value) {
    return primaryStreamInfo.value;
  }
  if (participantWithScreen.value) {
    return {
      participant: participantWithScreen.value,
      streamType: VideoStreamType.Screen,
    };
  }
  if (participantListWithVideo.value.length > 0) {
    return {
      participant: participantListWithVideo.value[0],
      streamType: VideoStreamType.Camera,
    };
  }
  if (localParticipant.value) {
    return {
      participant: localParticipant.value,
      streamType: VideoStreamType.Camera,
    };
  }
  return null;
});

function isSameStream(a: StreamInfo, b: StreamInfo) {
  return a.participant.userId === b.participant.userId
    && a.streamType === b.streamType;
}

const sideStreamInfoList = computed(() => {
  const result: StreamInfo[] = [];
  const enlarged = enlargeStreamInfo.value;

  if (participantWithScreen.value) {
    const screenStream: StreamInfo = {
      participant: participantWithScreen.value,
      streamType: VideoStreamType.Screen,
    };
    if (!enlarged || !isSameStream(screenStream, enlarged)) {
      result.push(screenStream);
    }
  }

  // Keep all camera tiles in the strip, matching AtomicX SpeakerLayout.
  result.push(...sortedParticipantCameraList.value);
  return result;
});

function handleStreamViewDblclick(streamInfo: StreamInfo, event: MouseEvent) {
  // Capture runs before a covering whiteboard can stop the click. The more chip
  // still opts out, so opening that menu does not also swap the stage.
  const target = event.target;
  if (target instanceof Element && target.closest('.participant-view-overlay-more')) {
    return;
  }
  primaryStreamInfo.value = streamInfo;
  emit('stream-double-click', streamInfo);
}

const streamContainerClass = computed(() => {
  if (props.layoutTemplate === RoomLayoutTemplate.CinemaLayout) {
    return 'is-cinema';
  }
  return 'is-sidebar';
});

function handleParticipantLeft({ userInfo }: { userInfo: RoomUser }) {
  if (userInfo.userId === primaryStreamInfo.value?.participant?.userId) {
    primaryStreamInfo.value = null;
  }
}

watch(participantWithScreen, (val, oldVal) => {
  if (!primaryStreamInfo.value) {
    return;
  }
  const { streamType, participant } = primaryStreamInfo.value;
  if (!val && streamType === VideoStreamType.Screen && participant.userId === oldVal?.userId) {
    primaryStreamInfo.value = null;
  }
  if (val && streamType !== VideoStreamType.Screen) {
    primaryStreamInfo.value = null;
  }
}, { immediate: true });

subscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
onUnmounted(() => {
  unsubscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
});
</script>

<style scoped lang="scss">
.speaker-layout {
  /* The strip size and the thumbnail size are the same few numbers seen from
     different sides, so both layouts read them from here. */
  --speaker-list-width: 200px;
  --speaker-list-padding: 6px;
  --speaker-tile-width: 240px;
  --speaker-tile-height: calc(var(--speaker-tile-width) * 9 / 16);
  --speaker-tile-gap: 8px;
  --speaker-tile-radius: 18px;

  /* Space between the stage and the strip */
  --speaker-stage-gap: 10px;

  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* The stage takes whatever the strip leaves and keeps it: the video letterboxes inside
   the box rather than the box being cut down to the video's ratio. */
.speaker-layout-main {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: var(--speaker-list-padding);
  overflow: hidden;
}

.speaker-layout-list {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* The strip centres this block; the block itself scrolls once it outgrows the strip. */
.speaker-layout-list-content {
  display: flex;
  gap: var(--speaker-tile-gap);
  max-width: 100%;
  max-height: 100%;
  scrollbar-width: none;
}

.speaker-layout-list-content::-webkit-scrollbar {
  display: none;
}

/* The tile is the one clip for the video and the overlay. */
.speaker-layout-tile {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--room-view-tile-bg);
  border-radius: var(--speaker-tile-radius);
}

.speaker-layout-video.is-hidden {
  opacity: 0;
}

.speaker-layout-tile-main {
  width: 100%;
  height: 100%;
}

.speaker-layout-tile:not(.speaker-layout-tile-main) {
  width: var(--speaker-tile-width);
  height: var(--speaker-tile-height);
}

/* The speaking halo reads outside the tile box, so the layout that owns the box draws
   it: a shadow on the tile is not clipped by the tile's own overflow, while anything
   the overlay could draw would be. The overlay stays the single source of the state. */
.speaker-layout-tile:has(.participant-view-overlay.is-speaking) {
  box-shadow:
    0 0 0 1.5px color-mix(in srgb, #34c759 60%, transparent),
    0 0 18px color-mix(in srgb, #34c759 18%, transparent);
}

/* Speaker on the side: the strip is pinned right, the main area takes the rest of the row. */
.speaker-layout.is-sidebar {
  /* Strip tiles fill the strip's content box, so their width follows the strip */
  --speaker-tile-width: calc(var(--speaker-list-width) - var(--speaker-list-padding) * 2);

  display: flex;
  flex-wrap: nowrap;
  gap: var(--speaker-stage-gap);

  .speaker-layout-list {
    flex-direction: column;

    /* The strip fills the column height but the tiles stay pinned to the top */
    justify-content: flex-start;
    width: var(--speaker-list-width);
    height: 100%;
  }

  /* The inset lives on the scroller, not on the strip, so a speaking tile's halo has
     somewhere to bleed before the scroller clips it. */
  .speaker-layout-list-content {
    flex-wrap: wrap;
    place-content: flex-start;
    padding: var(--speaker-list-padding);
    overflow-y: auto;
  }
}

/* Participants on top: the strip sits across the top, the main area below it. */
.speaker-layout.is-cinema {
  /* Here the strip's height sets the thumbnail size, the way its width does in the
     sidebar, and 16:9 gives the other side. The strip box insets the tiles so a
     speaking tile's halo has somewhere to bleed before the scroller clips it. */
  --speaker-tile-height: 110px;
  --speaker-tile-width: calc(var(--speaker-tile-height) * 16 / 9);
  --speaker-list-height: calc(var(--speaker-tile-height) + var(--speaker-list-padding) * 2);

  display: flex;
  flex-direction: column-reverse;
  gap: var(--speaker-stage-gap);

  .speaker-layout-list {
    flex: 0 0 auto;
    width: 100%;
    height: var(--speaker-list-height);
  }

  /* The inset lives on the scroller so a speaking tile's halo has somewhere to bleed
     before the scroller clips it. */
  .speaker-layout-list-content {
    padding: var(--speaker-list-padding);
    overflow-x: auto;
  }
}
</style>
