<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import SwitchCameraButtonH5 from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.SwitchCameraWidget,
  zone: { h5: 'top-left' },
  component: SwitchCameraButtonH5,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
