import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import { useLoginState, useRoomParticipantState } from 'tuikit-atomicx-vue3/room';

type SenderFrom = {
  userID?: string;
  nameCard?: string;
  nickname?: string;
  friendRemark?: string;
  avatar?: string;
  avatarUrl?: string;
  faceURL?: string;
};

type SenderProfile = {
  userId: string;
  name: string;
  avatarUrl: string;
};

const nameCache = new Map<string, string>();

export function clearSenderNameCache() {
  nameCache.clear();
}

export function useSenderName() {
  const profileOf = useSenderProfile();
  return (message: MessageInfo): string => profileOf(message).name;
}

export function useSenderProfile() {
  const { participantList } = useRoomParticipantState();
  const { loginUserInfo } = useLoginState();

  return (message: MessageInfo): SenderProfile => {
    const from = message.from as SenderFrom | undefined;
    const userId = from?.userID || '';
    const participant = participantList.value.find(item => item.userId === userId);
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
      ? (loginUserInfo.value as { avatarUrl?: string } | null)?.avatarUrl
      : '';
    const avatarUrl = (
      participant?.avatarUrl
      || from?.avatarUrl
      || from?.avatar
      || from?.faceURL
      || selfAvatar
      || ''
    ).trim();

    return { userId, name, avatarUrl };
  };
}
