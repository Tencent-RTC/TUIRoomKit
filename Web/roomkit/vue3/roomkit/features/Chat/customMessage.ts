import { getChannel, MessageStatus, MessageType } from 'tuikit-atomicx-vue3/chat';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import { useRoomState } from 'tuikit-atomicx-vue3/room';

/**
 * Chat custom-message protocol layer on the room chat group. Every custom
 * message, whatever feature owns it, follows one wire envelope:
 *   { businessID: '<protocol id>', event: '<action>', data: { ... } }
 *
 * This module stays generic on purpose: it only knows the envelope — how to
 * parse one, how to recognize a protocol by its id, and how to deliver one.
 * Each protocol registers its id here; what a feature does with a protocol
 * lives with the feature (see RoomChat/memberNotice.ts for the presence
 * notice business).
 *
 * Custom messages ride the room IM group so everyone — including late joiners
 * reading roaming history — sees the same timeline. Reserved SDK values (call
 * signaling, `user_typing_status`) are already filtered by the chat core
 * before reaching the list.
 */

/** Wire envelope shared by all custom messages. */
export interface CustomMessageEnvelope {
  businessID: string;
  event: string;
  data: Record<string, unknown>;
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

/** Whether the message belongs to the protocol registered under this id. */
export function isProtocolMessage(message: MessageInfo, protocolId: string): boolean {
  const envelope = parseCustomEnvelope(message);
  return envelope !== undefined && envelope.businessID === protocolId;
}

/**
 * Publishes one protocol message into the room chat group. Fire-and-forget
 * semantics belong to the caller: a failed send drops that one message
 * (notice line, celebration), the room itself keeps working. Binding the
 * conversation on the channel is also the caller's job — an unbound channel
 * resolves without delivering. `option` reaches the channel send verbatim.
 */
export function sendProtocolMessage(
  protocolId: string,
  event: string,
  data: Record<string, unknown>,
  option?: ProtocolSendOption,
): Promise<void> {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom.value?.roomId || '';
  if (!roomId) {
    return Promise.resolve();
  }
  // Wire envelope shared by all custom messages: { businessID, event, data }.
  const customData = JSON.stringify({ businessID: protocolId, event, data });
  return getChannel(roomId).getSnapshot()
    .sendMessage({ type: 'customMessage', customData, description: '' }, option)
    .then(() => undefined);
}

/**
 * Delivers one protocol message on the room chat group, binding the
 * conversation first: an unbound channel resolves sendMessage without
 * delivering, and a feature's first send can beat the chat panel's mount.
 */
export function sendNotice(
  protocolId: string,
  roomId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  getChannel(roomId).getSnapshot().setActiveConversation(`GROUP${roomId}`);
  return sendProtocolMessage(protocolId, event, data);
}

// --- Registered protocols ----------------------------------------------------

/**
 * A protocol message is shared state only after the group accepts it.
 * `sendBegin` inserts the local row while it is still `Sending`, and a
 * rejected send can stay there as `Sending` or `SendFail`. Neither reached
 * the group, so derivations skip anything that is not `SendSuccess`.
 */
function isDeliveredMessage(message: MessageInfo): boolean {
  return message.status === MessageStatus.SendSuccess;
}

/** Scans newest-first for the last event of one protocol matching `events`. */
export function latestProtocolEvent(
  messages: readonly MessageInfo[],
  protocolId: string,
  events: readonly string[],
): CustomMessageEnvelope | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const envelope = isDeliveredMessage(message) ? parseCustomEnvelope(message) : undefined;
    if (envelope && envelope.businessID === protocolId && events.includes(envelope.event)) {
      return envelope;
    }
  }
  return undefined;
}

/** Education class events: member enter/leave notices of the education scene. */
export const EDU_CLASS_EVENT_ID = 'edu_class_event';

/** Class-wide chat silence: the silence state and its timeline lines. Scene-neutral. */
export const SILENCE_ALL_EVENT_ID = 'silence_all_event';

/**
 * Small-class microphone mute-all. Students read these timeline lines;
 * the operator still toasts, and students do not.
 */
export const MIC_MUTE_ALL_EVENT_ID = 'mic_mute_all_event';

/** Education trophy awards: a pure real-time celebration signal, never rendered in chat. */
export const EDU_TROPHY_EVENT_ID = 'edu_trophy_event';
