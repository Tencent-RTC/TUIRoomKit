<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import RaiseHandsButton from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.RaiseHandsWidget,
  zone: { pc: 'bottom-left' },
  component: RaiseHandsButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
