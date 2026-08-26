<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../../adapter/conference';
import { BuiltinWidget } from '../../../adapter/type';
import ASRButtonH5 from './ASRButtonH5.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.AIToolsWidget,
  zone: { h5: 'bottom-center' },
  order: 6,
  component: ASRButtonH5,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
