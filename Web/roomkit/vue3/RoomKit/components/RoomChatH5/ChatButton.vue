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
  <ChatContextSync
    v-if="CHAT_CHANNEL"
    :key="CHAT_CHANNEL"
    :channel="CHAT_CHANNEL"
    :is-active="isPopupVisible"
    @unread-change="unreadCount = $event"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IconChat,
  useUIKit,
  Badge,
  TUIPopup,
} from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButtonH5 from '../base/IconButtonH5.vue';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';
import ChatContextSync from './ChatContextSync.vue';
import RoomChatH5 from './RoomChat.vue';

const { t } = useUIKit();

const isPopupVisible = ref(false);
const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();

const unreadCount = ref(0);
const CHAT_CHANNEL = computed(() => (currentRoom.value?.roomId && loginUserInfo.value?.userId) ? currentRoom.value.roomId : '');

watch(
  () => isPopupVisible.value,
  (isOpen) => {
    if (isOpen) {
      unreadCount.value = 0;
    }
  },
);

watch(
  CHAT_CHANNEL,
  () => {
    unreadCount.value = 0;
  },
);

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
