<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import SettingButton from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.SettingsWidget,
  zone: { pc: 'bottom-center' },
  component: SettingButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
