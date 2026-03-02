<template>
  <RoomView
    :layout-template="layoutTemplate"
  >
    <template #participantViewUI="{ participant, streamType }">
      <StandardParticipantViewUI
        v-if="currentRoom?.roomType === RoomType.Standard"
        :participant="participant"
        :stream-type="streamType"
      />
      <WebinarParticipantViewUI
        v-if="currentRoom?.roomType === RoomType.Webinar"
        :participant="participant"
        :stream-type="streamType"
      />
    </template>
  </RoomView>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { RoomView, useRoomParticipantState, useRoomState, RoomLayoutTemplate, RoomType } from 'tuikit-atomicx-vue3/room';
import StandardParticipantViewUI from './StandardParticipantViewUI/index.vue';
import WebinarParticipantViewUI from './WebinarParticipantViewUI/index.vue';

const props = defineProps<{
  layoutTemplate: RoomLayoutTemplate;
}>();

const emits = defineEmits(['update:layoutTemplate']);

const { currentRoom } = useRoomState();
const { participantList, participantWithScreen } = useRoomParticipantState();

watch(participantWithScreen, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    emits('update:layoutTemplate', RoomLayoutTemplate.SidebarLayout);
  }
});

watch(
  () => participantList.value.length + (participantWithScreen.value ? 1 : 0),
  (val) => {
    if (currentRoom.value?.roomType === RoomType.Standard && val === 1 && props.layoutTemplate !== RoomLayoutTemplate.GridLayout) {
      emits('update:layoutTemplate', RoomLayoutTemplate.GridLayout);
    }
  },
);

</script>

<style lang="scss" scoped>
</style>
