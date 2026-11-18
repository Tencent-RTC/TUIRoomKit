import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { IconChatEmpty, IconCollapse, TUIList } from '../../../base';
import { useI18n } from '../../../base/i18n';
import ChatContextSync from '../ChatButton/ChatContextSync';
import ChatMessage from './ChatMessage';
import type { ChatMessageMetaScope } from './ChatMessage';
import { CHAT_SCROLL_TICK_KEY, useMessageList } from './useMessageList';
import type { MessageAction } from './useMessageActions';
import { MESSAGE_OVERLAY_KEY } from './useMessageOverlay';
import './MessageList.scss';

export interface MessageListProps {
  channel?: string;
  messageActionList?: MessageAction[];
  mobile?: boolean;
  /** Whether member notices render in this list. */
  isShowMemberNotice?: boolean;
  /** Hides each message's timestamp. */
  isHideTimestamp?: boolean;
  /** Tints the room owner's bubbles with the self-message accent. */
  isHighlightOwner?: boolean;
  /** Swaps the jump circle for an "N new messages" pill while rows land unread. */
  isShowNewMessages?: boolean;
  metaSlot?: (scope: ChatMessageMetaScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

const EMPTY_ACTIONS: MessageAction[] = [];

export function MessageList(props: MessageListProps) {
  const {
    channel = 'default',
    messageActionList = EMPTY_ACTIONS,
    mobile = false,
    isShowMemberNotice = false,
    isHideTimestamp = false,
    isHighlightOwner = false,
    isShowNewMessages = false,
    metaSlot,
    className,
    style,
  } = props;

  const { t } = useI18n();
  const {
    historyReady,
    listRef,
    stickToBottom,
    setStickToBottom,
    chatScrollTick,
    emptyText,
    overlay,
    visibleMessages,
    actions,
    onScroll,
  } = useMessageList({ channel, messageActionList, isShowMemberNotice });

  const [newMessageCount, setNewMessageCount] = useState(0);
  const showNewMessages = isShowNewMessages && newMessageCount > 0;
  const newMessageLabel = t('RoomChat.new_messages', {
    count: newMessageCount > 99 ? '99+' : newMessageCount,
  });

  function jumpToNewMessages() {
    // Reaching the bottom clears the tally; the pin lands the reader on them.
    setStickToBottom(true);
    listRef.current?.scrollToBottom();
  }

  return (
    <MESSAGE_OVERLAY_KEY.Provider value={overlay}>
      <CHAT_SCROLL_TICK_KEY.Provider value={chatScrollTick}>
        <div
          className={['message-list', mobile ? 'message-list-mobile' : '', className].filter(Boolean).join(' ')}
          style={style}
        >
          {historyReady && (
            <TUIList
              ref={listRef}
              className="message-list-scroller"
              variant="plain"
              itemSize="auto"
              height="100%"
              scrollbar={false}
              itemHeight={72}
              overscan={6}
              stickToBottom={stickToBottom}
              onStickToBottomChange={setStickToBottom}
              jumpToEnd={!showNewMessages}
              jumpLabel={t('RoomChat.jump_to_latest')}
              emptyText={emptyText}
              onScroll={onScroll}
              emptySlot={(
                <div className="message-list-empty">
                  <IconChatEmpty className="message-list-empty-icon" />
                  <p className="message-list-empty-title">
                    {emptyText}
                  </p>
                </div>
              )}
            >
              {visibleMessages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  actions={actions}
                  mobile={mobile}
                  isHideTimestamp={isHideTimestamp}
                  isHighlightOwner={isHighlightOwner}
                  metaSlot={metaSlot}
                />
              ))}
            </TUIList>
          )}
          {/* Replaces the list's circle jump control while unread rows wait below. */}
          {showNewMessages && (
            <button
              type="button"
              className="message-list-new-messages"
              aria-label={t('RoomChat.jump_to_latest')}
              onClick={jumpToNewMessages}
            >
              <span>{newMessageLabel}</span>
              <IconCollapse size={12} />
            </button>
          )}
          {/* The pill tally rides the same counter the chat badges use, with
              "watching" meaning the list is pinned to the bottom: rows that land
              while the reader is scrolled away count, reaching the bottom clears. */}
          {isShowNewMessages && (
            <ChatContextSync
              channel={channel}
              isActive={stickToBottom}
              onUnreadChange={setNewMessageCount}
            />
          )}
        </div>
      </CHAT_SCROLL_TICK_KEY.Provider>
    </MESSAGE_OVERLAY_KEY.Provider>
  );
}

export default MessageList;
