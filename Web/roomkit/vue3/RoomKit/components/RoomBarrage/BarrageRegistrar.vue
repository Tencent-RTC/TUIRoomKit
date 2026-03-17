<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import BarrageButton from './BarrageButton.vue';
import RoomBarrage from './RoomBarrage.vue';

const { t } = useUIKit();
const { activeWidgetId } = useRoomSidePanel();

const unregister = conference.registerWidget({
  id: BuiltinWidget.BarrageWidget,
  zone: { pc: 'bottom-center' },
  component: BarrageButton,
  props: () => ({
    isActive: activeWidgetId.value === BuiltinWidget.BarrageWidget,
  }),
  panel: {
    title: () => t('Chat.Title'),
    component: RoomBarrage,
    keepAlive: true,
    props: () => ({
      isActive: activeWidgetId.value === BuiltinWidget.BarrageWidget,
    }),
  },
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
