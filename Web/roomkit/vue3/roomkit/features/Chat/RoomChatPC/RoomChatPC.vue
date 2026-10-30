<template>
  <div v-if="canUseChatContext" :key="channel" class="chat-panel">
    <!-- Scene chrome (the education title bar) rides in through the slot;
         the panel itself stays scene-agnostic. -->
    <slot name="header" />
    <MessageList
      class="chat-panel-list"
      :channel="channel"
      :message-action-list="messageActionList"
      :is-show-member-notice="isShowMemberNotice"
      :is-hide-timestamp="isHideTimestamp"
      :is-highlight-owner="isHighlightOwner"
    >
      <template v-if="$slots.meta" #meta="slotProps">
        <slot name="meta" v-bind="slotProps" />
      </template>
    </MessageList>
    <MessageInput
      class="chat-panel-input"
      :channel="channel"
      :placeholder="placeholder"
      :disabled="inputDisabled"
      :is-hide-operator="isHideOperator"
    />
    <!-- The classroom panel has no ChatButton, so it binds the IM group itself:
         activates the conversation so the list loads, and marks it read. -->
    <ChatContextSync :channel="channel" is-active :is-show-member-notice="isShowMemberNotice" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { t } from '../../../base';
import MessageInput from './MessageInput.vue';
import MessageList from './MessageList.vue';
import ChatContextSync from '../ChatButton/ChatContextSync.vue';
import { provideChatComposer } from './useChatComposer';
import { useMessageActions } from './useMessageActions';

const props = withDefaults(defineProps<{
  /** Whether member notices render here and count as unread. */
  isShowMemberNotice?: boolean;
  /** Hides the composer's toolbar row. */
  isHideOperator?: boolean;
  /** Hides message timestamps. */
  isHideTimestamp?: boolean;
  /** Tints the room owner's bubbles with the self-message accent. */
  isHighlightOwner?: boolean;
  /** Composer placeholder; the room default applies when unset. */
  placeholder?: string;
}>(), {
  isShowMemberNotice: false,
  isHideOperator: false,
  isHideTimestamp: false,
  isHighlightOwner: false,
  placeholder: undefined,
});

const { localParticipant } = useRoomParticipantState();
const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();

const channel = computed(() => currentRoom.value?.roomId || '');
const canUseChatContext = computed(() => Boolean(currentRoom.value?.roomId && loginUserInfo.value?.userId));
const isHostOrAdmin = computed(() => {
  const role = localParticipant.value?.role as number | undefined;
  return role === 0 || role === 1;
});
const inputDisabled = computed(() => (
  Boolean(localParticipant.value?.isMessageDisabled)
  || Boolean(currentRoom.value?.isAllMessageDisabled && !isHostOrAdmin.value)
));
const placeholder = computed(() => {
  if (inputDisabled.value) return t('RoomChat.disabled_placeholder');
  return props.placeholder ?? t('RoomChat.input_placeholder');
});

const messageActionList = useMessageActions();

provideChatComposer();
</script>

<style scoped lang="scss">
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.chat-panel-list {
  flex: 1;
  min-height: 0;
  padding: 4px 12px 0;
  overflow: hidden;
}

.chat-panel-input {
  flex-shrink: 0;
}
</style>
