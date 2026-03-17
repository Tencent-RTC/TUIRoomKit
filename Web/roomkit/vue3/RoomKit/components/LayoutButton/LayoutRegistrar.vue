<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import LayoutButton from './index.vue';
import type { RoomLayoutTemplate } from 'tuikit-atomicx-vue3/room';

const props = defineProps<{
  layout: RoomLayoutTemplate;
}>();

const emit = defineEmits<{
  'update:layout': [layout: RoomLayoutTemplate];
}>();

const unregister = conference.registerWidget({
  id: BuiltinWidget.LayoutWidget,
  zone: { pc: 'top-left' },
  component: LayoutButton,
  props: () => ({
    'layout': props.layout,
    'onUpdate:layout': (val: RoomLayoutTemplate) => emit('update:layout', val),
  }),
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
