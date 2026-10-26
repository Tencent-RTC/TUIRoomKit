import { useEffect, useRef } from 'react';
import { MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-react/chat';
import { ensureInitialHistory } from '../RoomChatPC/messageListScroll';
import { clearSenderNameCache } from '../RoomChatPC/useSenderName';

export interface ChatContextSyncProps {
  channel: string;
  isActive?: boolean;
  onUnreadChange?: (count: number) => void;
}

export function ChatContextSync(props: ChatContextSyncProps) {
  const { channel, isActive = false, onUnreadChange } = props;

  const { setActiveConversation, messageListOnEvent, loadMessages } = useChatContext(channel);
  const unreadCountRef = useRef(0);
  const unsubscribeEventRef = useRef<(() => void) | null>(null);
  const latestRef = useRef({ isActive, onUnreadChange });
  latestRef.current = { isActive, onUnreadChange };

  function emitUnreadCount() {
    latestRef.current.onUnreadChange?.(unreadCountRef.current);
  }

  function resetUnreadTracking() {
    unreadCountRef.current = 0;
    emitUnreadCount();
  }

  function unsubscribeMessageEvent() {
    if (unsubscribeEventRef.current) {
      unsubscribeEventRef.current();
      unsubscribeEventRef.current = null;
    }
  }

  function subscribeMessageEvent() {
    unsubscribeMessageEvent();
    unsubscribeEventRef.current = messageListOnEvent((event) => {
      if (event.type !== 'onReceiveNewMessage') {
        return;
      }
      if (event.message.isSentBySelf || latestRef.current.isActive) {
        return;
      }
      if (event.message.messageType === MessageType.Tips) {
        return;
      }
      if (event.message.status === MessageStatus.Recalled || event.message.status === MessageStatus.Deleted) {
        return;
      }
      unreadCountRef.current += 1;
      emitUnreadCount();
    });
  }

  useEffect(() => {
    resetUnreadTracking();
    clearSenderNameCache();
    if (!channel) {
      setActiveConversation(undefined);
      unsubscribeMessageEvent();
      return undefined;
    }
    setActiveConversation(`GROUP${channel}`);
    void ensureInitialHistory(channel, loadMessages).catch(() => {});
    subscribeMessageEvent();
    return () => {
      unsubscribeMessageEvent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  const isActiveFirstRunRef = useRef(true);
  useEffect(() => {
    if (isActiveFirstRunRef.current) {
      isActiveFirstRunRef.current = false;
      return;
    }
    if (isActive) {
      unreadCountRef.current = 0;
      emitUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    // Keeps the IM group bound while this node stays mounted.
    <span className="chat-context-sync" hidden />
  );
}

export default ChatContextSync;
