import { computed, effectScope, readonly, ref, watch } from 'vue';
import {
  RoomParticipantStatus,
  RoomEvent,
  RoomCallResult,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';

import type { RoomCall, RoomInfo } from 'tuikit-atomicx-vue3/room';

export type InvitationFailure = 'no-room' | 'empty' | 'failed';

export const CALL_TIMEOUT_SECONDS = 60;

const isBusy = ref(false);
const recentCallFailures = ref(new Set<string>());
const outgoingCalls = new Set<string>();
const failureTimers = new Map<string, ReturnType<typeof setTimeout>>();
const scope = effectScope(true);
let bound = false;
let roomGeneration = 0;

function clearCall(userId: string) {
  outgoingCalls.delete(userId);
  recentCallFailures.value.delete(userId);
  clearTimeout(failureTimers.get(userId));
  failureTimers.delete(userId);
}

function failCall(userId: string) {
  if (!outgoingCalls.has(userId)) {
    return;
  }
  clearCall(userId);
  recentCallFailures.value.add(userId);
  failureTimers.set(userId, setTimeout(() => clearCall(userId), 2000));
}

export function useInvitation() {
  const { currentRoom, callUserToRoom, cancelCall, subscribeEvent, unsubscribeEvent } = useRoomState();
  const { pendingParticipantList, participantList } = useRoomParticipantState();

  const { loginUserInfo } = useLoginState();

  if (!bound) {
    bound = true;
    scope.run(() => {
      watch(() => currentRoom.value?.roomId, (roomId, _previous, onCleanup) => {
        roomGeneration += 1;
        isBusy.value = false;
        for (const userId of new Set([...outgoingCalls, ...failureTimers.keys()])) {
          clearCall(userId);
        }
        if (!roomId) {
          return;
        }
        const generation = roomGeneration;
        const isOwnCall = ({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) => (
          generation === roomGeneration && roomInfo.roomId === roomId
          && call.caller.userId === loginUserInfo.value?.userId
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
        subscribeEvent(RoomEvent.onCallRejected, onFailure);
        subscribeEvent(RoomEvent.onCallTimeout, onFailure);
        subscribeEvent(RoomEvent.onCallAccepted, onFinished);
        subscribeEvent(RoomEvent.onCallCancelled, onFinished);
        onCleanup(() => {
          unsubscribeEvent(RoomEvent.onCallRejected, onFailure);
          unsubscribeEvent(RoomEvent.onCallTimeout, onFailure);
          unsubscribeEvent(RoomEvent.onCallAccepted, onFinished);
          unsubscribeEvent(RoomEvent.onCallCancelled, onFinished);
        });
      }, { immediate: true, flush: 'sync' });
      watch(() => participantList.value.map(item => item.userId), (userIds) => {
        userIds.forEach(clearCall);
      }, { flush: 'sync' });
    });
  }

  const idlePending = computed(() =>
    pendingParticipantList.value.filter(item => item.roomStatus !== RoomParticipantStatus.InCalling),
  );
  const ringingPending = computed(() =>
    pendingParticipantList.value.filter(item => item.roomStatus === RoomParticipantStatus.InCalling),
  );

  async function inviteUsers(userIdList: string[]): Promise<InvitationFailure | undefined> {
    const roomId = currentRoom.value?.roomId;
    if (!roomId) {
      return 'no-room';
    }
    if (userIdList.length === 0) {
      return 'empty';
    }
    if (isBusy.value) {
      return undefined;
    }
    const generation = roomGeneration;
    userIdList.forEach((userId) => {
      clearCall(userId);
      outgoingCalls.add(userId);
    });
    isBusy.value = true;
    try {
      const results = await callUserToRoom({
        roomId,
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
        isBusy.value = false;
      }
    }
  }

  async function cancelInvitation(userIdList: string[]): Promise<InvitationFailure | undefined> {
    const roomId = currentRoom.value?.roomId;
    if (!roomId) {
      return 'no-room';
    }
    if (userIdList.length === 0) {
      return 'empty';
    }
    if (isBusy.value) {
      return undefined;
    }
    const generation = roomGeneration;
    userIdList.forEach(clearCall);
    isBusy.value = true;
    try {
      await cancelCall({ roomId, userIdList });
      return undefined;
    } catch (error) {
      console.error('[RoomKit.cancelInvitation] Failed to cancel invitation:', error);
      return 'failed';
    } finally {
      if (generation === roomGeneration) {
        isBusy.value = false;
      }
    }
  }

  async function callAllPending(): Promise<InvitationFailure | undefined> {
    return inviteUsers(idlePending.value.map(item => item.userId));
  }

  return {
    isBusy: readonly(isBusy),
    recentCallFailures: readonly(recentCallFailures),
    idlePending,
    ringingPending,
    inviteUsers,
    cancelInvitation,
    callAllPending,
  };
}
