<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import LocalNetworkInfo from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.LocalNetworkInfoWidget,
  zone: { pc: 'top-left' },
  component: LocalNetworkInfo,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
