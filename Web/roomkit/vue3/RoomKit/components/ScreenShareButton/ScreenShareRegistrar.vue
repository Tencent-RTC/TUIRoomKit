<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import ScreenShareButton from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.ScreenShareWidget,
  zone: { pc: 'bottom-center' },
  component: ScreenShareButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
