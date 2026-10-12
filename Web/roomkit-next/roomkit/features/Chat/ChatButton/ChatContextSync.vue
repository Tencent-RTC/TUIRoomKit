<template>
  <!-- Keeps the IM group bound while this node stays mounted. -->
  <span class="chat-context-sync" hidden />
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-vue3/chat';
import { ensureInitialHistory } from '../RoomChat/messageListScroll';
import { clearSenderNameCache } from '../RoomChat/useSenderName';

const props = withDefaults(defineProps<{
  channel: string;
  isActive?: boolean;
}>(), {
  isActive: false,
});

const emit = defineEmits<{
  unreadChange: [count: number];
}>();

const { setActiveConversation, messageListOnEvent, loadMessages } = useChatContext(props.channel);
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
    void ensureInitialHistory(channel, loadMessages).catch(() => {});
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
