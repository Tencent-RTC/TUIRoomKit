<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import CurrentRoomInfo from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.CurrentRoomInfoWidget,
  zone: { pc: 'top-center' },
  component: CurrentRoomInfo,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
