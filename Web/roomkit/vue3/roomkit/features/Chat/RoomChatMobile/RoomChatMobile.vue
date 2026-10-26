<template>
  <div v-if="canUseChatContext" :key="channel" class="chat-panel" @dblclick.stop>
    <MessageList
      class="chat-panel-list"
      mobile
      :channel="channel"
      :message-action-list="messageActionList"
    />
    <MessageInput
      class="chat-panel-input"
      :channel="channel"
      :placeholder="placeholder"
      :disabled="inputDisabled"
      :active="isActive"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { TUIToast, t } from '../../../base';
import MessageList from '../RoomChatPC/MessageList.vue';
import { provideChatComposer } from '../RoomChatPC/useChatComposer';
import { useMessageActions } from '../RoomChatPC/useMessageActions';
import MessageInput from './MessageInput.vue';

const props = withDefaults(defineProps<{
  isActive?: boolean;
}>(), {
  isActive: false,
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
const placeholder = computed(() => (
  inputDisabled.value ? t('RoomChat.disabled_placeholder') : t('RoomChat.input_placeholder')
));
const messageActionList = useMessageActions();
provideChatComposer();

watch(() => localParticipant.value?.isMessageDisabled, (muted, wasMuted) => {
  if (wasMuted == null || muted === wasMuted) return;
  TUIToast.info(muted ? t('RoomChat.muted_toast') : t('RoomChat.unmuted_toast'));
});

watch(() => currentRoom.value?.isAllMessageDisabled, (muted, wasMuted) => {
  if (wasMuted == null || muted === wasMuted) return;
  TUIToast.info(muted ? t('RoomChat.all_muted_toast') : t('RoomChat.all_unmuted_toast'));
});
</script>

<style scoped lang="scss">
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--rk-text-primary);

  /* A second tap must not be waited on, or the first tap only dismisses the keyboard. */
  touch-action: manipulation;
}

.chat-panel-list {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chat-panel-input {
  flex-shrink: 0;
}
</style>
