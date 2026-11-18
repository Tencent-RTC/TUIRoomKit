<template>
  <div class="message-list" :class="{ 'message-list-mobile': mobile }">
    <TUIList
      v-if="historyReady"
      ref="listRef"
      v-model:stick-to-bottom="stickToBottom"
      class="message-list-scroller"
      variant="plain"
      item-size="auto"
      height="100%"
      :scrollbar="false"
      :item-height="72"
      :overscan="6"
      :jump-to-end="!showNewMessages"
      :jump-label="t('RoomChat.jump_to_latest')"
      :empty-text="emptyText"
      @scroll="onScroll"
    >
      <template #empty>
        <div class="message-list-empty">
          <IconChatEmpty class="message-list-empty-icon" />
          <p class="message-list-empty-title">
            {{ emptyText }}
          </p>
        </div>
      </template>
      <ChatMessage
        v-for="message in visibleMessages"
        :key="message.id"
        :message="message"
        :actions="actions"
        :mobile="mobile"
        :is-hide-timestamp="isHideTimestamp"
        :is-highlight-owner="isHighlightOwner"
      >
        <template v-if="$slots.meta" #meta="slotProps">
          <slot name="meta" v-bind="slotProps" />
        </template>
      </ChatMessage>
    </TUIList>
    <!-- Replaces the list's circle jump control while unread rows wait below. -->
    <button
      v-if="showNewMessages"
      type="button"
      class="message-list-new-messages"
      :aria-label="t('RoomChat.jump_to_latest')"
      @click="jumpToNewMessages"
    >
      <span>{{ newMessageLabel }}</span>
      <IconCollapse :size="12" />
    </button>
    <!-- The pill tally rides the same counter the chat badges use, with
         "watching" meaning the list is pinned to the bottom: rows that land
         while the reader is scrolled away count, reaching the bottom clears. -->
    <ChatContextSync
      v-if="isShowNewMessages"
      :channel="channel"
      :is-active="stickToBottom"
      @unread-change="newMessageCount = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IconChatEmpty, IconCollapse, TUIList, t } from '../../../base';
import ChatContextSync from '../ChatButton/ChatContextSync.vue';
import ChatMessage from './ChatMessage.vue';
import { useMessageList } from './useMessageList';
import type { MessageAction } from './useMessageActions';

const props = withDefaults(defineProps<{
  channel?: string;
  messageActionList?: MessageAction[];
  mobile?: boolean;
  /** Whether member notices render in this list. */
  isShowMemberNotice?: boolean;
  /** Hides each message's timestamp. */
  isHideTimestamp?: boolean;
  /** The panel is on screen. Opening it pins the list to the latest message. */
  active?: boolean;
  /** Tints the room owner's bubbles with the self-message accent. */
  isHighlightOwner?: boolean;
  /** Swaps the jump circle for an "N new messages" pill while rows land unread. */
  isShowNewMessages?: boolean;
}>(), {
  channel: 'default',
  messageActionList: () => [],
  mobile: false,
  isShowMemberNotice: false,
  isHideTimestamp: false,
  active: false,
  isHighlightOwner: false,
  isShowNewMessages: false,
});

const {
  historyReady,
  listRef,
  stickToBottom,
  emptyText,
  visibleMessages,
  actions,
  onScroll,
} = useMessageList(props);

const newMessageCount = ref(0);
const showNewMessages = computed(() => props.isShowNewMessages && newMessageCount.value > 0);
const newMessageLabel = computed(() => (
  t('RoomChat.new_messages', { count: newMessageCount.value > 99 ? '99+' : newMessageCount.value })
));

function jumpToNewMessages() {
  // Reaching the bottom clears the tally; the pin lands the reader on them.
  stickToBottom.value = true;
  listRef.value?.scrollToBottom();
}
</script>

<style scoped lang="scss">
.message-list {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.message-list-scroller {
  height: 100%;
}

.message-list-scroller :deep(.rk-list-scroller) {
  display: flex;
  flex-direction: column;
}

.message-list-scroller :deep(.rk-list-empty) {
  flex: 1;
  min-height: 0;
}

.message-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  text-align: center;
}

.message-list-empty-icon {
  width: 88px;
  height: 70px;
  margin-bottom: 10px;
}

.message-list-empty-title {
  margin: 0;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  line-height: 22px;
  color: var(--rk-text-secondary);
}

.message-list-mobile {
  padding: 10px 12px;
}

.message-list-mobile .message-list-scroller :deep(.rk-list-row) {
  align-items: flex-start;
  width: 100%;
}

.message-list-mobile .message-list-empty {
  min-height: max(180px, 100%);
}

.message-list-mobile .message-list-empty-title {
  line-height: 1.3;
}

/* The pill replaces the list's round jump button while unread rows wait
   below (views-edu rk-chat-jump.is-count): a solid chip on the chat's
   left edge, accent text with a 12px chevron, popping in from below. */
.message-list-new-messages {
  position: absolute;
  bottom: 12px;
  left: 16px;
  z-index: 6;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 28px;
  padding: 0 12px 0 14px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 26px;
  color: var(--rk-brand);
  white-space: nowrap;
  cursor: pointer;
  background: var(--rk-bg-raised);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 2px 8px color-mix(in srgb, #1c1b1c 18%, transparent);
  animation: message-list-new-messages-in 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

[data-rk-theme='dark'] .message-list-new-messages {
  box-shadow: 0 2px 8px color-mix(in srgb, #000 18%, transparent);
}

.message-list-new-messages:active {
  transform: scale(0.96);
}

@keyframes message-list-new-messages-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
</style>
