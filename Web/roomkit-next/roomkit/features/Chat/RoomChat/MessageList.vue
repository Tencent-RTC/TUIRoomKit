<template>
  <div class="message-list">
    <TUIList
      v-if="historyReady"
      ref="listRef"
      class="message-list-scroller"
      variant="plain"
      item-size="auto"
      height="100%"
      :scrollbar="false"
      :item-height="72"
      :overscan="6"
      :stick-to-bottom="stickToBottom"
      :empty-text="emptyText"
      @scroll="onScroll"
    >
      <template #empty>
        <div class="message-list-empty">
          <IconChatEmpty :size="28" class="message-list-empty-icon" />
          <p class="message-list-empty-title">
            {{ emptyText }}
          </p>
          <p v-if="!loadError" class="message-list-empty-hint">
            {{ t('RoomChat.empty_hint') }}
          </p>
        </div>
      </template>
      <ChatMessage
        v-for="(message, index) in visibleMessages"
        :key="message.id"
        :message="message"
        :actions="actions"
        :channel="channel"
        :compact="isCompact(index)"
        @preview="onPreview"
      />
    </TUIList>
    <button
      v-if="showJumpToLatest"
      type="button"
      class="message-list-jump"
      :aria-label="t('RoomChat.jump_to_latest')"
      @click="jumpToLatest"
    >
      <IconChevron :size="14" />
    </button>
    <TUIDialog
      v-if="preview"
      :open="Boolean(preview)"
      :title="previewTitle"
      :confirm-text="''"
      :cancel-text="''"
      width="min(720px, calc(100% - 48px))"
      @update:open="onPreviewOpen"
    >
      <div
        class="message-list-preview-content"
        @wheel.prevent="onPreviewWheel"
      >
        <img
          v-if="preview.kind === 'image'"
          class="message-list-preview-image"
          :src="preview.src"
          alt=""
          draggable="false"
          :style="{ transform: `scale(${previewScale}) translate(${previewX}px, ${previewY}px)` }"
          @mousedown.prevent="onPreviewDragStart"
        >
        <video
          v-else-if="preview.kind === 'video'"
          class="message-list-preview-video"
          :src="preview.src"
          :poster="preview.poster"
          controls
          playsinline
          autoplay
        />
        <audio
          v-else
          class="message-list-preview-audio"
          :src="preview.src"
          controls
          autoplay
        />
      </div>
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, provide, ref, watch } from 'vue';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import { MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-vue3/chat';
import { IconChatEmpty, IconChevron, TUIDialog, TUIList } from '../../../base';
import { t } from '../../../base/i18n';
import ChatMessage from './ChatMessage.vue';
import type { ChatMediaPreview } from './mediaPreview';
import {
  ensureInitialHistory,
  historyWasPrepended,
  isInFlightMessage,
  keepInFlightAtEnd,
  shouldLoadOlderMessages,
  shouldPrefetchOlderHistory,
} from './messageListScroll';
import type { MessageAction } from './useMessageActions';
import { provideMessageOverlay } from './useMessageOverlay';

const props = withDefaults(defineProps<{
  channel?: string;
  messageActionList?: MessageAction[];
}>(), {
  channel: 'default',
  messageActionList: () => [],
});

const listRef = ref<{
  scrollTo: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToOffset: (offset: number) => void;
  scrollToKey: (key: PropertyKey, align?: 'start' | 'center' | 'end') => void;
  scrollToBottom: () => void;
  isNearBottom: () => boolean;
  distanceFromBottom: () => number;
  rowHeight: (key: PropertyKey) => number;
} | null>(null);

const stickToBottom = ref(true);
const latestHidden = ref(false);
const loadingOlder = ref(false);
const chatScrollTick = ref(false);
provide('chatScrollTick', chatScrollTick);
const loadError = ref(false);
const initializing = ref(false);
const historyReady = ref(false);
const preview = ref<ChatMediaPreview | null>(null);
const previewScale = ref(1);
const previewX = ref(0);
const previewY = ref(0);
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOriginX = 0;
let dragOriginY = 0;
let programmaticScroll = false;
const previewTitle = computed(() => {
  if (preview.value?.kind === 'video') return t('RoomChat.video_preview');
  if (preview.value?.kind === 'audio') return t('RoomChat.audio_preview');
  return t('RoomChat.image_preview');
});
let unsubscribeEvent: (() => void) | null = null;

const {
  activeConversationID,
  messageList,
  hasOlderMessages,
  loadMessages,
  loadOlderMessages,
  messageListOnEvent,
  clearConversationUnreadCount,
} = useChatContext(props.channel);

const overlay = provideMessageOverlay();
const actions = computed(() => props.messageActionList);
const visibleMessages = computed(() => {
  overlay.overlays.size;
  const messages = (messageList.value ?? []).filter((message) => {
    if (overlay.statusOf(message) === MessageStatus.Deleted) return false;
    if (message.messageType === MessageType.Tips) return false;
    return true;
  });
  return keepInFlightAtEnd(messages, message => (
    isInFlightMessage(message, overlay.statusOf(message))
  ));
});
const emptyText = computed(() => (
  loadError.value ? t('RoomChat.not_ready') : t('RoomChat.empty')
));
const showJumpToLatest = computed(() => (
  latestHidden.value && visibleMessages.value.length > 0
));
const MINUTE_MS = 60 * 1000;
const HISTORY_SUPPRESS_MS = 2000;
let suppressHistoryUntil = 0;

function withProgrammaticScroll(run: () => void) {
  programmaticScroll = true;
  run();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      programmaticScroll = false;
    });
  });
}

