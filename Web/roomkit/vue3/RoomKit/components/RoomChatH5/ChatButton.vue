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
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButtonH5 from '../base/IconButtonH5.vue';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';
import RoomChatH5 from './RoomChat.vue';

const { t } = useUIKit();

const isPopupVisible = ref(false);
const { setActiveConversation } = useConversationListState();
const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();
const { messageList } = useMessageListState();

const unreadCount = ref(0);
const hasInitializedMessageList = ref(false);

const resetUnreadTracking = () => {
  unreadCount.value = 0;
  hasInitializedMessageList.value = false;
};

watch(
  messageList,
  (newMessageList, oldMessageList) => {
    const currentMessageList = newMessageList || [];

    if (!hasInitializedMessageList.value) {
      hasInitializedMessageList.value = true;
      return;
    }

    if (isPopupVisible.value) {
      return;
    }

    const previousLength = oldMessageList?.length || 0;
    if (currentMessageList.length <= previousLength) {
      return;
    }

    const unreadMessages = currentMessageList
      .slice(previousLength)
      .filter(message => message?.from !== loginUserInfo.value?.userId);

    unreadCount.value += unreadMessages.length;
  },
  { deep: false },
);

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
    resetUnreadTracking();
    if (!roomId) {
      setActiveConversation('');
      return;
    }
    setActiveConversation(`GROUP${roomId}`);
  },
  { immediate: true },
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
