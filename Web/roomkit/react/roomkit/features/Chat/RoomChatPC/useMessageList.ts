import { createContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { MessageInfo } from 'tuikit-atomicx-react/chat';
import { MessageStatus, MessageType, getChannel, useChatContext } from 'tuikit-atomicx-react/chat';
import { t } from '../../../base/i18n';
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

export interface MessageListProps {
  readonly channel: string;
  readonly messageActionList: readonly MessageAction[];
}

/** Provided by MessageList; toggles on every user scroll so open message menus can close. */
export const CHAT_SCROLL_TICK_KEY = createContext(false);

type ListHandle = {
  scrollTo: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToOffset: (offset: number) => void;
  scrollToKey: (key: PropertyKey, align?: 'start' | 'center' | 'end') => void;
  scrollToBottom: () => void;
  isNearBottom: () => boolean;
  distanceFromBottom: () => number;
  rowHeight: (key: PropertyKey) => number;
};

const MINUTE_MS = 60 * 1000;
const HISTORY_SUPPRESS_MS = 2000;

export function useMessageList(props: MessageListProps) {
  const listRef = useRef<ListHandle | null>(null);

  const [stickToBottomState, setStickToBottomState] = useState(true);
  const stickToBottomRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const [chatScrollTick, setChatScrollTick] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const initializingRef = useRef(false);
  const [historyReady, setHistoryReady] = useState(false);
  const local = useRef({
    suppressHistoryUntil: 0,
    unsubscribeEvent: null as (() => void) | null,
  }).current;

  const {
    activeConversationID,
    messageList,
    loadMessages,
    loadOlderMessages,
    messageListOnEvent,
    clearConversationUnreadCount,
  } = useChatContext(props.channel);

  /** Live channel state for async code that runs between renders. */
  function liveContext() {
    return getChannel(props.channel).getSnapshot();
  }

  const overlay = provideMessageOverlay();
  const actions = props.messageActionList;
  const visibleMessages = useMemo(() => {
    const messages = (messageList ?? []).filter((message) => {
      if (overlay.statusOf(message) === MessageStatus.Deleted) return false;
      if (message.messageType === MessageType.Tips) return false;
      return true;
    });
    return keepInFlightAtEnd(messages, message => (
      isInFlightMessage(message, overlay.statusOf(message))
    ));
  }, [messageList, overlay]);
  const visibleMessagesRef = useRef(visibleMessages);
  visibleMessagesRef.current = visibleMessages;
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  const emptyText = loadError ? t('RoomChat.not_ready') : t('RoomChat.empty');

  function setStickToBottom(value: boolean) {
    stickToBottomRef.current = value;
    setStickToBottomState(value);
  }

  function isCompact(index: number) {
    const messages = visibleMessages;
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
    return listRef.current?.isNearBottom() ?? true;
  }

  function scrollToBottom() {
    if (!visibleMessagesRef.current.length) return;
    listRef.current?.scrollToBottom();
  }

  // Resolves after the next commit, like Vue nextTick after a render flush.
  const [, forceTickRender] = useReducer((n: number) => n + 1, 0);
  const tickQueueRef = useRef<Array<() => void>>([]);
  function nextTick(cb: () => void): Promise<void> {
    return new Promise((resolve) => {
      tickQueueRef.current.push(() => {
        cb();
        resolve();
      });
      forceTickRender();
    });
  }
  useLayoutEffect(() => {
    if (tickQueueRef.current.length === 0) {
      return;
    }
    const queue = tickQueueRef.current.splice(0);
    queue.forEach(cb => cb());
  });

  async function initialize() {
    if (initializingRef.current || !liveContext().activeConversationID) {
      return;
    }
    setLoadError(false);
    setStickToBottom(true);
    setHistoryReady(false);
    initializingRef.current = true;
    try {
      await ensureInitialHistory(props.channel, loadMessages);
      let extraPages = 0;
      while (shouldPrefetchOlderHistory({
        loadedCount: liveContext().messageList?.length ?? 0,
        hasOlder: liveContext().hasOlderMessages,
        extraPages,
      })) {
        extraPages += 1;
        // Each page advances the history cursor, so the next page waits for this one.
        // eslint-disable-next-line no-await-in-loop
        await loadOlderMessages();
      }
      setHistoryReady(true);
      await nextTick(() => {});
      setStickToBottom(true);
      scrollToBottom();
    } catch {
      setLoadError(true);
      setHistoryReady(true);
    } finally {
      initializingRef.current = false;
    }
  }

  async function onScroll(offset: number) {
    if (initializingRef.current) {
      return;
    }
    setChatScrollTick(value => !value);
    const nearBottom = isNearBottom();
    const currentOverlay = overlayRef.current;
    const hasInFlight = visibleMessagesRef.current.some(message => (
      isInFlightMessage(message, currentOverlay.statusOf(message))
    ));
    if (!shouldLoadOlderMessages({
      offset,
      nearBottom,
      distanceFromBottom: listRef.current?.distanceFromBottom() ?? 0,
      loading: loadingOlderRef.current,
      hasOlder: liveContext().hasOlderMessages,
      hasInFlight,
      suppressed: Date.now() < local.suppressHistoryUntil,
    })) return;
    const anchor = visibleMessagesRef.current[0]?.id;
    loadingOlderRef.current = true;
    try {
      await loadOlderMessages();
      await nextTick(() => {});
      if (historyWasPrepended(anchor, visibleMessagesRef.current[0]?.id) && anchor) {
        listRef.current?.scrollToKey(anchor, 'start');
      }
    } finally {
      loadingOlderRef.current = false;
    }
  }

  function handleNewMessage(message: MessageInfo) {
    if (message.messageType === MessageType.Tips) return;
    const conversationId = liveContext().activeConversationID;
    if (conversationId) {
      clearConversationUnreadCount(conversationId).catch(() => {});
    }
    if (message.isSentBySelf) {
      setStickToBottom(true);
      local.suppressHistoryUntil = Date.now() + HISTORY_SUPPRESS_MS;
    }
    if (stickToBottomRef.current) {
      void nextTick(scrollToBottom);
    }
  }

  const handlersRef = useRef({
    handleNewMessage,
    initialize,
  });
  handlersRef.current = { handleNewMessage, initialize };

  useEffect(() => {
    if (local.unsubscribeEvent) {
      local.unsubscribeEvent();
      local.unsubscribeEvent = null;
    }
    if (!activeConversationID) return undefined;
    local.unsubscribeEvent = messageListOnEvent((event) => {
      if (event.type === 'onReceiveNewMessage') handlersRef.current.handleNewMessage(event.message);
    });
    handlersRef.current.initialize();
    return () => {
      if (local.unsubscribeEvent) {
        local.unsubscribeEvent();
        local.unsubscribeEvent = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationID]);

  return {
    historyReady,
    listRef,
    stickToBottom: stickToBottomState,
    setStickToBottom,
    chatScrollTick,
    emptyText,
    overlay,
    visibleMessages,
    actions,
    onScroll,
    isCompact,
  };
}
