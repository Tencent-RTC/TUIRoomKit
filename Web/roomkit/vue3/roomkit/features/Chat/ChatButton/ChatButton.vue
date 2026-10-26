<template>
  <div class="chat-button">
    <ToolbarButtonPC
      :label="t('Chat.Title')"
      :active="active"
      @click="$emit('click')"
    >
      <template #icon>
        <TUIBadge :value="unreadCount" :hidden="!unreadCount">
          <IconChat :size="22" />
        </TUIBadge>
      </template>
    </ToolbarButtonPC>
    <ChatContextSync
      v-if="channel"
      :key="channel"
      :channel="channel"
      :is-active="isChatActive"
      @unread-change="unreadCount = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { IconChat, TUIBadge, t } from '../../../base';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import ChatContextSync from './ChatContextSync.vue';

const props = withDefaults(defineProps<{
  active?: boolean;
  isChatActive?: boolean;
}>(), {
  active: false,
  isChatActive: undefined,
});

defineEmits<{ click: [] }>();

const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();
const unreadCount = ref(0);
const isChatActive = computed(() => props.isChatActive ?? props.active);
const channel = computed(() => (
  currentRoom.value?.roomId && loginUserInfo.value?.userId
    ? currentRoom.value.roomId
    : ''
));

watch(
  isChatActive,
  (isOpen) => {
    if (isOpen) {
      unreadCount.value = 0;
    }
  },
);

watch(channel, () => {
  unreadCount.value = 0;
});
</script>

<style scoped lang="scss">
.chat-button {
  display: inline-flex;
}
</style>