function isCompact(index: number) {
  const messages = visibleMessages.value;
  const current = messages[index];
  const previous = messages[index - 1];
  if (!current || !previous) {
    return false;
  }
  if (
    overlay.statusOf(current) === MessageStatus.Recalled
    || overlay.statusOf(previous) === MessageStatus.Recalled
  ) {
    return false;
  }
  if ((current.from?.userID || '') !== (previous.from?.userID || '')) {
    return false;
  }
  const currentTime = overlay.timestampOf(current)?.getTime() ?? 0;
  const previousTime = overlay.timestampOf(previous)?.getTime() ?? 0;
  return Math.floor(currentTime / MINUTE_MS) === Math.floor(previousTime / MINUTE_MS);
}

function isLatestMessageHidden() {
  const last = visibleMessages.value[visibleMessages.value.length - 1];
  if (!last) return false;
  const distance = listRef.value?.distanceFromBottom() ?? 0;
  const lastHeight = listRef.value?.rowHeight(last.id) ?? 72;
  return distance >= lastHeight;
}

function isNearBottom() {
  return listRef.value?.isNearBottom() ?? true;
}

function scrollToBottom() {
  if (!visibleMessages.value.length) return;
  withProgrammaticScroll(() => {
    listRef.value?.scrollToBottom();
  });
}

function jumpToLatest() {
  latestHidden.value = false;
  stickToBottom.value = true;
  scrollToBottom();
}

async function initialize() {
  if (initializing.value || !activeConversationID.value) {
    return;
  }
  loadError.value = false;
  stickToBottom.value = true;
  historyReady.value = false;
  initializing.value = true;
  try {
    await ensureInitialHistory(props.channel, loadMessages);
    let extraPages = 0;
    while (shouldPrefetchOlderHistory({
      loadedCount: messageList.value?.length ?? 0,
      hasOlder: hasOlderMessages.value,
      extraPages,
    })) {
      extraPages += 1;
      await loadOlderMessages();
    }
    historyReady.value = true;
    await nextTick();
    stickToBottom.value = true;
    scrollToBottom();
  } catch {
    loadError.value = true;
    historyReady.value = true;
  } finally {
    initializing.value = false;
  }
}

