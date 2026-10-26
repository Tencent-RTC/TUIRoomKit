import type { MessageInfo } from 'tuikit-atomicx-react/chat';
import { useLoginState, useRoomParticipantState } from 'tuikit-atomicx-react/room';

type SenderFrom = {
  userID?: string;
  nameCard?: string;
  nickname?: string;
  friendRemark?: string;
};

type SenderProfile = {
  name: string;
  avatarUrl: string;
};

const nameCache = new Map<string, string>();

export function clearSenderNameCache() {
  nameCache.clear();
}

export function useSenderProfile() {
  const { participantList } = useRoomParticipantState();
  const { loginUserInfo } = useLoginState();

  return (message: MessageInfo): SenderProfile => {
    const from = message.from as SenderFrom | undefined;
    const userId = from?.userID || '';
    const participant = participantList.find(item => item.userId === userId);
    const liveName = (
      participant?.nameCard
      || participant?.userName
      || from?.nameCard
      || from?.nickname
      || from?.friendRemark
      || ''
    ).trim();

    let name = nameCache.get(userId) || liveName || userId;
    if (liveName && liveName !== userId) {
      nameCache.set(userId, liveName);
      name = liveName;
    }

    const selfAvatar = message.isSentBySelf
      ? (loginUserInfo as { avatarUrl?: string } | null)?.avatarUrl
      : '';
    const avatarUrl = (participant?.avatarUrl || selfAvatar || '').trim();

    return { name, avatarUrl };
  };
}
