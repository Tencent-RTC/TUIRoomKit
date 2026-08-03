<template>
  <LocalScreenViewUI
    v-if="isLocalScreen"
    :annotation-disabled="annotationDisabled"
  />
  <RemoteScreenViewUI
    v-else-if="isRemoteScreen && participant"
    :participant="participant"
    :stream-type="streamType"
    :annotation-disabled="annotationDisabled"
  />
  <ParticipantViewUI
    v-else-if="participant"
    :participant="participant"
    :stream-type="streamType"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoomParticipantState, VideoStreamType } from 'tuikit-atomicx-vue3/room';
import LocalScreenViewUI from './LocalScreenViewUI.vue';
import ParticipantViewUI from './ParticipantViewUI.vue';
import RemoteScreenViewUI from './RemoteScreenViewUI.vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

interface Props {
  participant?: RoomParticipant | null;
  streamType: VideoStreamType;
  annotationDisabled?: boolean;
}
const props = defineProps<Props>();

const { localParticipant } = useRoomParticipantState();

const isLocalScreen = computed(() =>
  props.participant?.userId === localParticipant.value?.userId
  && props.streamType === VideoStreamType.Screen,
);

const isRemoteScreen = computed(() =>
  !!props.participant
  && props.participant.userId !== localParticipant.value?.userId
  && props.streamType === VideoStreamType.Screen,
);
</script>
