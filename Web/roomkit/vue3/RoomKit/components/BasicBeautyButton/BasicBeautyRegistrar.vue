<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import BasicBeautyButton from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.BasicBeautyWidget,
  zone: { pc: 'bottom-center' },
  component: BasicBeautyButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
