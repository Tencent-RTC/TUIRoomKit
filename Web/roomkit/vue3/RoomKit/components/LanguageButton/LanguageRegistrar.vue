<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import LanguageButton from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.LanguageWidget,
  zone: { pc: 'top-right' },
  component: LanguageButton,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
