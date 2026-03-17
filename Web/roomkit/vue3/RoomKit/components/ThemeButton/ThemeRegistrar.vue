<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import ThemeButton from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.ThemeWidget,
  zone: { pc: 'top-left' },
  component: ThemeButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
