import type { CSSProperties } from 'react';
import { IconChatEmpty, TUIList } from '../../../base';
import { useI18n } from '../../../base/i18n';
import ChatMessage from './ChatMessage';
import { CHAT_SCROLL_TICK_KEY, useMessageList } from './useMessageList';
import type { MessageAction } from './useMessageActions';
import { MESSAGE_OVERLAY_KEY } from './useMessageOverlay';
import './MessageList.scss';

export interface MessageListProps {
  channel?: string;
  messageActionList?: MessageAction[];
  mobile?: boolean;
  className?: string;
  style?: CSSProperties;
}

const EMPTY_ACTIONS: MessageAction[] = [];

export function MessageList(props: MessageListProps) {
  const {
    channel = 'default',
    messageActionList = EMPTY_ACTIONS,
    mobile = false,
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
    isCompact,
  } = useMessageList({ channel, messageActionList });

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
              jumpToEnd
              jumpLabel={t('RoomChat.jump_to_latest')}
              emptyText={emptyText}
              onScroll={onScroll}
              emptySlot={(
                <div className="message-list-empty">
                  <IconChatEmpty size={28} className="message-list-empty-icon" />
                  <p className="message-list-empty-title">
                    {emptyText}
                  </p>
                  <p className="message-list-empty-hint">
                    {t('RoomChat.empty_hint')}
                  </p>
                </div>
              )}
            >
              {visibleMessages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  actions={actions}
                  compact={isCompact(index)}
                  mobile={mobile}
                />
              ))}
            </TUIList>
          )}
        </div>
      </CHAT_SCROLL_TICK_KEY.Provider>
    </MESSAGE_OVERLAY_KEY.Provider>
  );
}

export default MessageList;
