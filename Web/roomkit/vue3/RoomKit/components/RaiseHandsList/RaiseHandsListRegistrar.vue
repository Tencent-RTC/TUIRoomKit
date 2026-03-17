<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import RaiseHandsList from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.RaiseHandsListWidget,
  zone: { pc: 'bottom-center' },
  component: RaiseHandsList,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
