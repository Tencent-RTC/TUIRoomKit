<template>
  <IconButtonH5 :title="t('Chat.Title')" @click="handleClick">
    <Badge :value="unreadCount" :hidden="!unreadCount">
      <IconChat :size="24" />
    </Badge>
  </IconButtonH5>

  <TUIPopup v-model:visible="isPopupVisible" height="90%">
    <div class="chat-content">
      <PopUpArrowDown @click="isPopupVisible = false" />
      <div class="chat-title">
        {{ t('Chat.Title') }}
      </div>
      <RoomChatH5 v-if="isPopupVisible" />
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import {
  IconChat,
  useUIKit,
  Badge,
  TUIPopup,
} from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState, useMessageListState } from 'tuikit-atomicx-vue3/chat';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButtonH5 from '../base/IconButtonH5.vue';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';
import RoomChatH5 from './RoomChat.vue';

const { t } = useUIKit();

const isPopupVisible = ref(false);
const { setActiveConversation } = useConversationListState();
const { currentRoom } = useRoomState();
const { messageList } = useMessageListState();

const unreadCount = ref(0);

// Watch message list changes only when chat is not open
watch(
  () => messageList.value?.length,
  (newLength, oldLength) => {
    if (!newLength || newLength === 0) {
      return;
    }

    // Only increment unread count when chat window is closed
    if (!isPopupVisible.value && newLength > oldLength) {
      unreadCount.value += newLength - oldLength;
    }
  },
);

// Clear unread count when chat window opens
watch(
  () => isPopupVisible.value,
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
);

onUnmounted(() => {
  setActiveConversation('');
});

const handleClick = () => {
  unreadCount.value = 0;
  isPopupVisible.value = true;
};
</script>

<style lang="scss" scoped>
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;

  .chat-title {
    font-size: 16px;
    font-weight: 600;
    padding: 0px 20px;
  }
}
</style>
