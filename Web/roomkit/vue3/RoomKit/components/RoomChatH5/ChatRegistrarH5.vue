<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import ChatButtonH5 from './ChatButton.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.RoomChatWidget,
  zone: { h5: 'bottom-center' },
  component: ChatButtonH5,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
