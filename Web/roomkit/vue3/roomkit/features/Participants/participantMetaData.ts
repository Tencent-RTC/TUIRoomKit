import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

/**
 * Member-metadata access layer for the whole kit. A feature keeps
 * per-member state (trophy count, board permission, stars...) in
 * `participant.metaData`: one write and the engine syncs it to everyone,
 * late joiners read it from the roster, no extra signaling message.
 * This layer only reads records and writes patches; what the values
 * mean is each feature's own business.
 *
 * - Read: one member's record, straight from the store.
 * - Write: a patch merged over the store's latest synced record, queued
 *   per member so rapid writes run in issue order. The engine replaces
 *   the whole record, so without the merge one feature's write would
 *   wipe the keys every other feature owns.
 */

/** One write queue per member: rapid writes run in issue order, none dropped. */
const writeChains = new Map<string, Promise<void>>();

/** Reads one member's whole metadata record; never undefined. */
export function readParticipantMetaData(
  participant: Pick<RoomParticipant, 'metaData'>,
): Record<string, string> {
  return participant.metaData ?? {};
}

/**
 * Merges a patch into one member's metadata and writes it. Only the
 * patch's keys are overwritten; other keys keep the store's latest
 * synced values. Writes queue per member: rapid writes run one after
 * another in issue order, none dropped. A failure rejects this write
 * only; the member's queue keeps serving the writes behind it.
 *
 * Deliberately not serialized through the shared participant busy lock:
 * that lock drops calls made while another member action runs, which
 * would lose rapid interactions.
 */
export function writeParticipantMetaData(
  userId: string,
  patch: Record<string, string>,
): Promise<void> {
  const { updateParticipantMetaData, participantList } = useRoomParticipantState();
  const previous = writeChains.get(userId) ?? Promise.resolve();
  const run = previous.then(async () => {
    const live = participantList.value.find(member => member.userId === userId)?.metaData ?? {};
    const merged = { ...live, ...patch };
    await updateParticipantMetaData({ userId, metaData: merged });
  });
  // The queue itself never rejects: a failed write must not block the
  // writes behind it. Callers observe the failure through `run`.
  const chain = run.catch(() => {});
  writeChains.set(userId, chain);
  void chain.then(() => {
    if (writeChains.get(userId) === chain) {
      writeChains.delete(userId);
    }
  });
  return run;
}
