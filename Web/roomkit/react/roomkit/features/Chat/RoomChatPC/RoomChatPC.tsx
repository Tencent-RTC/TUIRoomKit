import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { TUIToast } from '../../../base';
import { t, useI18n } from '../../../base/i18n';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import { CHAT_COMPOSER_KEY, provideChatComposer } from './useChatComposer';
import { useMessageActions } from './useMessageActions';
import './RoomChatPC.scss';

export interface RoomChatPCProps {
  /**
   * Accepted for view parity: Vue's ConferenceViewPC passes `is-active` and
   * RoomChatPC.vue receives it as an unused fallthrough attribute.
   */
  isActive?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function RoomChatPC(props: RoomChatPCProps) {
  const { className, style } = props;

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
          className={['chat-panel', className].filter(Boolean).join(' ')}
          style={style}
        >
          <MessageList
            className="chat-panel-list"
            channel={channel}
            messageActionList={messageActionList}
          />
          <MessageInput
            className="chat-panel-input"
            channel={channel}
            placeholder={placeholder}
            disabled={inputDisabled}
          />
        </div>
      )}
    </CHAT_COMPOSER_KEY.Provider>
  );
}

export default RoomChatPC;
