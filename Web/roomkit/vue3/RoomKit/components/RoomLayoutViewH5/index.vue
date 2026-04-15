<template>
  <div class="room-layout-view-h5">
    <RoomView :layout-template="RoomLayoutTemplate.MobileLayout">
      <template #participantViewUI="{ participant, streamType }">
        <slot v-if="$slots['participantViewUI']" name="participantViewUI" :participant="participant" :stream-type="streamType" />
        <ParticipantViewUI v-else :participant="participant" :stream-type="streamType" />
      </template>
    </RoomView>
  </div>
</template>

<script setup lang="ts">
import { RoomView } from 'tuikit-atomicx-vue3/room';
import { RoomLayoutTemplate } from 'tuikit-atomicx-vue3/room';
import ParticipantViewUI from './ParticipantViewUI/index.vue';
</script>

<style lang="scss" scoped>
.room-layout-view-h5 {
  width: 100%;
  height: 100%;
}
</style>
