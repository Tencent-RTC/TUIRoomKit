<template>
  <IconButton :title="t('Chat.Title')" @click-icon="handleClick">
    <Badge :value="unreadCount" :hidden="!unreadCount">
      <IconChat :size="24" />
    </Badge>
  </IconButton>
  <ChatContextSync
    v-if="CHAT_CHANNEL"
    :key="CHAT_CHANNEL"
    :channel="CHAT_CHANNEL"
    :is-active="props.isActive"
    @unread-change="unreadCount = $event"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IconChat,
  useUIKit,
  Badge,
} from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';
import ChatContextSync from './ChatContextSync.vue';

interface Props {
  isActive?: boolean;
  togglePanel?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  togglePanel: undefined,
});

const { t } = useUIKit();

const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();

const unreadCount = ref(0);
const CHAT_CHANNEL = computed(() => (currentRoom.value?.roomId && loginUserInfo.value?.userId) ? currentRoom.value.roomId : '');

watch(
  () => props.isActive,
  (isOpen) => {
    if (isOpen) {
      unreadCount.value = 0;
    }
  },
);

watch(
  CHAT_CHANNEL,
  () => {
    unreadCount.value = 0;
  },
);

const handleClick = () => {
  unreadCount.value = 0;
  props.togglePanel?.();
};
</script>
