<template>
  <div class="room-chat">
    <MessageList
      class="room-message-list"
      :messageActionList="messageActionList"
      :Message="CustomMessage"
    />
    <MessageInput
      class="room-message-input"
      hideSendButton
      :placeholder="placeholder"
      :disabled="localParticipant?.isMessageDisabled"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  MessageInput,
  MessageList,
  useMessageActions,
} from 'tuikit-atomicx-vue3/chat';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import CustomMessage from './CustomMessage.vue';

const { t } = useUIKit();
const { localParticipant } = useRoomParticipantState();
const placeholder = computed(() =>
  localParticipant.value?.isMessageDisabled
    ? t('RoomChat.disabled_placeholder')
    : t('RoomChat.input_placeholder'),
);
const messageActionList = useMessageActions(['copy', 'recall', 'delete']);
</script>

<style lang="scss" scoped>
.room-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
  padding: 8px;

  .room-message-list {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .room-message-input {
    flex-shrink: 0;
    border: 1px solid var(--stroke-color-secondary);
    border-radius: 8px;
  }
}
</style>
