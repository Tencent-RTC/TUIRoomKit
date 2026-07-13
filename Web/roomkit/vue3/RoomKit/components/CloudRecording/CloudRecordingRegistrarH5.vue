<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import CloudRecordingButtonH5 from './CloudRecordingButtonH5.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.RecordingWidget,
  zone: { h5: 'bottom-center' },
  order: 5,
  component: CloudRecordingButtonH5,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
