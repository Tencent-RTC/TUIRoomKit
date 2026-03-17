<template>
  <IconButton :title="t('Chat.Title')" @click-icon="handleClick">
    <Badge :value="unreadCount" :hidden="!unreadCount">
      <IconChat :size="24" />
    </Badge>
  </IconButton>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import {
  IconChat,
  useUIKit,
  Badge,
} from '@tencentcloud/uikit-base-component-vue3';
import { useBarrageState } from 'tuikit-atomicx-vue3/live';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

interface Props {
  isActive?: boolean;
  togglePanel?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  togglePanel: undefined,
});

const { t } = useUIKit();

const { currentRoom } = useRoomState();
const { messageList } = useBarrageState();

const unreadCount = ref(0);

// Watch message list changes only when chat is not open
watch(
  () => messageList.value?.length,
  (newLength, oldLength) => {
    if (!newLength || newLength === 0) {
      return;
    }

    // Only increment unread count when chat window is closed
    if (!props.isActive && newLength > oldLength) {
      unreadCount.value += newLength - oldLength;
    }
  },
);

// Clear unread count when chat window opens
watch(
  () => props.isActive,
  (isOpen) => {
    if (isOpen) {
      unreadCount.value = 0;
    }
  },
);

watch(
  () => currentRoom.value?.roomId,
  (roomId) => {
    if (!roomId) {
      return;
    }
    // Reset unread count when room changes
    unreadCount.value = 0;
  },
);

onUnmounted(() => {
});

const handleClick = () => {
  unreadCount.value = 0;
  props.togglePanel?.();
};
</script>
