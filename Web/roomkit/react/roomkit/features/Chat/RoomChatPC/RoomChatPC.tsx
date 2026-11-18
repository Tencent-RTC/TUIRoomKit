import ChatNoticeCard from './ChatNoticeCard';
import type { CSSProperties, ReactNode } from 'react';
import { useSilenceAll } from '../customMessage';
import { RoomParticipantRole, useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { t, useI18n } from '../../../base/i18n';
import ChatContextSync from '../ChatButton/ChatContextSync';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import type { ChatMessageMetaScope } from './ChatMessage';
import { CHAT_COMPOSER_KEY, provideChatComposer } from './useChatComposer';
import { useMessageActions } from './useMessageActions';
import './RoomChatPC.scss';

export interface RoomChatPCProps {
  /**
   * Accepted for view parity: Vue's ConferenceViewPC passes `is-active` and
   * RoomChatPC.vue receives it as an unused fallthrough attribute.
   */
  isActive?: boolean;
  isShowNotice?: boolean;
  /** Notice editing permission supplied by the scene view. */
  canEditNotice?: boolean;
  /** Whether member notices render here; protocol notices do not count as unread. */
  isShowMemberNotice?: boolean;
  /** Hides the composer's toolbar row. */
  isHideOperator?: boolean;
  /** Hides message timestamps. */
  isHideTimestamp?: boolean;
  /** Tints the room owner's bubbles with the self-message accent. */
  isHighlightOwner?: boolean;
  /** Composer placeholder; the room default applies when unset. */
  placeholder?: string;
  /** Swaps the jump circle for an "N new messages" pill while rows land unread. */
  isShowNewMessages?: boolean;
  /** Scene chrome (the education title bar); the panel itself stays scene-agnostic. */
  headerSlot?: ReactNode;
  /** Replaces each message's timestamp after the sender name. */
  metaSlot?: (scope: ChatMessageMetaScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function RoomChatPC(props: RoomChatPCProps) {
  const {
    isActive = true,
    isShowMemberNotice = false,
    isHideOperator = false,
    isHideTimestamp = false,
    isHighlightOwner = false,
    placeholder: placeholderProp,
    isShowNewMessages = false,
    headerSlot,
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
          className={['chat-panel', className].filter(Boolean).join(' ')}
          style={style}
        >
          {headerSlot}
          {props.isShowNotice && <ChatNoticeCard channel={channel} canEdit={props.canEditNotice} />}
          <MessageList
            className="chat-panel-list"
            channel={channel}
            messageActionList={messageActionList}
            isShowMemberNotice={isShowMemberNotice}
            isHideTimestamp={isHideTimestamp}
            isHighlightOwner={isHighlightOwner}
            isShowNewMessages={isShowNewMessages}
            metaSlot={metaSlot}
          />
          <MessageInput
            className="chat-panel-input"
            channel={channel}
            placeholder={placeholder}
            disabled={inputDisabled}
            isHideOperator={isHideOperator}
          />
          {/* The classroom panel has no ChatButton, so it binds the IM group itself:
              activates the conversation so the list loads, and marks it read. */}
          <ChatContextSync channel={channel} isActive={isActive} isShowMemberNotice={isShowMemberNotice} />
        </div>
      )}
    </CHAT_COMPOSER_KEY.Provider>
  );
}

export default RoomChatPC;
