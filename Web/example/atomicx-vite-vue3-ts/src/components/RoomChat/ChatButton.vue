<template>
  <IconButton
    :title="t('Chat.Title')"
    @click-icon="handleClick"
  >
    <Badge :value="unreadCount" :hidden="!unreadCount">
      <IconChat :size="24" />
    </Badge>
  </IconButton>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IconChat, useUIKit, Badge } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState, useMessageListState } from 'tuikit-atomicx-vue3/chat';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

interface Props {
  isChatOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isChatOpen: false,
});

const emit = defineEmits(['click-icon']);

const { t } = useUIKit();

const { setActiveConversation } = useConversationListState();
const { currentRoom } = useRoomState();
const { messageList } = useMessageListState();

const unreadCount = ref(0);
const previousMessageCount = ref(0);

// Watch message list changes only when chat is not open
watch(() => messageList.value?.length, (newLength, oldLength) => {
  if (!newLength || newLength === 0) {
    return;
  }

  // Only increment unread count when chat window is closed
  if (!props.isChatOpen && newLength > oldLength) {
    unreadCount.value += (newLength - oldLength);
  }
});

// Clear unread count when chat window opens
watch(() => props.isChatOpen, (isOpen) => {
  if (isOpen) {
    unreadCount.value = 0;
  }
});

watch(() => currentRoom.value?.roomId, (roomId) => {
  if (!roomId) {
    return;
  }
  setActiveConversation(`GROUP${roomId}`);
  // Reset unread count when room changes
  unreadCount.value = 0;
  previousMessageCount.value = 0;
});

const handleClick = () => {
  unreadCount.value = 0;
  emit('click-icon');
};
</script>
