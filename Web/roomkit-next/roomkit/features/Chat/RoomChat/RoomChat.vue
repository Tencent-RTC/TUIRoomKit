<template>
  <div v-if="canUseChatContext" :key="channel" class="chat-panel">
    <MessageList
      ref="messageListRef"
      class="chat-panel-list"
      :channel="channel"
      :message-action-list="messageActionList"
    />
    <MessageInput
      class="chat-panel-input"
      :channel="channel"
      :placeholder="placeholder"
      :disabled="inputDisabled"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { TUIToast } from '../../../base';
import { t } from '../../../base/i18n';
import MessageInput from './MessageInput.vue';
import MessageList from './MessageList.vue';
import { provideChatComposer } from './useChatComposer';
import { useMessageActions } from './useMessageActions';

const props = withDefaults(defineProps<{
  isActive?: boolean;
}>(), {
  isActive: false,
});

const messageListRef = ref<{
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  closePreview: () => void;
} | null>(null);
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
const messageActionList = useMessageActions(['copy', 'recall', 'delete']);
provideChatComposer();

watch(() => localParticipant.value?.isMessageDisabled, (muted, wasMuted) => {
  if (wasMuted == null || muted === wasMuted) return;
  TUIToast.info(muted ? t('RoomChat.muted_toast') : t('RoomChat.unmuted_toast'));
});

watch(() => currentRoom.value?.isAllMessageDisabled, (muted, wasMuted) => {
  if (wasMuted == null || muted === wasMuted) return;
  TUIToast.info(muted ? t('RoomChat.all_muted_toast') : t('RoomChat.all_unmuted_toast'));
});

watch(() => props.isActive, (isOpen) => {
  if (!isOpen) {
    messageListRef.value?.closePreview();
  }
});
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
