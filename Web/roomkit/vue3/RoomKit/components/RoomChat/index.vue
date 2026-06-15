<template>
  <div class="room-chat">
    <template v-if="canUseChatContext">
      <MessageList
        ref="messageListRef"
        class="room-message-list"
        :channel="CHAT_CHANNEL"
        :messageActionList="messageActionList"
        :Message="CustomMessage"
      />
      <MessageInput
        class="room-message-input"
        :channel="CHAT_CHANNEL"
        hideSendButton
        :actions="['EmojiPicker','ImagePicker','FilePicker','VideoPicker']"
        :placeholder="placeholder"
        :disabled="localParticipant?.isMessageDisabled"
      />
    </template>
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
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import CustomMessage from './CustomMessage.vue';

interface Props {
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
});

const messageListRef = ref<InstanceType<typeof MessageList> | null>(null);
const { t } = useUIKit();
const { localParticipant } = useRoomParticipantState();
const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();
const CHAT_CHANNEL = computed(() => currentRoom.value?.roomId || '');
const canUseChatContext = computed(() => Boolean(currentRoom.value?.roomId && loginUserInfo.value?.userId));
const placeholder = computed(() =>
  localParticipant.value?.isMessageDisabled
    ? t('RoomChat.disabled_placeholder')
    : t('RoomChat.input_placeholder'),
);
const messageActionList = computed(() => useMessageActions(['copy', 'recall', 'delete'], CHAT_CHANNEL.value));

watch(() => props.isActive, (newVal, oldVal) => {
  if (newVal && !oldVal && messageListRef.value) {
    messageListRef.value?.scrollToBottom('instant');
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
