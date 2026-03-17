<script setup lang="ts">
import { onUnmounted } from 'vue';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import ParticipantButtonH5 from './index.vue';

const unregister = conference.registerWidget({
  id: BuiltinWidget.MemberWidget,
  zone: { h5: 'bottom-center' },
  component: ParticipantButtonH5,
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
