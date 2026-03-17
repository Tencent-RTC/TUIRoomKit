<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import CameraButton from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.CameraWidget,
  zone: { pc: 'bottom-left' },
  component: CameraButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
