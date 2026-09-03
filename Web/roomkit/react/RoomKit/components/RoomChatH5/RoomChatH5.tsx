import { useEffect, useRef } from 'react';
import { useUIKit } from '@tencentcloud/uikit-base-component-react';
import {
  MessageInputH5,
  MessageListH5,
  useMessageActions,
} from 'tuikit-atomicx-react/chat';
import type { MessageListH5Handle } from 'tuikit-atomicx-react/chat';
import { useRoomParticipantState } from 'tuikit-atomicx-react/room';
import { CustomMessage } from './CustomMessage';
import styles from './RoomChatH5.module.scss';

export interface RoomChatH5Props {
  /** Whether the chat panel is currently active/visible. */
  isActive?: boolean;
}

// Vue reference: RoomChatH5/RoomChat.vue. Use MessageListH5 so the inner
// `.message-list-container` keeps `padding: 0 10px` (Vue MessageList layout);
// PC MessageList puts that padding on the root and conflicts with
// `.roomMessageList` (`padding: 12px 8px`) on the same element.
export function RoomChatH5({ isActive = false }: RoomChatH5Props) {
  const { t } = useUIKit();
  const { localParticipant } = useRoomParticipantState();

  const isMessageDisabled = Boolean(
    (localParticipant as { isMessageDisabled?: boolean } | undefined)
      ?.isMessageDisabled,
  );
  const placeholder = isMessageDisabled
    ? t('RoomChat.disabled_placeholder')
    : t('RoomChat.input_placeholder');

  const messageActionList = useMessageActions(['copy', 'recall', 'delete']);

  const messageListRef = useRef<MessageListH5Handle | null>(null);
  const wasActiveRef = useRef(isActive);
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      messageListRef.current?.scrollToBottom('instant');
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  return (
    <div className={styles.roomChat}>
      <MessageListH5
        ref={messageListRef}
        className={styles.roomMessageList}
        Message={CustomMessage}
        messageActionList={messageActionList}
      />
      <MessageInputH5
        className={styles.roomMessageInput}
        placeholder={placeholder}
        disabled={isMessageDisabled}
        // Match Vue `RoomChat.vue`: room chat only allows emoji / image /
        // video / file. Hides the built-in audio/video call actions that
        // atomicx-react ships in its default action grid.
        actions={['EmojiPicker', 'ImagePicker', 'VideoPicker', 'FilePicker']}
      />
    </div>
  );
}
