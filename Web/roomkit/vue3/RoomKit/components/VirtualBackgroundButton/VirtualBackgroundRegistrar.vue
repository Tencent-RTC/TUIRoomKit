<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import VirtualBackgroundButton from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.VirtualBackgroundWidget,
  zone: { pc: 'bottom-center' },
  component: VirtualBackgroundButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
