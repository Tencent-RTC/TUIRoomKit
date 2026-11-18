import { computed, nextTick, onUnmounted, provide, ref, toRef, watch } from 'vue';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import { MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-vue3/chat';
import { t } from '../../../base';
import { EDU_CLASS_EVENT_ID, isProtocolMessage } from '../customMessage';
import { isHiddenProtocolMessage, shouldHideMemberNotice } from './memberNotice';
import {
  historyWasPrepended,
  isInFlightMessage,
  keepInFlightAtEnd,
  shouldLoadOlderMessages,
  shouldPrefetchOlderHistory,
} from './messageListScroll';
import type { MessageAction } from './useMessageActions';

export interface MessageListProps {
  readonly channel: string;
  readonly messageActionList: readonly MessageAction[];
  /** Whether member notices render in this list. */
  readonly isShowMemberNotice?: boolean;
  /** The panel just became visible, so the list should land on the latest row. */
  readonly active?: boolean;
}

export function useMessageList(props: MessageListProps) {
  const listRef = ref<{
    scrollToKey: (key: PropertyKey, align?: 'start' | 'center' | 'end') => void;
    scrollToBottom: () => void;
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

  const actions = toRef(props, 'messageActionList');
  const visibleMessages = computed(() => {
    const messages = (messageList.value ?? []).filter((message) => {
      if (message.status === MessageStatus.Deleted) return false;
      if (message.messageType === MessageType.Tips) return false;
      // A protocol row is inserted locally before the group accepts it.
      // Rendering that notice before SendSuccess would claim a class change
      // that has not happened, including when the send later fails.
      if (message.messageType === MessageType.Custom && message.status !== MessageStatus.SendSuccess) {
        return false;
      }
      // Member notices render only in chats that opt in; the sender's own
      // enter and leave lines stay hidden (see shouldHideMemberNotice for why).
      if (isProtocolMessage(message, EDU_CLASS_EVENT_ID)
        && (!props.isShowMemberNotice || shouldHideMemberNotice(message, EDU_CLASS_EVENT_ID))) return false;
      if (isHiddenProtocolMessage(message)) return false;
      return true;
    });
    return keepInFlightAtEnd(messages, message => (
      isInFlightMessage(message, message.status)
    ));
  });
  const emptyText = computed(() => (
    loadError.value ? t('RoomChat.not_ready') : t('RoomChat.empty')
  ));
  const HISTORY_SUPPRESS_MS = 2000;
  let suppressHistoryUntil = 0;

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
    const hasInFlight = visibleMessages.value.some(message => (
      isInFlightMessage(message, message.status)
    ));
    if (!shouldLoadOlderMessages({
      offset,
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
      if (historyWasPrepended(anchor, visibleMessages.value[0]?.id)) {
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

  // A hidden list cannot pin: clientHeight is 0, so a message that arrived
  // while the panel was closed leaves the scroller short of the new bottom.
  watch(() => props.active, (isOpen) => {
    if (!isOpen) return;
    stickToBottom.value = true;
    nextTick(() => {
      requestAnimationFrame(() => scrollToBottom());
    });
  });

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
  };
}
