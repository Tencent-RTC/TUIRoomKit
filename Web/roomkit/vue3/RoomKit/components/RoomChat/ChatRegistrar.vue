<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { conference } from '../../adapter/conference';
import { BuiltinWidget } from '../../adapter/type';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import ChatButton from './ChatButton.vue';
import RoomChat from './index.vue';

const { t } = useUIKit();
const { activeWidgetId } = useRoomSidePanel();

const unregister = conference.registerWidget({
  id: BuiltinWidget.RoomChatWidget,
  zone: { pc: 'bottom-center' },
  component: ChatButton,
  props: () => ({
    isActive: activeWidgetId.value === BuiltinWidget.RoomChatWidget,
  }),
  panel: {
    title: () => t('Chat.Title'),
    component: RoomChat,
    keepAlive: true,
    props: () => ({
      isActive: activeWidgetId.value === BuiltinWidget.RoomChatWidget,
    }),
  },
});

onUnmounted(() => unregister());
</script>

<template>
  <!-- Registrar: registration-only, rendering handled by CustomWidgetRenderer -->
</template>
