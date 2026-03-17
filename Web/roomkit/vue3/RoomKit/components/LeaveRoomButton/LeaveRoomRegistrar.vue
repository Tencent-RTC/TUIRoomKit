<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import LeaveRoomButton from './index.vue';

const emit = defineEmits<{
  leave: [];
  end: [];
}>();

const unregister = conference.registerWidget({
  id: BuiltinWidget.LeaveRoomWidget,
  zone: { pc: 'bottom-right' },
  component: LeaveRoomButton,
  props: {
    onLeave: () => emit('leave'),
    onEnd: () => emit('end'),
  },
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
