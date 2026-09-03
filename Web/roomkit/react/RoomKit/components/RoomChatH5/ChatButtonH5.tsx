import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  IconChat,
  Popup,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { useChatContext } from 'tuikit-atomicx-react/chat';
import { useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import { IconButtonH5 } from '../base/IconButtonH5';
import { PopUpArrowDown } from '../base/PopUpArrowDown';
import { RoomChatH5 } from './RoomChatH5';
import styles from './ChatButtonH5.module.scss';

// Vue reference: RoomChatH5/ChatButton.vue.
// Mirrors React PC `ChatButton.tsx` — the active chat conversation is bound
// as long as the button is mounted (the whole conference session), regardless
// of whether the popup is currently open. Popup open/close only controls
// unread accounting.
export function ChatButtonH5() {
  const { t } = useUIKit();
  const [popupVisible, setPopupVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const {
    setActiveConversation,
    activeConversationID,
    messageListOnEvent,
  } = useChatContext();
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();

  const popupVisibleRef = useRef(popupVisible);
  useEffect(() => {
    popupVisibleRef.current = popupVisible;
  }, [popupVisible]);

  // Bind/clear active conversation as the room changes.
  useEffect(() => {
    const roomId = currentRoom?.roomId;
    setUnreadCount(0);
    if (!loginUserInfo?.userId) return;
    if (!roomId) {
      setActiveConversation('');
      return;
    }
    setActiveConversation(`GROUP${roomId}`);
  }, [currentRoom?.roomId, loginUserInfo?.userId, setActiveConversation]);

  // Clear on unmount.
  useEffect(
    () => () => {
      setActiveConversation('');
    },
    [setActiveConversation],
  );

  // Subscribe to onReceiveNewMessage for unread count, mirrors PC ChatButton.
  useEffect(() => {
    if (!activeConversationID || !messageListOnEvent) return undefined;
    const unsub = messageListOnEvent(event => {
      if (event.type !== 'onReceiveNewMessage') return;
      const { message } = event;
      if (message.isSentBySelf || popupVisibleRef.current) return;
      setUnreadCount(prev => prev + 1);
    });
    return unsub;
  }, [activeConversationID, messageListOnEvent]);

  useEffect(() => {
    if (popupVisible) setUnreadCount(0);
  }, [popupVisible]);

  const handleClick = () => {
    setUnreadCount(0);
    setPopupVisible(true);
  };

  return (
    <>
      <IconButtonH5 title={t('Chat.Title')} onClick={handleClick}>
        <Badge value={unreadCount} hidden={!unreadCount}>
          <IconChat size="24" />
        </Badge>
      </IconButtonH5>
      <Popup visible={popupVisible} onUpdateVisible={setPopupVisible} height="90%">
        <div className={styles.chatContent}>
          <PopUpArrowDown onClick={() => setPopupVisible(false)} />
          <div className={styles.chatTitle}>{t('Chat.Title')}</div>
          <RoomChatH5 isActive={popupVisible} />
        </div>
      </Popup>
    </>
  );
}
