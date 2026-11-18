import { useEffect, useRef, useSyncExternalStore } from 'react';
import { roomParticipantClient, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

/**
 * Member-metadata access layer for the whole kit. A feature keeps
 * per-member state (trophy count, board permission, stars...) in
 * `participant.metaData`: one write and the engine syncs it to everyone,
 * late joiners read it from the roster, no extra signaling message.
 * This layer only reads records and writes patches; what the values
 * mean is each feature's own business.
 *
 * - Read: one member's record, with successful local writes until the SDK supplies a new record.
 * - Write: a patch merged over the latest synced or acknowledged record, queued
 *   per member so rapid writes run in issue order. The engine replaces
 *   the whole record, so without the merge one feature's write would
 *   wipe the keys every other feature owns.
 */

/** One write queue per member: rapid writes run in issue order, none dropped. */
const writeChains = new Map<string, Promise<void>>();

interface AcknowledgedMetaData {
  source: RoomParticipant['metaData'];
  metaData: Record<string, string>;
}

let metadataRoomId: string | undefined;
let acknowledgedMetaData = new Map<string, AcknowledgedMetaData>();
const metadataListeners = new Set<() => void>();

function subscribeMetaData(listener: () => void): () => void {
  metadataListeners.add(listener);
  return () => {
    metadataListeners.delete(listener);
  };
}

function getMetaDataSnapshot() {
  return acknowledgedMetaData;
}

function publishMetaData(next: Map<string, AcknowledgedMetaData>) {
  acknowledgedMetaData = next;
  metadataListeners.forEach(listener => listener());
}

function readAcknowledgedMetaData(participant: RoomParticipant, roomId: string | undefined) {
  const acknowledged = roomId === metadataRoomId ? acknowledgedMetaData.get(participant.userId) : undefined;
  const synced = readParticipantMetaData(participant);
  // Valtio snapshot proxies differ between readers; compare values, not references.
  // Changed SDK metadata supersedes the local acknowledgement, including remote edits.
  const isUnchanged = acknowledged
    && Object.keys(synced).length === Object.keys(acknowledged.source).length
    && Object.entries(synced).every(([key, value]) => acknowledged.source[key] === value);
  return isUnchanged ? acknowledged.metaData : synced;
}

/** Successful writes stay visible even when the engine does not echo them to the writer. */
export function useParticipantMetaData() {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom?.roomId;
  useSyncExternalStore(subscribeMetaData, getMetaDataSnapshot, getMetaDataSnapshot);
  useEffect(() => {
    if (metadataRoomId !== roomId) {
      metadataRoomId = roomId;
      publishMetaData(new Map());
    }
  }, [roomId]);
  return (participant: RoomParticipant) => readAcknowledgedMetaData(participant, roomId);
}

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
 *
 * React hooks return render snapshots, so the hook keeps the latest roster in a
 * ref; a queued write merges over whatever the store held when its turn came.
 */
export function useWriteParticipantMetaData() {
  const { participantList } = useRoomParticipantState();
  const roomState = useRoomState();
  useParticipantMetaData();
  const participantListRef = useRef(participantList);
  participantListRef.current = participantList;

  return function writeParticipantMetaData(
    userId: string,
    patch: Record<string, string>,
  ): Promise<void> {
    const roomId = roomState.currentRoom?.roomId;
    const previous = writeChains.get(userId) ?? Promise.resolve();
    const run = previous.then(async () => {
      const participant = participantListRef.current.find(member => member.userId === userId);
      const live = participant ? readAcknowledgedMetaData(participant, roomId) : {};
      const merged = { ...live, ...patch };
      await roomParticipantClient.updateParticipantMetaData({ userId, metaData: merged });
      if (roomId === roomState.currentRoom?.roomId && roomId === metadataRoomId && participant) {
        const next = new Map(acknowledgedMetaData);
        next.set(userId, { source: { ...participant.metaData }, metaData: merged });
        publishMetaData(next);
      }
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
  };
}
