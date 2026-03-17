<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import RoomITitleH5 from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.CurrentRoomInfoWidget,
  zone: { h5: 'top-center' },
  component: RoomITitleH5,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
