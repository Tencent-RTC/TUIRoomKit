import ChatNoticeCard from '../RoomChatPC/ChatNoticeCard';
import type { CSSProperties, ReactNode } from 'react';
import { useSilenceAll } from '../customMessage';
import { RoomParticipantRole, useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { t, useI18n } from '../../../base/i18n';
import { CHAT_COMPOSER_KEY, provideChatComposer } from '../RoomChatPC/useChatComposer';
import { useMessageActions } from '../RoomChatPC/useMessageActions';
import MessageInput from './MessageInput';
import ChatContextSync from '../ChatButton/ChatContextSync';
import MessageList from '../RoomChatPC/MessageList';
import type { ChatMessageMetaScope } from '../RoomChatPC/ChatMessage';
import './RoomChatMobile.scss';

export interface RoomChatMobileProps {
  isActive?: boolean;
  isShowNotice?: boolean;
  /** Notice editing permission supplied by the scene view. */
  canEditNotice?: boolean;
  isShowMemberNotice?: boolean;
  isHideTimestamp?: boolean;
  /** Tints the room owner's bubbles with the classroom accent. */
  isHighlightOwner?: boolean;
  /** Composer placeholder; the room default applies when unset. */
  placeholder?: string;
  /** Swaps the jump circle for an "N new messages" pill while rows land unread. */
  isShowNewMessages?: boolean;
  /** Replaces each message's timestamp after the sender name. */
  metaSlot?: (scope: ChatMessageMetaScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function RoomChatMobile(props: RoomChatMobileProps) {
  const {
    isActive = false,
    isHighlightOwner = false,
    isShowNewMessages = false,
    placeholder: placeholderProp,
    metaSlot,
    className,
    style,
  } = props;

  useI18n();
  const { localParticipant } = useRoomParticipantState();
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();

  const channel = currentRoom?.roomId || '';
  const canUseChatContext = Boolean(currentRoom?.roomId && loginUserInfo?.userId);
  const isHostOrAdmin = localParticipant?.role === RoomParticipantRole.Owner
    || localParticipant?.role === RoomParticipantRole.Admin;
  const { silenceAll } = useSilenceAll();
  const inputDisabled = (
    (silenceAll && !isHostOrAdmin)
    || Boolean(localParticipant?.isMessageDisabled)
    || Boolean(currentRoom?.isAllMessageDisabled && !isHostOrAdmin)
  );
  const placeholder = inputDisabled
    ? t('RoomChat.disabled_placeholder')
    : placeholderProp ?? t('RoomChat.input_placeholder');
  const messageActionList = useMessageActions();
  const composer = provideChatComposer();

  return (
    <CHAT_COMPOSER_KEY.Provider value={composer}>
      {canUseChatContext && (
        <div
          key={channel}
          /* `room-chat-mobile` scopes the mobile-only overrides of the shared global classes. */
          className={['chat-panel', 'room-chat-mobile', className].filter(Boolean).join(' ')}
          style={style}
          onDoubleClick={event => event.stopPropagation()}
        >
          {props.isShowNotice && <ChatNoticeCard channel={channel} canEdit={props.canEditNotice} />}
          <MessageList
            className="chat-panel-list"
            mobile
            isHideTimestamp={props.isHideTimestamp}
            isShowMemberNotice={props.isShowMemberNotice}
            channel={channel}
            messageActionList={messageActionList}
            isHighlightOwner={isHighlightOwner}
            isShowNewMessages={isShowNewMessages}
            metaSlot={metaSlot}
          />
          {props.isShowMemberNotice && <ChatContextSync channel={channel} isActive={isActive} isShowMemberNotice />}
          <MessageInput
            className="chat-panel-input"
            channel={channel}
            placeholder={placeholder}
            disabled={inputDisabled}
            active={isActive}
          />
        </div>
      )}
    </CHAT_COMPOSER_KEY.Provider>
  );
}

export default RoomChatMobile;
