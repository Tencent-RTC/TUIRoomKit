<template>
  <div class="single-layout">
    <div v-if="stream" class="single-layout-stream" data-tile-role="stage">
      <RoomParticipantView
        class="single-layout-video"
        :class="{ 'is-hidden': isCameraOff(stream) }"
        :participant="stream.participant"
        :stream-type="stream.streamType"
        :fill-mode="stream.fillMode"
        :lazy-load="{ enable: false }"
      />
      <slot
        name="participantViewUI"
        :participant="stream.participant"
        :stream-type="stream.streamType"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  DeviceStatus,
  FillMode,
  RoomParticipantView,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-vue3/room';
import { isCameraOff } from '../useParticipantStreams';

const props = defineProps<{
  /** Skip the share and show the speaker instead, for surfaces that cannot render it. */
  hideScreen?: boolean;
}>();

const {
  localParticipant,
  participantList,
  participantWithScreen,
  speakingUsers,
} = useRoomParticipantState();

/** Silence grace for the current speaker before the picture may move to someone else. */
const SPEAKER_HOLD = 1000;

const currentSpeakerId = ref('');
let currentSpeakerLastHeardAt = 0;

function hasVoice(volume: number | undefined): boolean {
  return volume !== undefined && volume > 0;
}

function findLoudestId(volumes: Map<string, number>): string {
  let loudestId = '';
  let loudest = 0;
  volumes.forEach((volume, userId) => {
    if (volume > loudest) {
      loudest = volume;
      loudestId = userId;
    }
  });
  return loudestId;
}

function setCurrentSpeaker(userId: string) {
  currentSpeakerId.value = userId;
  currentSpeakerLastHeardAt = Date.now();
}

function clearCurrentSpeaker() {
  currentSpeakerId.value = '';
  currentSpeakerLastHeardAt = 0;
}

function pickSpeaker(volumes: Map<string, number>) {
  // People who left the room disappear from speakingUsers; drop a stale id first.
  if (currentSpeakerId.value && !volumes.has(currentSpeakerId.value)) {
    clearCurrentSpeaker();
  }

  const candidates = new Map(volumes);
  if (localParticipant.value?.microphoneStatus === DeviceStatus.Off) {
    candidates.delete(localParticipant.value.userId);
  }

  const speakerId = currentSpeakerId.value;
  // Current speaker still talking: keep them even if someone else is louder.
  if (speakerId && hasVoice(candidates.get(speakerId))) {
    currentSpeakerLastHeardAt = Date.now();
    return;
  }

  const loudestId = findLoudestId(candidates);
  if (!loudestId) {
    return;
  }

  // No current speaker yet, or they have been quiet long enough to switch.
  const maySwitch = !speakerId || Date.now() - currentSpeakerLastHeardAt >= SPEAKER_HOLD;
  if (maySwitch) {
    setCurrentSpeaker(loudestId);
  }
}

watch(speakingUsers, pickSpeaker, { deep: true });

/** Resolves to nothing until someone speaks, and again once that person leaves. */
const currentSpeaker = computed(() => {
  if (!currentSpeakerId.value) {
    return undefined;
  }
  if (localParticipant.value?.userId === currentSpeakerId.value) {
    return localParticipant.value;
  }
  return participantList.value.find(item => item.userId === currentSpeakerId.value);
});

/** A share outranks the speaker, and the local camera is the resting state under both. */
const stream = computed(() => {
  if (participantWithScreen.value && !props.hideScreen) {
    return {
      participant: participantWithScreen.value,
      streamType: VideoStreamType.Screen,
      fillMode: FillMode.Fit,
    };
  }

  const participant = currentSpeaker.value ?? localParticipant.value;
  if (!participant) {
    return null;
  }
  return {
    participant,
    streamType: VideoStreamType.Camera,
    fillMode: FillMode.Fill,
  };
});
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

.single-layout-stream {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--room-view-tile-bg);
  border-radius: 18px;
}

.single-layout-video.is-hidden {
  opacity: 0;
}

.single-layout-stream:has(.participant-view-overlay.is-speaking) {
  box-shadow:
    0 0 0 1.5px color-mix(in srgb, #34c759 60%, transparent),
    0 0 18px color-mix(in srgb, #34c759 18%, transparent);
}
</style>
