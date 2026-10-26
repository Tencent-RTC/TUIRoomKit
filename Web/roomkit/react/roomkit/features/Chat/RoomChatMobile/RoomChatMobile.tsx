import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { TUIToast } from '../../../base';
import { t, useI18n } from '../../../base/i18n';
import { CHAT_COMPOSER_KEY, provideChatComposer } from '../RoomChatPC/useChatComposer';
import { useMessageActions } from '../RoomChatPC/useMessageActions';
import MessageInput from './MessageInput';
import MessageList from '../RoomChatPC/MessageList';
import './RoomChatMobile.scss';

export interface RoomChatMobileProps {
  isActive?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function RoomChatMobile(props: RoomChatMobileProps) {
  const { isActive = false, className, style } = props;

  useI18n();
  const { localParticipant } = useRoomParticipantState();
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();

  const channel = currentRoom?.roomId || '';
  const canUseChatContext = Boolean(currentRoom?.roomId && loginUserInfo?.userId);
  const role = localParticipant?.role as number | undefined;
  const isHostOrAdmin = role === 0 || role === 1;
  const inputDisabled = (
    Boolean(localParticipant?.isMessageDisabled)
    || Boolean(currentRoom?.isAllMessageDisabled && !isHostOrAdmin)
  );
  const placeholder = inputDisabled ? t('RoomChat.disabled_placeholder') : t('RoomChat.input_placeholder');
  const messageActionList = useMessageActions();
  const composer = provideChatComposer();

  const isMessageDisabled = localParticipant?.isMessageDisabled;
  const prevMessageDisabledRef = useRef(isMessageDisabled);
  useEffect(() => {
    const wasMuted = prevMessageDisabledRef.current;
    prevMessageDisabledRef.current = isMessageDisabled;
    if (wasMuted == null || isMessageDisabled === wasMuted) return;
    TUIToast.info(isMessageDisabled ? t('RoomChat.muted_toast') : t('RoomChat.unmuted_toast'));
  }, [isMessageDisabled]);

  const isAllMessageDisabled = currentRoom?.isAllMessageDisabled;
  const prevAllMessageDisabledRef = useRef(isAllMessageDisabled);
  useEffect(() => {
    const wasMuted = prevAllMessageDisabledRef.current;
    prevAllMessageDisabledRef.current = isAllMessageDisabled;
    if (wasMuted == null || isAllMessageDisabled === wasMuted) return;
    TUIToast.info(isAllMessageDisabled ? t('RoomChat.all_muted_toast') : t('RoomChat.all_unmuted_toast'));
  }, [isAllMessageDisabled]);

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
          <MessageList
            className="chat-panel-list"
            mobile
            channel={channel}
            messageActionList={messageActionList}
          />
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
