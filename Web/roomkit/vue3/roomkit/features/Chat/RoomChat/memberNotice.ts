import { watch } from 'vue';
import { MessageStatus } from 'tuikit-atomicx-vue3/chat';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import {
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import {
  EDU_CLASS_EVENT_ID,
  EDU_TROPHY_EVENT_ID,
  MIC_MUTE_ALL_EVENT_ID,
  SILENCE_ALL_EVENT_ID,
  parseCustomEnvelope,
  sendNotice,
} from '../customMessage';
import type { CustomMessageEnvelope } from '../customMessage';

/**
 * Education class-event business on the room chat group: member enter/leave
 * presence lines. The notice card owns its own read/write on the same
 * protocol (ChatNoticeCard.vue), and the class-wide chat silence lives in
 * useSilenceAll.ts. Presence is self-announced: each member publishes their
 * own enter and leave lines, so no client needs to speak for another.
 *
 * This module also owns which protocol messages stay out of every chat
 * surface: signal-only protocols register in `hiddenProtocolIds` below,
 * and the timeline notice for the rest lives in `noticeEvents`.
 */

/**
 * Whether the local member's own presence line should stay hidden. The
 * sender never renders their own enter or leave line: the enter can land
 * before the chat's first history load and the list replace can drop it
 * (which reads as a random miss), and one's own status changes carry no
 * news anyway.
 */
export function shouldHideMemberNotice(message: MessageInfo, protocolId: string): boolean {
  if (!message.isSentBySelf) {
    return false;
  }
  const envelope = parseCustomEnvelope(message);
  return envelope !== undefined
    && envelope.businessID === protocolId
    && (envelope.event === 'member-enter' || envelope.event === 'member-leave');
}

/**
 * Protocol ids whose messages never render in any chat surface: they ride
 * the room group as pure signals. Register new signal-only protocols here;
 * every surface filters them through `isHiddenProtocolMessage`.
 */
const hiddenProtocolIds = new Set<string>([EDU_TROPHY_EVENT_ID]);

/** Whether the message belongs to a never-rendered protocol. */
export function isHiddenProtocolMessage(message: MessageInfo): boolean {
  const envelope = parseCustomEnvelope(message);
  return envelope !== undefined && hiddenProtocolIds.has(envelope.businessID);
}

interface NoticeEvent {
  key: string;
  /** i18n placeholder -> field on the protocol payload. */
  params?: Record<string, string>;
  /** Landscape barrage has no message list, so this line rides it too. */
  barrage?: boolean;
  /** The local row exists before the group accepts it. Barrage waits for delivery. */
  delivered?: boolean;
}

/** Timeline notice, keyed by protocol id then event. A new class line is one row. */
const noticeEvents: Record<string, Record<string, NoticeEvent>> = {
  [MIC_MUTE_ALL_EVENT_ID]: {
    'mic-disabled': { key: 'Education.Sync.MuteAllOn', barrage: true, delivered: true },
    'mic-allowed': { key: 'Education.Sync.MuteAllOff', barrage: true, delivered: true },
  },
  [SILENCE_ALL_EVENT_ID]: {
    'chat-disabled': { key: 'Education.Sync.ChatDisabled', barrage: true },
    'chat-allowed': { key: 'Education.Sync.ChatAllowed', barrage: true },
  },
  [EDU_CLASS_EVENT_ID]: {
    'member-enter': { key: 'Education.Sync.EnteredRoom', params: { name: 'targetName' }, barrage: true },
    'member-leave': { key: 'Education.Sync.LeftRoom', params: { name: 'targetName' }, barrage: true },
    'member-kicked': { key: 'Education.Sync.MemberKicked', params: { name: 'targetName' }, barrage: true },
    'notice-update': { key: 'Education.Sync.NoticeUpdated', barrage: true },
    'board-auth-on': { key: 'Education.Sync.BoardAuthOn', params: { name: 'targetName' }, barrage: true, delivered: true },
    'board-auth-off': { key: 'Education.Sync.BoardAuthOff', params: { name: 'targetName' }, barrage: true, delivered: true },
  },
};

/** Notice for one protocol event. Barrage passes `barrage` so list-only lines stay out. */
export function findNoticeEvent(
  envelope: CustomMessageEnvelope,
  options?: { barrage?: boolean; status?: MessageInfo['status'] },
) {
  const event = noticeEvents[envelope.businessID]?.[envelope.event];
  if (!event) {
    return undefined;
  }
  if (options?.barrage && !event.barrage) {
    return undefined;
  }
  if (event.delivered && options?.status !== undefined && options.status !== MessageStatus.SendSuccess) {
    return undefined;
  }
  const params: Record<string, string> = {};
  for (const [placeholder, field] of Object.entries(event.params ?? {})) {
    params[placeholder] = String(envelope.data[field] ?? '');
  }
  return {
    key: event.key,
    params,
  };
}

export function selfDisplayName(): string {
  const { loginUserInfo } = useLoginState();
  const { localParticipant } = useRoomParticipantState();
  const participant = localParticipant.value;
  const login = loginUserInfo.value;
  return participant?.nameCard
    || participant?.userName
    || login?.userName
    || participant?.userId
    || login?.userId
    || '';
}

/**
 * Room whose presence line this member already published — set when the
 * enter notice goes out, or as soon as a leave is announced. Keyed by room
 * and cleared when the stay changes, so rejoining is announced again.
 */
let announcedRoomId = '';

/**
 * Announces this member's own enter once the room is joined: the room join
 * establishes the chat group membership, and `sendNotice` binds the
 * conversation itself before sending. The chat SDK's conversation list is
 * deliberately NOT a readiness signal here: the room group conversation
 * never surfaces in it (verified in runtime logs on both list stores),
 * so waiting on it would silently swallow every enter notice. Mount in the
 * scene view. A killed tab sends nothing; `announceSelfLeave` and the
 * beforeunload path cover clean exits.
 */
export function useSelfEnterAnnouncer(protocolId: string) {
  const { currentRoom } = useRoomState();

  watch(
    () => currentRoom.value?.roomId,
    (roomId, previousRoomId) => {
      if (roomId !== previousRoomId) {
        announcedRoomId = '';
      }
      if (!roomId || announcedRoomId === roomId) {
        return;
      }
      announcedRoomId = roomId;
      const name = selfDisplayName();
      if (!name) {
        return;
      }
      void sendNotice(protocolId, roomId, 'member-enter', { targetName: name }).catch((error) => {
        console.error('[RoomKit.memberNotice] enter notice send failed:', error);
      });
    },
    { immediate: true },
  );
}

/**
 * Announces this member's own leave. Call it before `leaveRoom` or `endRoom`,
 * while the chat group still accepts messages. A rejected send does not block
 * the exit.
 */
export async function announceSelfLeave(protocolId: string): Promise<void> {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom.value?.roomId || '';
  announcedRoomId = roomId;
  const name = selfDisplayName();
  if (!name || !roomId) {
    return;
  }
  try {
    await sendNotice(protocolId, roomId, 'member-leave', { targetName: name });
  } catch {
    // Best-effort: the exit flow must never be blocked by a failed notice.
  }
}
