<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import AIToolsButtonH5 from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.AIToolsWidget,
  zone: { h5: 'bottom-center' },
  component: AIToolsButtonH5,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
