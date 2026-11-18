import { useEffect, useRef } from 'react';
import { getChannel, MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-react/chat';
import type { MessageInfo } from 'tuikit-atomicx-react/chat';
import {
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { atomicState } from '../../core/mount';

// --- Registered protocols ----------------------------------------------------

/** Education class events: the member-notice protocol of the education scene. */
export const EDU_CLASS_EVENT_ID = 'edu_class_event';
export const SILENCE_ALL_EVENT_ID = 'silence_all_event';
export const MIC_MUTE_ALL_EVENT_ID = 'mic_mute_all_event';

/** Education trophy awards: a pure real-time celebration signal, never rendered in chat. */
export const EDU_TROPHY_EVENT_ID = 'edu_trophy_event';

/**
 * Chat custom-message protocol layer on the room chat group. Every custom
 * message, whatever feature owns it, follows one wire envelope:
 *   { businessID: '<protocol id>', event: '<action>', data: { ... } }
 *
 * This module provides the generic pieces: the shared envelope parser, a
 * predicate keyed by businessID, and a sender hook that publishes member
 * joins and leaves as protocol messages. Each protocol (e.g. education class
 * events) registers its businessID here and its scene mounts the sender with
 * it; chat consumers (notice-line renderer, list filter, unread counter)
 * import the parser and the predicate.
 *
 * Custom messages ride the room IM group so everyone — including late joiners
 * reading roaming history — sees the same timeline. Members announce their
 * own presence, so no other client duplicates their notice. Reserved
 * SDK values (call signaling, `user_typing_status`) are already filtered by
 * the chat core before reaching the list.
 */

/** Wire envelope shared by all custom messages. */
interface CustomMessageEnvelope {
  businessID: string;
  event: string;
  data: Record<string, unknown>;
}

/** Parses a chat message into the shared envelope, or undefined. */
export function parseCustomEnvelope(message: MessageInfo): CustomMessageEnvelope | undefined {
  if (message.messageType !== MessageType.Custom) {
    return undefined;
  }
  const raw = (message.messagePayload as { customData?: unknown } | undefined)?.customData;
  try {
    const parsed = JSON.parse(String(raw ?? '{}'));
    if (typeof parsed !== 'object' || parsed === null) {
      return undefined;
    }
    const envelope = parsed as Partial<CustomMessageEnvelope>;
    if (typeof envelope.businessID !== 'string' || typeof envelope.event !== 'string') {
      return undefined;
    }
    return {
      businessID: envelope.businessID,
      event: envelope.event,
      data: typeof envelope.data === 'object' && envelope.data !== null
        ? envelope.data as Record<string, unknown>
        : {},
    };
  } catch {
    return undefined;
  }
}

/** Whether the message belongs to the protocol with this businessID. */
export function isProtocolMessage(message: MessageInfo, businessID: string): boolean {
  const envelope = parseCustomEnvelope(message);
  return envelope !== undefined && envelope.businessID === businessID;
}

/** Last delivered timeline event wins, including for members loading history. */
export function latestProtocolEvent(
  messages: readonly MessageInfo[],
  protocolId: string,
  events: readonly string[],
): CustomMessageEnvelope | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const envelope = message.status === MessageStatus.SendSuccess ? parseCustomEnvelope(message) : undefined;
    if (envelope?.businessID === protocolId && events.includes(envelope.event)) return envelope;
  }
  return undefined;
}

let leaveAnnouncedRoomId = '';

export function sendNotice(protocolId: string, roomId: string, event: string, data: Record<string, unknown>): Promise<void> {
  if (!roomId) return Promise.resolve();
  if (protocolId === EDU_CLASS_EVENT_ID) {
    if (event === 'member-enter') leaveAnnouncedRoomId = '';
    if (event === 'member-leave') {
      if (leaveAnnouncedRoomId === roomId) return Promise.resolve();
      leaveAnnouncedRoomId = roomId;
    }
  }
  const channel = getChannel(roomId).getSnapshot();
  channel.setActiveConversation(`GROUP${roomId}`);
  return channel.sendMessage({
    type: 'customMessage', customData: JSON.stringify({ businessID: protocolId, event, data }), description: '',
  }).then(() => undefined);
}

/** Silence uses the timeline, not the engine IM ban that would also block protocol sends. */
export function useSilenceAll() {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom?.roomId || '';
  const { messageList } = useChatContext(roomId);
  const envelope = latestProtocolEvent(messageList ?? [], SILENCE_ALL_EVENT_ID, ['chat-disabled', 'chat-allowed']);
  const silenceAll = envelope?.event === 'chat-disabled';
  async function toggleSilenceAll(): Promise<void> {
    await sendNotice(SILENCE_ALL_EVENT_ID, roomId, silenceAll ? 'chat-allowed' : 'chat-disabled', {})
      .catch(error => console.error('[RoomKit.silenceAll] publish failed:', error));
  }
  return { silenceAll, toggleSilenceAll };
}

