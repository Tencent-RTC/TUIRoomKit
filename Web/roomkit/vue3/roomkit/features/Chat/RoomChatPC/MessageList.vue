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
      jump-to-end
      :jump-label="t('RoomChat.jump_to_latest')"
      :empty-text="emptyText"
      @scroll="onScroll"
    >
      <template #empty>
        <div class="message-list-empty">
          <IconChatEmpty :size="28" class="message-list-empty-icon" />
          <p class="message-list-empty-title">
            {{ emptyText }}
          </p>
          <p class="message-list-empty-hint">
            {{ t('RoomChat.empty_hint') }}
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
  </div>
</template>

<script setup lang="ts">
import { IconChatEmpty, TUIList, t } from '../../../base';
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
  /** Tints the room owner's bubbles with the self-message accent. */
  isHighlightOwner?: boolean;
}>(), {
  channel: 'default',
  messageActionList: () => [],
  mobile: false,
  isShowMemberNotice: false,
  isHideTimestamp: false,
  isHighlightOwner: false,
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
  width: 28px;
  height: 28px;
  margin-bottom: 6px;
  color: var(--rk-text-disabled);
}

.message-list-empty-title {
  margin: 0;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  line-height: 22px;
  color: var(--rk-text-secondary);
}

.message-list-empty-hint {
  margin: 4px 0 0;
  font-size: var(--rk-fs-sm);
  line-height: 18px;
  color: var(--rk-text-tertiary);
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

.message-list-mobile .message-list-empty-hint {
  line-height: 16px;
}
</style>
