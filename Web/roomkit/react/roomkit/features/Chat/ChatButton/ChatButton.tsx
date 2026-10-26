import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import { IconChat, TUIBadge } from '../../../base';
import { useI18n } from '../../../base/i18n';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import ChatContextSync from './ChatContextSync';
import './ChatButton.scss';

export interface ChatButtonProps {
  active?: boolean;
  isChatActive?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function ChatButton(props: ChatButtonProps) {
  const {
    active = false,
    isChatActive: isChatActiveProp = undefined,
    onClick,
    className,
    style,
  } = props;

  const { t } = useI18n();
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const [unreadCount, setUnreadCount] = useState(0);
  const isChatActive = isChatActiveProp ?? active;
  const channel = currentRoom?.roomId && loginUserInfo?.userId
    ? currentRoom.roomId
    : '';

  const isChatActiveFirstRunRef = useRef(true);
  useEffect(() => {
    if (isChatActiveFirstRunRef.current) {
      isChatActiveFirstRunRef.current = false;
      return;
    }
    if (isChatActive) {
      setUnreadCount(0);
    }
  }, [isChatActive]);

  const channelFirstRunRef = useRef(true);
  useEffect(() => {
    if (channelFirstRunRef.current) {
      channelFirstRunRef.current = false;
      return;
    }
    setUnreadCount(0);
  }, [channel]);

  return (
    <div
      className={['chat-button', className].filter(Boolean).join(' ')}
      style={style}
    >
      <ToolbarButtonPC
        label={t('Chat.Title')}
        active={active}
        onClick={() => onClick?.()}
        iconSlot={(
          <TUIBadge value={unreadCount} hidden={!unreadCount}>
            <IconChat size={22} />
          </TUIBadge>
        )}
      />
      {channel && (
        <ChatContextSync
          key={channel}
          channel={channel}
          isActive={isChatActive}
          onUnreadChange={setUnreadCount}
        />
      )}
    </div>
  );
}

export default ChatButton;
