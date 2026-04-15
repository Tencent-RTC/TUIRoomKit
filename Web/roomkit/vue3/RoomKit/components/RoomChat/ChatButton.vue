<template>
  <IconButton :title="t('Chat.Title')" @click-icon="handleClick">
    <Badge :value="unreadCount" :hidden="!unreadCount">
      <IconChat :size="24" />
    </Badge>
  </IconButton>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import {
  IconChat,
  useUIKit,
  Badge,
} from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState, useMessageListState } from 'tuikit-atomicx-vue3/chat';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

interface Props {
  isActive?: boolean;
  togglePanel?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  togglePanel: undefined,
});

const { t } = useUIKit();

const { setActiveConversation } = useConversationListState();
const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();
const { messageList } = useMessageListState();

const unreadCount = ref(0);
const hasInitializedMessageList = ref(false);

const resetUnreadTracking = () => {
  unreadCount.value = 0;
  hasInitializedMessageList.value = false;
};

watch(
  messageList,
  (newMessageList, oldMessageList) => {
    const currentMessageList = newMessageList || [];

    if (!hasInitializedMessageList.value) {
      hasInitializedMessageList.value = true;
      return;
    }

    if (props.isActive) {
      return;
    }

    const previousLength = oldMessageList?.length || 0;
    if (currentMessageList.length <= previousLength) {
      return;
    }

    const unreadMessages = currentMessageList
      .slice(previousLength)
      .filter(message => message?.from !== loginUserInfo.value?.userId);

    unreadCount.value += unreadMessages.length;
  },
  { deep: false },
);

watch(
  () => props.isActive,
  (isOpen) => {
    if (isOpen) {
      unreadCount.value = 0;
    }
  },
);

watch(
  () => currentRoom.value?.roomId,
  (roomId) => {
    resetUnreadTracking();
    if (!roomId) {
      setActiveConversation('');
      return;
    }
    setActiveConversation(`GROUP${roomId}`);
  },
  { immediate: true },
);

onUnmounted(() => {
  setActiveConversation('');
});

const handleClick = () => {
  unreadCount.value = 0;
  props.togglePanel?.();
};
</script>
