import { ref, watch } from 'vue';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { getChannel } from 'tuikit-atomicx-vue3/chat';
import { TUIToast, t } from '../../../base';
import { toastRoomError } from '../../../utils/roomError';
import { participantDisplayName } from '../../Participants/participantData';
import { writeParticipantMetaData } from '../../Participants/participantMetaData';
import { EDU_TROPHY_EVENT_ID, parseCustomEnvelope, sendProtocolMessage } from '../../Chat/customMessage';
import awardChimeUrl from './assets/trophy-award.mp3';
import silentUnlockUrl from './assets/silent-unlock.wav';

/**
 * Trophy award, the first EDU teaching tool. Two channels, one record:
 *
 * - The count lives in the member metadata (`trophy` key) and is the only
 *   persisted state; late joiners and refreshed clients read it as a snapshot
 *   for the roster cells, sorting and the tile badges.
 * - The celebration rides a real-time, online-only custom message on the
 *   room chat group (`edu_trophy_event`). Live pushes reach every member
 *   online in the room; TIM drops the message for everyone else, so roaming
 *   history, offline sync and a page refresh can never replay it. A
 *   successful write toasts the awarder; the live message toasts everyone
 *   else, and the awarded member hears the self wording. A failed write
 *   only shows the failure toast and never celebrates; a failed message send
 *   drops the animation only — the count still stands.
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

/**
 * Autoplay policies gate programmatic play() without a user gesture, and the
 * celebration runs from the IM message callback, outside any gesture — so
 * Safari-family browsers drop the chime for every receiver until the element
 * is blessed. The first pointerdown blesses the element by playing a short
 * clip of true silence, then restores the real asset; later chimes play for
 * real. The pre-play is inaudible by content, not by muting flags: iOS
 * Safari's media pipeline ignores both the muted property and the muted
 * content attribute, and even keeps rendering after pause() — no flag can be
 * trusted there, silence can.
 */
let chimeUnlockDone = false;

function unlockAwardChime(): void {
  if (chimeUnlockDone || !awardChime) {
    return;
  }
  chimeUnlockDone = true;
  if (!awardChime.paused) {
    return;
  }
  // Play true silence instead of the award asset: even if the pipeline
  // ignores every muting flag, real silence cannot be played out loud.
  // Swapping back keeps later award plays on the blessed element.
  awardChime.src = silentUnlockUrl;
  awardChime.play().then(() => {
    awardChime.src = awardChimeUrl;
  }).catch(() => {
    awardChime.src = awardChimeUrl;
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlockAwardChime, { once: true, capture: true });
}

/**
 * Plays the award chime. A policy-rejected play drops the chime only — the
 * celebration fx never depends on it — and the unlock listener above blesses
 * the element on the first gesture so the rejection stops recurring.
 */
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

/** Minimum gap between two awards to the same member: one trophy per student per second. */
const AWARD_MIN_INTERVAL_MS = 1000;

/** Entry time of the last award per member; the throttle drops anything inside the gap. */
const lastAwardAt = new Map<string, number>();

/**
 * Sends one trophy to a member. Awards are throttled per member — one per
 * second: a second attempt inside the gap is dropped whole, with no write,
 * toast or fx. The surviving writes queue per member: each one computes
 * `settled + 1` from the store, writes it, then waits for the engine sync
 * to land before the next queued award runs — so every base is a value the
 * room has actually settled. After the write acks, one celebration message
 * goes out on the room chat group; a failed write only shows the failure
 * toast and never celebrates, and it releases the throttle so the "retry"
 * it asks for is not silently dropped.
 */
export function sendTrophy(participant: RoomParticipant): Promise<void> {
  const { userId } = participant;
  const now = Date.now();
  if (now - (lastAwardAt.get(userId) ?? 0) < AWARD_MIN_INTERVAL_MS) {
    return Promise.resolve();
  }
  lastAwardAt.set(userId, now);
  const previous = sendQueues.get(userId) ?? Promise.resolve();
  const run = previous.then(async () => {
    const count = readSettledCount(userId) + 1;
    await writeParticipantMetaData(userId, { [ROSTER_TROPHY_KEY]: String(count) });
    // The awarder is told here. Everyone else is told from the live message,
    // so a failed send still leaves the awarder with this toast.
    TUIToast.info(t('Education.Toast.Trophy', { name: participantDisplayName(participant) }));
    // The celebration is a real-time, online-only message, not a count
    // delta: everyone in the room plays it once, TIM drops it for members
    // not online at send time, and the roaming history never carries it —
    // so an exit/rejoin or a page refresh can never replay the chime.
    void sendProtocolMessage(EDU_TROPHY_EVENT_ID, 'award', {
      userId,
      name: participantDisplayName(participant),
    }, { onlineUserOnly: true }).catch(() => {
      console.warn('[EduTools] trophy celebration message failed');
    });
    await waitForCountLanding(userId, count);
  }).catch((error) => {
    console.error('[EduTools] trophy write failed:', error);
    toastRoomError(error, { fallback: 'Education.Roster.TrophyFailure' });
    // A failed write never became an award; release the gap so the retry
    // the failure toast asks for is not swallowed by the throttle.
    lastAwardAt.delete(userId);
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
  const { localParticipant } = useRoomParticipantState();

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
        const name = String(envelope.data.name ?? '') || userId;
        const localId = localParticipant.value?.userId || '';
        const sentBySelf = event.message.isSentBySelf === true
          || (localId !== '' && event.message.from?.userID === localId);
        // The awarder already toasted on send. The awarded member hears the
        // self wording; everyone else hears the name.
        if (!sentBySelf) {
          const key = userId === localId ? 'Education.Toast.TrophySelf' : 'Education.Toast.Trophy';
          TUIToast.info(t(key, { name }));
        }
        pushTrophyFx(userId, name);
      }));
    },
    { immediate: true },
  );
}
