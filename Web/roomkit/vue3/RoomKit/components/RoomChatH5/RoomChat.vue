<template>
  <div class="room-chat">
    <MessageList
      ref="messageListRef"
      class="room-message-list"
      :messageActionList="messageActionList"
      :Message="CustomMessage"
      @click="handleMessageListClick"
    />
    <MessageInputH5
      ref="messageInputRef"
      class="room-message-input"
      :placeholder="placeholder"
      :disabled="localParticipant?.isMessageDisabled"
      @input-area-expand="handleInputAreaExpand"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { MessageList, MessageInputH5, useMessageActions } from 'tuikit-atomicx-vue3/chat';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import CustomMessage from './CustomMessage.vue';

const messageListRef = ref<InstanceType<typeof MessageList> | null>(null);
const messageInputRef = ref<InstanceType<typeof MessageInputH5> | null>(null);

const { t } = useUIKit();
const { localParticipant } = useRoomParticipantState();
const placeholder = computed(() =>
  localParticipant.value?.isMessageDisabled
    ? t('RoomChat.disabled_placeholder')
    : t('RoomChat.input_placeholder'),
);
const messageActionList = useMessageActions(['copy', 'recall', 'delete']);

function handleInputAreaExpand() {
  messageListRef.value?.scrollToBottom({ behavior: 'instant' });
}

function handleMessageListClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.message-bubble')) {
    messageInputRef.value?.collapsePanel();
  }
}
</script>

<style lang="scss" scoped>
.room-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;

  .room-message-list {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--stroke-color-secondary);
    padding: 12px 8px;
  }

  .room-message-input {
    flex-shrink: 0;
  }
}
</style>
