<template>
  <RoomView
    :layout-template="layoutTemplate"
  >
    <template #participantViewUI="{ participant, streamType }">
      <ParticipantViewUI :participant="participant" :stream-type="streamType" />
    </template>
  </RoomView>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { RoomView, useRoomParticipantState, RoomLayoutTemplate } from 'tuikit-atomicx-vue3/room';
import ParticipantViewUI from './ParticipantViewUI/index.vue';

const props = defineProps<{
  layoutTemplate: RoomLayoutTemplate;
}>();

const emits = defineEmits(['update:layoutTemplate']);

const { participantList, participantWithScreen } = useRoomParticipantState();

watch(participantWithScreen, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    emits('update:layoutTemplate', RoomLayoutTemplate.SidebarLayout);
  }
});

watch(
  () => participantList.value.length + (participantWithScreen.value ? 1 : 0),
  (val) => {
    if (val === 1 && props.layoutTemplate !== RoomLayoutTemplate.GridLayout) {
      emits('update:layoutTemplate', RoomLayoutTemplate.GridLayout);
    }
  },
);

</script>

<style lang="scss" scoped>
</style>
