<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import CloudRecordingButton from './CloudRecordingButton.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.RecordingWidget,
  zone: { pc: 'bottom-center' },
  order: 1,
  component: CloudRecordingButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
