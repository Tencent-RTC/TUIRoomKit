<template>
  <div class="room-chat">
    <MessageList
      ref="messageListRef"
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
import { computed, ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  MessageInput,
  MessageList,
  useMessageActions,
} from 'tuikit-atomicx-vue3/chat';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import CustomMessage from './CustomMessage.vue';

interface Props {
  isChatOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isChatOpen: false,
});

const messageListRef = ref<InstanceType<typeof MessageList> | null>(null);
const { t } = useUIKit();
const { localParticipant } = useRoomParticipantState();
const placeholder = computed(() =>
  localParticipant.value?.isMessageDisabled
    ? t('RoomChat.disabled_placeholder')
    : t('RoomChat.input_placeholder'),
);
const messageActionList = useMessageActions(['copy', 'recall', 'delete']);

watch(() => props.isChatOpen, (newVal, oldVal) => {
  if (newVal && !oldVal && messageListRef.value) {
    messageListRef.value?.scrollToBottom({ behavior: 'instant' });
  }
});
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
