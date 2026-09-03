<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { conference } from '../../../adapter/conference';
import { BuiltinWidget } from '../../../adapter/type';
import ASRButton from './ASRButton.vue';
import RecordPanel from '../record/RecordPanel.vue';

const { t } = useUIKit();

const unregister = conference.registerWidget({
  id: BuiltinWidget.AIToolsWidget,
  zone: { pc: 'bottom-center' },
  order: 7,
  overflow: false,
  component: ASRButton,
  panel: {
    title: () => t('AITools.RealtimeMessageList'),
    component: RecordPanel,
  },
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
