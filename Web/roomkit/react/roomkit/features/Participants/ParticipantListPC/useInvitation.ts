import { useEffect, useSyncExternalStore } from 'react';
import {
  RoomParticipantStatus,
  RoomEvent,
  RoomCallResult,
  roomClient,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';

import type { RoomCall, RoomInfo } from 'tuikit-atomicx-react/room';

export type InvitationFailure = 'no-room' | 'empty' | 'failed';

export const CALL_TIMEOUT_SECONDS = 60;

interface InvitationSnapshot {
  isBusy: boolean;
  recentCallFailures: ReadonlySet<string>;
}

let snapshot: InvitationSnapshot = { isBusy: false, recentCallFailures: new Set<string>() };
const listeners = new Set<() => void>();
const outgoingCalls = new Set<string>();
const failureTimers = new Map<string, ReturnType<typeof setTimeout>>();
let bound = false;
let watchedRoomId: string | undefined;
let cleanupRoomWatch: (() => void) | null = null;
let participantIdsKey: string | null = null;
let roomGeneration = 0;
/** Latest login user id, refreshed by every hook render for the detached event handlers. */
let loginUserId: string | undefined;

function emitChange() {
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): InvitationSnapshot {
  return snapshot;
}

function setBusy(next: boolean) {
  if (snapshot.isBusy === next) {
    return;
  }
  snapshot = { ...snapshot, isBusy: next };
  emitChange();
}

function updateFailures(update: (next: Set<string>) => void) {
  const next = new Set(snapshot.recentCallFailures);
  update(next);
  if (next.size === snapshot.recentCallFailures.size
    && [...next].every(userId => snapshot.recentCallFailures.has(userId))) {
    return;
  }
  snapshot = { ...snapshot, recentCallFailures: next };
  emitChange();
}

function clearCall(userId: string) {
  outgoingCalls.delete(userId);
  updateFailures(next => next.delete(userId));
  clearTimeout(failureTimers.get(userId));
  failureTimers.delete(userId);
}

function failCall(userId: string) {
  if (!outgoingCalls.has(userId)) {
    return;
  }
  clearCall(userId);
  updateFailures(next => next.add(userId));
  failureTimers.set(userId, setTimeout(() => clearCall(userId), 2000));
}

function onRoomIdChange(roomId: string | undefined) {
  cleanupRoomWatch?.();
  cleanupRoomWatch = null;
  roomGeneration += 1;
  setBusy(false);
  for (const userId of new Set([...outgoingCalls, ...failureTimers.keys()])) {
    clearCall(userId);
  }
  if (!roomId) {
    return;
  }
  const generation = roomGeneration;
  const isOwnCall = ({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) => (
    generation === roomGeneration && roomInfo.roomId === roomId
    && call.caller.userId === loginUserId
  );
  const onFailure = (event: { roomInfo: RoomInfo; call: RoomCall }) => {
    if (isOwnCall(event)) {
      failCall(event.call.callee.userId);
    }
  };
  const onFinished = (event: { roomInfo: RoomInfo; call: RoomCall }) => {
    if (isOwnCall(event)) {
      clearCall(event.call.callee.userId);
    }
  };
  roomClient.subscribeEvent(RoomEvent.onCallRejected, onFailure);
  roomClient.subscribeEvent(RoomEvent.onCallTimeout, onFailure);
  roomClient.subscribeEvent(RoomEvent.onCallAccepted, onFinished);
  roomClient.subscribeEvent(RoomEvent.onCallCancelled, onFinished);
  cleanupRoomWatch = () => {
    roomClient.unsubscribeEvent(RoomEvent.onCallRejected, onFailure);
    roomClient.unsubscribeEvent(RoomEvent.onCallTimeout, onFailure);
    roomClient.unsubscribeEvent(RoomEvent.onCallAccepted, onFinished);
    roomClient.unsubscribeEvent(RoomEvent.onCallCancelled, onFinished);
  };
}

export function useInvitation() {
  // `currentRoom` is a live getter, so callbacks read it through the state object after awaits.
  const roomState = useRoomState();
  const { callUserToRoom, cancelCall } = roomState;
  const { pendingParticipantList, participantList } = useRoomParticipantState();

  const { loginUserInfo } = useLoginState();
  loginUserId = loginUserInfo?.userId;

  const { isBusy, recentCallFailures } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const roomId = roomState.currentRoom?.roomId;
  const userIdsKey = participantList.map(item => item.userId).join('\n');

  // Shared across instances: the first instance to observe a change runs it once, like Vue's single bound watch.
  // TODO(react-next): Vue binds these watches once in a detached effectScope with `flush: 'sync'`;
  // tuikit-atomicx-react exposes no store subscription outside React, so they run after render and
  // only while at least one component using this hook is mounted.
  useEffect(() => {
    if (bound && roomId === watchedRoomId) {
      return;
    }
    bound = true;
    watchedRoomId = roomId;
    onRoomIdChange(roomId);
  }, [roomId]);

  useEffect(() => {
    if (participantIdsKey === userIdsKey) {
      return;
    }
    const isFirstRun = participantIdsKey === null;
    participantIdsKey = userIdsKey;
    if (isFirstRun || !userIdsKey) {
      return;
    }
    userIdsKey.split('\n').forEach(clearCall);
  }, [userIdsKey]);

  const idlePending = pendingParticipantList.filter(item => item.roomStatus !== RoomParticipantStatus.InCalling);
  const ringingPending = pendingParticipantList.filter(item => item.roomStatus === RoomParticipantStatus.InCalling);

  async function inviteUsers(userIdList: string[]): Promise<InvitationFailure | undefined> {
    const currentRoomId = roomState.currentRoom?.roomId;
    if (!currentRoomId) {
      return 'no-room';
    }
    if (userIdList.length === 0) {
      return 'empty';
    }
    if (snapshot.isBusy) {
      return undefined;
    }
    const generation = roomGeneration;
    userIdList.forEach((userId) => {
      clearCall(userId);
      outgoingCalls.add(userId);
    });
    setBusy(true);
    try {
      const results = await callUserToRoom({
        roomId: currentRoomId,
        userIdList,
        timeout: CALL_TIMEOUT_SECONDS,
      });
      if (generation !== roomGeneration) {
        return 'no-room';
      }
      results.forEach((result, userId) => {
        if (result === RoomCallResult.AlreadyInCalling) {
          failCall(userId);
        } else if (result === RoomCallResult.AlreadyInRoom) {
          clearCall(userId);
        }
      });
      return undefined;
    } catch (error) {
      if (generation === roomGeneration) {
        userIdList.forEach(clearCall);
      }
      console.error('[RoomKit.inviteUsers] Failed to invite users:', error);
      return 'failed';
    } finally {
      if (generation === roomGeneration) {
        setBusy(false);
      }
    }
  }

  async function cancelInvitation(userIdList: string[]): Promise<InvitationFailure | undefined> {
    const currentRoomId = roomState.currentRoom?.roomId;
    if (!currentRoomId) {
      return 'no-room';
    }
    if (userIdList.length === 0) {
      return 'empty';
    }
    if (snapshot.isBusy) {
      return undefined;
    }
    const generation = roomGeneration;
    userIdList.forEach(clearCall);
    setBusy(true);
    try {
      await cancelCall({ roomId: currentRoomId, userIdList });
      return undefined;
    } catch (error) {
      console.error('[RoomKit.cancelInvitation] Failed to cancel invitation:', error);
      return 'failed';
    } finally {
      if (generation === roomGeneration) {
        setBusy(false);
      }
    }
  }

  async function callAllPending(): Promise<InvitationFailure | undefined> {
    return inviteUsers(idlePending.map(item => item.userId));
  }

  return {
    isBusy,
    recentCallFailures,
    idlePending,
    ringingPending,
    inviteUsers,
    cancelInvitation,
    callAllPending,
  };
}
