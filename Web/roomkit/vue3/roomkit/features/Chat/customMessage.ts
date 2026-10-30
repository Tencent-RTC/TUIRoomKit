import { watch } from 'vue';
import { getChannel, MessageType } from 'tuikit-atomicx-vue3/chat';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import {
  RoomParticipantEvent,
  RoomParticipantRole,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomUser } from 'tuikit-atomicx-vue3/room';

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
 * reading roaming history — sees the same timeline. Presence notices echo
 * from the room owner side only, so the notice is never duplicated. Reserved
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

/** Resolves the display name to announce for a room user. */
function displayName(user: RoomUser | null | undefined): string {
  return user?.userName || user?.userId || '';
}

/**
 * Publishes one protocol message into the room chat group. Fire-and-forget
 * semantics belong to the caller: a failed send drops that one message
 * (notice line, celebration), the room itself keeps working.
 */
export function sendProtocolMessage(
  businessID: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom.value?.roomId || '';
  if (!roomId) {
    return Promise.resolve();
  }
  // Wire envelope shared by all custom messages: { businessID, event, data }.
  const customData = JSON.stringify({ businessID, event, data });
  return getChannel(roomId).getSnapshot()
    .sendMessage({ type: 'customMessage', customData, description: '' })
    .then(() => undefined);
}

/**
 * Publishes member joins and leaves into the room chat group as protocol
 * messages. Only the room owner echoes, so the notice is never duplicated.
 */
export function useMemberNoticeSender(businessID: string) {
  const { currentRoom } = useRoomState();
  const { localParticipant, subscribeEvent, unsubscribeEvent } = useRoomParticipantState();

  function sendNotice(event: string, targetName: string) {
    void sendProtocolMessage(businessID, event, { targetName }).catch(() => {});
  }

  function onParticipantJoined({ userInfo }: { userInfo: RoomUser }) {
    if (localParticipant.value?.role !== RoomParticipantRole.Owner) return;
    sendNotice('member-enter', displayName(userInfo));
  }

  function onParticipantLeft({ userInfo }: { userInfo: RoomUser }) {
    if (localParticipant.value?.role !== RoomParticipantRole.Owner) return;
    sendNotice('member-leave', displayName(userInfo));
  }

  watch(
    () => currentRoom.value?.roomId,
    (roomId, _previousRoomId, onCleanup) => {
      if (!roomId) {
        return;
      }
      subscribeEvent(RoomParticipantEvent.onParticipantJoined, onParticipantJoined);
      subscribeEvent(RoomParticipantEvent.onParticipantLeft, onParticipantLeft);
      onCleanup(() => {
        unsubscribeEvent(RoomParticipantEvent.onParticipantJoined, onParticipantJoined);
        unsubscribeEvent(RoomParticipantEvent.onParticipantLeft, onParticipantLeft);
      });
    },
    { immediate: true },
  );
}

// --- Registered protocols ----------------------------------------------------

/** Education class events: the member-notice protocol of the education scene. */
export const EDU_CLASS_EVENT_ID = 'edu_class_event';

/** Education trophy awards: a pure real-time celebration signal, never rendered in chat. */
export const EDU_TROPHY_EVENT_ID = 'edu_trophy_event';
