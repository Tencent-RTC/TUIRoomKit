import { computed, nextTick, onUnmounted, provide, ref, toRef, watch } from 'vue';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import { MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-vue3/chat';
import { t } from '../../../base';
import {
  historyWasPrepended,
  isInFlightMessage,
  keepInFlightAtEnd,
  shouldLoadOlderMessages,
  shouldPrefetchOlderHistory,
} from './messageListScroll';
import type { MessageAction } from './useMessageActions';
import { provideMessageOverlay } from './useMessageOverlay';

export interface MessageListProps {
  readonly channel: string;
  readonly messageActionList: readonly MessageAction[];
}

export function useMessageList(props: MessageListProps) {
  const listRef = ref<{
    scrollToKey: (key: PropertyKey, align?: 'start' | 'center' | 'end') => void;
    scrollToBottom: () => void;
    isNearBottom: () => boolean;
    distanceFromBottom: () => number;
    rowHeight: (key: PropertyKey) => number;
  } | null>(null);

  const stickToBottom = ref(true);
  const loadingOlder = ref(false);
  const chatScrollTick = ref(false);
  provide('chatScrollTick', chatScrollTick);
  const loadError = ref(false);
  const initializing = ref(false);
  const historyReady = ref(false);
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
  const actions = toRef(props, 'messageActionList');
  const visibleMessages = computed(() => {
    // Read the map size so this computed refreshes when an overlay is patched.
    Number(overlay.overlays.size);
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
  const MINUTE_MS = 60 * 1000;
  const HISTORY_SUPPRESS_MS = 2000;
  let suppressHistoryUntil = 0;

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

  function isNearBottom() {
    return listRef.value?.isNearBottom() ?? true;
  }

  function scrollToBottom() {
    if (!visibleMessages.value.length) return;
    listRef.value?.scrollToBottom();
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
      await loadMessages();
      let extraPages = 0;
      while (shouldPrefetchOlderHistory({
        loadedCount: messageList.value?.length ?? 0,
        hasOlder: hasOlderMessages.value,
        extraPages,
      })) {
        extraPages += 1;
        // Each page advances the history cursor, so the next page waits for this one.
        // eslint-disable-next-line no-await-in-loop
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
    if (initializing.value) {
      return;
    }
    chatScrollTick.value = !chatScrollTick.value;
    const nearBottom = isNearBottom();
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
        listRef.value?.scrollToKey(anchor, 'start');
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
      suppressHistoryUntil = Date.now() + HISTORY_SUPPRESS_MS;
    }
    if (stickToBottom.value) {
      nextTick(scrollToBottom);
    }
  }

  watch(activeConversationID, (conversationId) => {
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
    if (unsubscribeEvent) {
      unsubscribeEvent();
      unsubscribeEvent = null;
    }
  });

  return {
    historyReady,
    listRef,
    stickToBottom,
    emptyText,
    visibleMessages,
    actions,
    onScroll,
    isCompact,
  };
}
