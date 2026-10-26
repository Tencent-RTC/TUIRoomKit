<template>
  <div class="chat-button-mobile">
    <ToolbarButtonMobile
      :label="t('Chat.Title')"
      :active="active"
      :pressed="active"
      @click="$emit('click')"
    >
      <TUIBadge :value="unreadCount" :hidden="!unreadCount">
        <IconChat :size="20" />
      </TUIBadge>
    </ToolbarButtonMobile>
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
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';
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
.chat-button-mobile {
  display: inline-flex;
}
</style>
