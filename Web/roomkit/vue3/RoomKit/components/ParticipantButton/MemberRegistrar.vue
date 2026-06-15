<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantList } from '../RoomParticipantList';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import ParticipantButton from './index.vue';

const { t } = useUIKit();
const { currentRoom } = useRoomState();

const unregister = conference.registerWidget({
  id: BuiltinWidget.MemberWidget,
  zone: { pc: 'bottom-center' },
  order: 4,
  component: ParticipantButton,
  panel: {
    title: () => t('Participant.Title', { count: currentRoom.value?.participantCount }),
    component: RoomParticipantList,
  },
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
