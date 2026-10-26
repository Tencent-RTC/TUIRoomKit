import { useEffect, useRef, useState } from 'react';
import { useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import { IconChat, TUIBadge } from '../../../base';
import { useI18n } from '../../../base/i18n';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';
import ChatContextSync from './ChatContextSync';
import './ChatButtonMobile.scss';

export interface ChatButtonMobileProps {
  active?: boolean;
  isChatActive?: boolean;
  onClick?: () => void;
}

export function ChatButtonMobile(props: ChatButtonMobileProps) {
  const {
    active = false,
    isChatActive: isChatActiveProp = undefined,
    onClick,
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
    <div className="chat-button-mobile">
      <ToolbarButtonMobile
        label={t('Chat.Title')}
        active={active}
        pressed={active}
        onClick={() => onClick?.()}
      >
        <TUIBadge value={unreadCount} hidden={!unreadCount}>
          <IconChat size={20} />
        </TUIBadge>
      </ToolbarButtonMobile>
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

export default ChatButtonMobile;
