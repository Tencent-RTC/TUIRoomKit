<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { RealtimeMessageList } from 'tuikit-atomicx-vue3/room';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import AIToolsButton from './index.vue';

const { t } = useUIKit();

const unregister = conference.registerWidget({
  id: BuiltinWidget.AIToolsWidget,
  zone: { pc: 'bottom-center' },
  component: AIToolsButton,
  panel: {
    title: () => t('AITools.RealtimeMessageList'),
    component: RealtimeMessageList,
  },
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