async function onScroll(offset: number) {
  if (initializing.value || programmaticScroll) {
    return;
  }
  chatScrollTick.value = !chatScrollTick.value;
  const nearBottom = isNearBottom();
  const distance = listRef.value?.distanceFromBottom() ?? 0;
  latestHidden.value = nearBottom ? false : isLatestMessageHidden();
  const hasInFlight = visibleMessages.value.some(message => (
    isInFlightMessage(message, overlay.statusOf(message))
  ));
  if (!shouldLoadOlderMessages({
    offset,
    nearBottom,
    distanceFromBottom: listRef.value?.distanceFromBottom() ?? 0,
    loading: loadingOlder.value,
    hasOlder: hasOlderMessages.value,
    hasInFlight,
    suppressed: Date.now() < suppressHistoryUntil,
  })) return;
  const anchor = visibleMessages.value[0]?.id;
  loadingOlder.value = true;
  try {
    await loadOlderMessages();
    await nextTick();
    if (historyWasPrepended(anchor, visibleMessages.value[0]?.id) && anchor) {
      withProgrammaticScroll(() => {
        listRef.value?.scrollToKey(anchor, 'start');
      });
    }
  } finally {
    loadingOlder.value = false;
  }
}

function handleNewMessage(message: MessageInfo) {
  if (message.messageType === MessageType.Tips) return;
  if (activeConversationID.value) {
    clearConversationUnreadCount(activeConversationID.value).catch(() => {});
  }
  if (message.isSentBySelf) {
    stickToBottom.value = true;
    latestHidden.value = false;
    suppressHistoryUntil = Date.now() + HISTORY_SUPPRESS_MS;
  }
  if (stickToBottom.value) {
    nextTick(scrollToBottom);
  }
}

function onPreview(payload: ChatMediaPreview) {
  preview.value = payload;
  previewScale.value = 1;
  previewX.value = 0;
  previewY.value = 0;
}

function onPreviewOpen(open: boolean) {
  if (!open) {
    preview.value = null;
    previewScale.value = 1;
    previewX.value = 0;
    previewY.value = 0;
  }
}

function onPreviewWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  previewScale.value = Math.min(5, Math.max(1, previewScale.value + delta));
  if (previewScale.value === 1) {
    previewX.value = 0;
    previewY.value = 0;
  }
}

function onPreviewDragStart(event: MouseEvent) {
  if (previewScale.value === 1) return;
  dragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragOriginX = previewX.value;
  dragOriginY = previewY.value;
  window.addEventListener('mousemove', onPreviewDragMove);
  window.addEventListener('mouseup', onPreviewDragEnd);
}

function onPreviewDragMove(event: MouseEvent) {
  if (!dragging) return;
  previewX.value = dragOriginX + (event.clientX - dragStartX) / previewScale.value;
  previewY.value = dragOriginY + (event.clientY - dragStartY) / previewScale.value;
}

function onPreviewDragEnd() {
  dragging = false;
  window.removeEventListener('mousemove', onPreviewDragMove);
  window.removeEventListener('mouseup', onPreviewDragEnd);
}

watch(activeConversationID, (conversationId) => {
  preview.value = null;
  if (unsubscribeEvent) {
    unsubscribeEvent();
    unsubscribeEvent = null;
  }
  if (!conversationId) return;
  unsubscribeEvent = messageListOnEvent((event) => {
    if (event.type === 'onReceiveNewMessage') handleNewMessage(event.message);
  });
  initialize();
}, { immediate: true });

onUnmounted(() => {
  preview.value = null;
  if (unsubscribeEvent) {
    unsubscribeEvent();
    unsubscribeEvent = null;
  }
});

defineExpose({
  scrollToBottom: (_behavior?: ScrollBehavior) => {
    stickToBottom.value = true;
    latestHidden.value = false;
    scrollToBottom();
  },
  closePreview: () => {
    preview.value = null;
  },
});
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
  font-size: 13px;
  font-weight: 500;
  line-height: 22px;
  color: var(--rk-text-secondary);
}

.message-list-empty-hint {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: var(--rk-text-tertiary);
}

.message-list-jump {
  position: absolute;
  right: 16px;
  bottom: 12px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 50%;
}

.message-list-jump:active {
  transform: scale(0.96);
}

.message-list-preview-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: min(70vh, 560px);
  overflow: hidden;
  touch-action: none;
  background: var(--rk-bg-muted);
  border-radius: var(--rk-radius-md);
}

.message-list-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  cursor: grab;
  transition: transform 0.05s linear;
}

.message-list-preview-image:active {
  cursor: grabbing;
}

.message-list-preview-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.message-list-preview-audio {
  display: block;
  width: 100%;
}
</style>
