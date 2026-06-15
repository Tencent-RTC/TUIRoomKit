<template>
  <!-- Context sync only. -->
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { useChatContext } from 'tuikit-atomicx-vue3/chat';

interface Props {
  channel: string;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
});

const emit = defineEmits<{
  (e: 'unreadChange', count: number): void;
}>();

const { setActiveConversation, messageListOnEvent, loadMessages } = useChatContext(props.channel);
const unreadCount = ref(0);
let unsubscribeEvent: (() => void) | null = null;

const emitUnreadCount = () => {
  emit('unreadChange', unreadCount.value);
};

const resetUnreadTracking = () => {
  unreadCount.value = 0;
  emitUnreadCount();
};

const unsubscribeMessageEvent = () => {
  if (unsubscribeEvent) {
    unsubscribeEvent();
    unsubscribeEvent = null;
  }
};

const subscribeMessageEvent = () => {
  unsubscribeMessageEvent();
  unsubscribeEvent = messageListOnEvent((event) => {
    if (event.type !== 'onReceiveNewMessage') {
      return;
    }
    if (event.message.isSentBySelf || props.isActive) {
      return;
    }
    unreadCount.value += 1;
    emitUnreadCount();
  });
};

const initializeMessageEventSource = () => {
  loadMessages().catch(() => {});
};

watch(
  () => props.channel,
  (channel) => {
    resetUnreadTracking();
    if (!channel) {
      setActiveConversation(undefined);
      unsubscribeMessageEvent();
      return;
    }
    setActiveConversation(`GROUP${channel}`);
    subscribeMessageEvent();
    initializeMessageEventSource();
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
  setActiveConversation(undefined);
  unsubscribeMessageEvent();
});
</script>
