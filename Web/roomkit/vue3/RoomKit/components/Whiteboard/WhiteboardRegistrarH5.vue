<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import WhiteboardEntryButtonH5 from './WhiteboardEntryButtonH5.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.WhiteboardWidget,
  zone: { h5: 'bottom-center' },
  component: WhiteboardEntryButtonH5,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