export function shouldHideMemberNotice(message: MessageInfo): boolean {
  const envelope = parseCustomEnvelope(message);
  return !!message.isSentBySelf && envelope?.businessID === EDU_CLASS_EVENT_ID
    && ['member-enter', 'member-leave'].includes(envelope.event);
}

export function findNoticeCopy(message: MessageInfo): { key: string; params?: Record<string, string> } | undefined {
  const envelope = parseCustomEnvelope(message);
  if (!envelope) return undefined;
  if (envelope.businessID === EDU_CLASS_EVENT_ID) {
    if (envelope.event === 'notice-update') return { key: 'Education.Sync.NoticeUpdated' };
    if (['board-auth-on', 'board-auth-off'].includes(envelope.event)) {
      if (message.status !== MessageStatus.SendSuccess) return undefined;
      return {
        key: envelope.event === 'board-auth-on' ? 'Education.Sync.BoardAuthOn' : 'Education.Sync.BoardAuthOff',
        params: { name: String(envelope.data.targetName ?? '') },
      };
    }
    if (['member-enter', 'member-leave', 'member-kicked'].includes(envelope.event)) {
      if (envelope.event === 'member-kicked') {
        return { key: 'Education.Sync.MemberKicked', params: { name: String(envelope.data.targetName ?? '') } };
      }
      return {
        key: envelope.event === 'member-enter' ? 'Education.Sync.EnteredRoom' : 'Education.Sync.LeftRoom',
        params: { name: String(envelope.data.targetName ?? '') },
      };
    }
  }
  if (envelope.businessID === SILENCE_ALL_EVENT_ID) {
    if (envelope.event === 'chat-disabled') return { key: 'Education.Sync.ChatDisabled' };
    if (envelope.event === 'chat-allowed') return { key: 'Education.Sync.ChatAllowed' };
  }
  if (envelope.businessID === MIC_MUTE_ALL_EVENT_ID && message.status === MessageStatus.SendSuccess) {
    if (envelope.event === 'mic-disabled') return { key: 'Education.Sync.MuteAllOn' };
    if (envelope.event === 'mic-allowed') return { key: 'Education.Sync.MuteAllOff' };
  }
  return undefined;
}

/**
 * Publishes one protocol message into the room chat group. Fire-and-forget
 * semantics belong to the caller: a failed send drops that one message
 * (notice line, celebration), the room itself keeps working. `option`
 * reaches the channel send verbatim.
 */
export function sendProtocolMessage(
  businessID: string,
  event: string,
  data: Record<string, unknown>,
  option?: ProtocolSendOption,
): Promise<void> {
  // Callable outside components (trophy awards), so the room id comes from the core mirror.
  const roomId = atomicState.currentRoomId || '';
  if (!roomId) {
    return Promise.resolve();
  }
  // Wire envelope shared by all custom messages: { businessID, event, data }.
  const customData = JSON.stringify({ businessID, event, data });
  return getChannel(roomId).getSnapshot()
    .sendMessage({ type: 'customMessage', customData, description: '' }, option)
    .then(() => undefined);
}

/** Send options a protocol can pass through to the channel. */
export interface ProtocolSendOption {
  /**
   * Online-only messages reach just the members online at send time: TIM
   * never stores, roams or offline-delivers them, so a rejoin or a page
   * refresh can never replay them. Opt-in per protocol — presence, silence
   * and class-event notices rely on the roaming history staying intact.
   */
  onlineUserOnly?: boolean;
}

/** Each member announces their own presence, matching the Vue education protocol. */
export function useMemberNoticeSender(businessID: string) {
  const { currentRoom } = useRoomState();
  const { localParticipant } = useRoomParticipantState();
  const { loginUserInfo } = useLoginState();
  const roomId = currentRoom?.roomId;
  const announcedRoomRef = useRef('');
  const name = localParticipant?.nameCard || localParticipant?.userName || loginUserInfo?.userName
    || localParticipant?.userId || loginUserInfo?.userId || '';
  useEffect(() => {
    if (!roomId) {
      announcedRoomRef.current = '';
      return;
    }
    if (!name || announcedRoomRef.current === roomId) return;
    announcedRoomRef.current = roomId;
    void sendNotice(businessID, roomId, 'member-enter', { targetName: name }).catch(() => {});
  }, [roomId, businessID, name]);
}
