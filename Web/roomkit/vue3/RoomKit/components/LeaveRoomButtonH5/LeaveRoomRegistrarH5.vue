<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import LeaveRoomButtonH5 from './index.vue';

const emit = defineEmits<{
  leave: [];
  end: [];
}>();

const unregister = conference.registerWidget({
  id: BuiltinWidget.LeaveRoomWidget,
  zone: { h5: 'top-right' },
  component: LeaveRoomButtonH5,
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
