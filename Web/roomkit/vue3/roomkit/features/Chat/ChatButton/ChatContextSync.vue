<template>
  <!-- Keeps the IM group bound while this node stays mounted. -->
  <span class="chat-context-sync" hidden />
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-vue3/chat';
import { clearSenderNameCache } from '../RoomChatPC/useSenderName';
import { EDU_CLASS_EVENT_ID, EDU_TROPHY_EVENT_ID, isProtocolMessage } from '../customMessage';

const props = withDefaults(defineProps<{
  channel: string;
  isActive?: boolean;
  /** Member notices count as unread only here (they render only here). */
  isShowMemberNotice?: boolean;
}>(), {
  isActive: false,
  isShowMemberNotice: false,
});

const emit = defineEmits<{
  unreadChange: [count: number];
}>();

const { setActiveConversation, messageListOnEvent } = useChatContext(props.channel);
const unreadCount = ref(0);
let unsubscribeEvent: (() => void) | null = null;

function emitUnreadCount() {
  emit('unreadChange', unreadCount.value);
}

function resetUnreadTracking() {
  unreadCount.value = 0;
  emitUnreadCount();
}

function unsubscribeMessageEvent() {
  if (unsubscribeEvent) {
    unsubscribeEvent();
    unsubscribeEvent = null;
  }
}

function subscribeMessageEvent() {
  unsubscribeMessageEvent();
  unsubscribeEvent = messageListOnEvent((event) => {
    if (event.type !== 'onReceiveNewMessage') {
      return;
    }
    if (event.message.isSentBySelf || props.isActive) {
      return;
    }
    if (event.message.messageType === MessageType.Tips) {
      return;
    }
    // Trophy awards are pure celebration signals; they never bump the badge.
    if (isProtocolMessage(event.message, EDU_TROPHY_EVENT_ID)) {
      return;
    }
    // Member notices count as unread only in chats that opt in to show them.
    if (isProtocolMessage(event.message, EDU_CLASS_EVENT_ID) && !props.isShowMemberNotice) {
      return;
    }
    if (event.message.status === MessageStatus.Recalled || event.message.status === MessageStatus.Deleted) {
      return;
    }
    unreadCount.value += 1;
    emitUnreadCount();
  });
}

watch(
  () => props.channel,
  (channel) => {
    resetUnreadTracking();
    clearSenderNameCache();
    if (!channel) {
      setActiveConversation(undefined);
      unsubscribeMessageEvent();
      return;
    }
    setActiveConversation(`GROUP${channel}`);
    // No history pull here: MessageListStore subscribes to message events at
    // store creation, so the unread tally works once the conversation is
    // active; the visible list loads its own history in useMessageList.
    subscribeMessageEvent();
  },
  { immediate: true },
);

watch(
  () => props.isActive,
  (isOpen) => {
    if (isOpen) {
      unreadCount.value = 0;
      emitUnreadCount();
    }
  },
);

onUnmounted(() => {
  unsubscribeMessageEvent();
});
</script>
