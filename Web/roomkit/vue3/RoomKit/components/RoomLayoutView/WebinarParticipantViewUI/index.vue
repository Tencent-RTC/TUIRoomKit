<template>
  <ParticipantViewUI
    v-if="participant"
    :participant="participant"
    :stream-type="streamType"
  />
  <div
    v-else
    class="host-away-container"
  >
    <Avatar
      size="xxl"
      :src="currentRoom?.roomOwner.avatarUrl"
      :user-id="currentRoom?.roomOwner.userId"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Avatar,
  VideoStreamType,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import ParticipantViewUI from '../StandardParticipantViewUI/ParticipantViewUI.vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

interface Props {
  participant?: RoomParticipant;
  streamType: VideoStreamType;
}
defineProps<Props>();

const { currentRoom } = useRoomState();
</script>

<style lang="scss" scoped>
.host-away-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color-bubble-reciprocal);

}
</style>
