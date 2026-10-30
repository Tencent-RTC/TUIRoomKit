import { ref, watch } from 'vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { getChannel } from 'tuikit-atomicx-vue3/chat';
import { TUIToast, t } from '../../../base';
import { participantDisplayName } from '../../Participants/participantData';
import { writeParticipantMetaData } from '../../Participants/participantMetaData';
import { EDU_TROPHY_EVENT_ID, parseCustomEnvelope, sendProtocolMessage } from '../../Chat/customMessage';
import awardChimeUrl from './assets/trophy-award.mp3';

/**
 * Trophy award, the first EDU teaching tool. Two channels, one record:
 *
 * - The count lives in the member metadata (`trophy` key) and is the only
 *   persisted state; late joiners and refreshed clients read it as a snapshot
 *   for the roster cells, sorting and the tile badges.
 * - The celebration rides a real-time custom message on the room chat group
 *   (`edu_trophy_event`). Live pushes reach every member present in the room;
 *   roaming history never replays it, so a stored count landing on a fresh
 *   client never celebrates. A failed write only shows the failure toast and
 *   never celebrates; a failed message send drops the animation only — the
 *   count still stands.
 *
 * This module owns the trophy key, the celebration message and everything an
 * award means; the shared participant-metaData layer only reads records and
 * writes patches, the shared custom-message layer only carries the wire.
 */

/** Trophy count key inside `RoomParticipant.metaData`. */
export const ROSTER_TROPHY_KEY = 'trophy';

/** One award celebration; the fx overlay removes itself after this. */
export const TROPHY_FX_DURATION_MS = 3000;

export interface TrophyFxItem {
  seq: number;
  userId: string;
  name: string;
}

const trophyFxQueue = ref<TrophyFxItem[]>([]);
let fxSeq = 0;

/** One shared element: overlapping awards restart the chime instead of piling up. */
const awardChime = typeof Audio !== 'undefined' ? new Audio(awardChimeUrl) : null;

/** Plays the award chime; autoplay policies only defer it, never break the fx. */
function playAwardChime(): void {
  if (!awardChime) {
    return;
  }
  awardChime.currentTime = 0;
  awardChime.play().catch(() => {});
}

/** Read-only queue consumed by the Trophy celebration component. */
export function useTrophyFxQueue() {
  return trophyFxQueue;
}

/**
 * Pushes one celebration. Consecutive awards each play out in full —
 * a new one never cuts the previous short.
 */
function pushTrophyFx(userId: string, name: string): void {
  const seq = ++fxSeq;
  trophyFxQueue.value = [...trophyFxQueue.value, { seq, userId, name }];
  playAwardChime();
  setTimeout(() => {
    trophyFxQueue.value = trophyFxQueue.value.filter(item => item.seq !== seq);
  }, TROPHY_FX_DURATION_MS);
}

/** Trophy count shown on the roster cells and used for sorting. */
export function readTrophyCount(participant: Pick<RoomParticipant, 'metaData'>): number {
  return Number.parseInt(String(participant.metaData?.[ROSTER_TROPHY_KEY] ?? ''), 10) || 0;
}

/** Reads a member's settled count from the store; 0 when the member is gone. */
function readSettledCount(userId: string): number {
  const { participantList } = useRoomParticipantState();
  const member = participantList.value.find(item => item.userId === userId);
  return member ? readTrophyCount(member) : 0;
}

/** Upper bound for the engine sync of a write to land; the queue moves on after it. */
const SYNC_LANDING_TIMEOUT_MS = 3000;

/**
 * Resolves once the member's settled count reaches `expected` — the
 * write's sync landing on this client. The sync can overtake the write's
 * ack, so the current value is checked before watching; the timeout lets
 * the queue move on even if the sync event never arrives.
 */
function waitForCountLanding(userId: string, expected: number): Promise<void> {
  if (readSettledCount(userId) >= expected) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = watch(
      () => readSettledCount(userId),
      (count) => {
        if (count >= expected) {
          stop();
          clearTimeout(timer);
          resolve();
        }
      },
    );
    timer = setTimeout(() => {
      stop();
      resolve();
    }, SYNC_LANDING_TIMEOUT_MS);
  });
}

/** One send queue per member: each award waits for the previous one to settle. */
const sendQueues = new Map<string, Promise<void>>();

/**
 * Sends one trophy to a member. Award writes queue per member: each one
 * computes `settled + 1` from the store, writes it, then waits for the
 * engine sync to land before the next queued award runs — so every base
 * is a value the room has actually settled. After the write acks, one
 * celebration message goes out on the room chat group; a failed write
 * only shows the failure toast and never celebrates.
 */
export function sendTrophy(participant: RoomParticipant): Promise<void> {
  const { userId } = participant;
  const previous = sendQueues.get(userId) ?? Promise.resolve();
  const run = previous.then(async () => {
    const count = readSettledCount(userId) + 1;
    await writeParticipantMetaData(userId, { [ROSTER_TROPHY_KEY]: String(count) });
    // The celebration is a real-time message, not a count delta: everyone in
    // the room plays it once; roaming history never replays it.
    void sendProtocolMessage(EDU_TROPHY_EVENT_ID, 'award', {
      userId,
      name: participantDisplayName(participant),
    }).catch(() => {
      console.warn('[EduTools] trophy celebration message failed');
    });
    await waitForCountLanding(userId, count);
  }).catch((error) => {
    console.error('[EduTools] trophy write failed:', error);
    TUIToast.error(t('Education.Roster.TrophyFailure'));
  });
  sendQueues.set(userId, run);
  void run.then(() => {
    if (sendQueues.get(userId) === run) {
      sendQueues.delete(userId);
    }
  });
  return run;
}

/**
 * Celebrates every award message pushed while this watcher runs. Binds the
 * room's IM group on the channel first — `messageListOnEvent` serves the
 * active conversation's store, so the subscription must follow the binding.
 * History pulls stay silent: only live pushes celebrate, so the count
 * snapshot a joiner or a refreshed client reads never fires the fx.
 * Mount once per scene (Trophy.vue does it).
 */
export function useTrophyEventWatcher(): void {
  const { currentRoom } = useRoomState();

  watch(
    () => currentRoom.value?.roomId,
    (roomId, previousRoomId, onCleanup) => {
      if (!roomId) {
        // Release the previous room's IM group binding.
        if (previousRoomId) {
          getChannel(previousRoomId).getSnapshot().setActiveConversation(undefined);
        }
        return;
      }
      const { setActiveConversation, messageListOnEvent } = getChannel(roomId).getSnapshot();
      setActiveConversation(`GROUP${roomId}`);
      onCleanup(messageListOnEvent((event) => {
        if (event.type !== 'onReceiveNewMessage') {
          return;
        }
        const envelope = parseCustomEnvelope(event.message);
        if (!envelope || envelope.businessID !== EDU_TROPHY_EVENT_ID || envelope.event !== 'award') {
          return;
        }
        const userId = String(envelope.data.userId ?? '');
        if (!userId) {
          return;
        }
        pushTrophyFx(userId, String(envelope.data.name ?? '') || userId);
      }));
    },
    { immediate: true },
  );
}
