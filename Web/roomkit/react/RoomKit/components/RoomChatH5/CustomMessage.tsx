import { useMemo } from 'react';
import type { ComponentProps } from 'react';
import { MessageH5 } from 'tuikit-atomicx-react/chat';
import { useRoomParticipantState } from 'tuikit-atomicx-react/room';

type CustomMessageProps = ComponentProps<typeof MessageH5>;

// Vue reference: RoomChatH5/CustomMessage.vue.
// Must wrap MessageH5 (not PC Message) so long-press actions use H5
// MessageActionDropdown styles (100px width, item dividers, icon colors).
export function CustomMessage(props: CustomMessageProps) {
  const { message, ...rest } = props;
  const { participantList } = useRoomParticipantState();

  const senderUserId = (message.from as { userID?: string } | undefined)?.userID ?? '';
  const senderNick = (message.from as { nickname?: string } | undefined)?.nickname ?? '';

  const nick = useMemo(() => {
    const participant = participantList.find(p => p.userId === senderUserId);
    return (
      participant?.nameCard
      || participant?.userName
      || participant?.userId
      || senderNick
      || senderUserId
    );
  }, [participantList, senderUserId, senderNick]);

  return (
    <div style={{ width: '100%' }}>
      <MessageH5 {...rest} nick={nick} message={message} removeAvatar />
    </div>
  );
}
