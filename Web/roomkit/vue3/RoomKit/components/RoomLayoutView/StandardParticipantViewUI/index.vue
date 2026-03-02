<template>
  <LocalScreenViewUI v-if="isLocalScreen" />
  <ParticipantViewUI
    v-else
    :participant="participant"
    :stream-type="streamType"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoomParticipantState, VideoStreamType } from 'tuikit-atomicx-vue3/room';
import LocalScreenViewUI from './LocalScreenViewUI.vue';
import ParticipantViewUI from './ParticipantViewUI.vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

interface Props {
  participant: RoomParticipant;
  streamType: VideoStreamType;
}
const props = defineProps<Props>();

const { localParticipant } = useRoomParticipantState();

const isLocalScreen = computed(() => props.participant.userId === localParticipant.value?.userId && props.streamType === VideoStreamType.Screen);
</script>
