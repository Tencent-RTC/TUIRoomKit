<template>
  <StandardLeave
    v-if="!frozenIsWebinar"
    :emitFunction="emit"
  />
  <WebinarLeave
    v-else
    :emit-function="emit"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { RoomType, useRoomState } from 'tuikit-atomicx-vue3/room';
import StandardLeave from './StandardLeave.vue';
import WebinarLeave from './WebinarLeave.vue';

const emit = defineEmits(['leave', 'end']);
const { currentRoom } = useRoomState();

const frozenIsWebinar = ref<boolean | null>(null);
watch(
  () => currentRoom.value?.roomType,
  (roomType) => {
    if (frozenIsWebinar.value === null && roomType !== undefined) {
      frozenIsWebinar.value = roomType === RoomType.Webinar;
    }
  },
  { immediate: true },
);
</script>
