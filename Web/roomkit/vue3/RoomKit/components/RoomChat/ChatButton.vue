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
import { useConversationListState, useMessageListState } from 'tuikit-atomicx-vue3/chat';
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

const { setActiveConversation } = useConversationListState();
const { currentRoom } = useRoomState();
const { messageList } = useMessageListState();

const unreadCount = ref(0);

// Watch message list changes only when chat is not open
watch(
  () => messageList.value?.length,
  (newLength, oldLength = 0) => {
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
    setActiveConversation(`GROUP${roomId}`);
    // Reset unread count when room changes
    unreadCount.value = 0;
  },
  { immediate: true },
);

onUnmounted(() => {
  setActiveConversation('');
});

const handleClick = () => {
  unreadCount.value = 0;
  props.togglePanel?.();
};
</script>
