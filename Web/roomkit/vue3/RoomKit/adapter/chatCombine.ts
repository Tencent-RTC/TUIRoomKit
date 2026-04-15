import { watch } from 'vue';
import { TUIConstants, TUICore, TUILogin } from '@tencentcloud/tui-core-lite';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { RoomInfo, RoomParticipantEvent, RoomUser, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { conference } from './conference';
import { RoomEvent } from './type';

const { currentRoom, joinRoom } = useRoomState();
const { participantList, getParticipantList, subscribeEvent } = useRoomParticipantState();
let conferenceLoginPromise: Promise<void> | null = null;
let conferenceLoginUserId = '';
let latestParticipantRoomId = '';
const ROOM_DISMISS_CONFIRM_DELAY = 200;
const dismissedRoomIdSet = new Set<string>();
const pendingParticipantEmptyTimerMap = new Map<string, ReturnType<typeof setTimeout>>();
const pendingParticipantEmptyListMap = new Map<string, Array<{ avatarUrl: string; userId: string; userName: string }>>();

const clearPendingParticipantEmptyTimer = (roomId: string) => {
  const timer = pendingParticipantEmptyTimerMap.get(roomId);
  if (!timer) {
    return;
  }
  clearTimeout(timer);
  pendingParticipantEmptyTimerMap.delete(roomId);
};

const emitParticipantListChange = (roomId: string, participantSnapshot: Array<{ avatarUrl: string; userId: string; userName: string }>) => {
  TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.PARTICIPANT_LIST_CHANGE, {
    roomId,
    participantList: participantSnapshot,
  });
};

const ensureConferenceLogin = async () => {
  const { SDKAppID, userID, userSig } = TUILogin.getContext();
  if (!SDKAppID || !userID || !userSig) {
    throw new Error('Missing conference login credentials');
  }

  if (conferenceLoginPromise && conferenceLoginUserId === userID) {
    await conferenceLoginPromise;
    return;
  }

  conferenceLoginUserId = userID;
  conferenceLoginPromise = conference.login({
    sdkAppId: SDKAppID,
    userId: userID,
    userSig,
  }).catch((error: unknown) => {
    conferenceLoginPromise = null;
    conferenceLoginUserId = '';
    throw error;
  });

  await conferenceLoginPromise;
};

TUICore.registerService(TUIConstants.TUIRoom.SERVICE.NAME, {
  onCall: async (method: string, params: { roomId: string; options?: Record<string, any> }, callback?: (result?: any) => void) => {
    if (method !== TUIConstants.TUIRoom.SERVICE.METHOD.START_ROOM) {
      return;
    }
    try {
      await ensureConferenceLogin();
      await conference.start({
        roomId: params.roomId,
        options: params.options,
      });
      callback && callback();
    } catch (error) {
      callback && callback(error);
    }
  },
});

TUICore.registerEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.JOIN_ROOM, {
  onNotifyEvent: async (_eventName: string, subKey: string, params: { roomId: string }) => {
    if (subKey !== TUIConstants.TUIRoom.SERVICE.EVENT.JOIN_ROOM) {
      return;
    }
    if (currentRoom.value?.roomId === params.roomId) {
      TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_JOINED, {
        roomInfo: currentRoom.value,
      });
      return;
    }
    try {
      await joinRoom({ roomId: params.roomId });
    } catch (_error: any) {
      if (_error.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
        TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_NOT_EXIST, { roomId: params.roomId });
      }
    }
  },
});
const handleRoomDismiss = ({ roomInfo }: { roomInfo: RoomInfo }) => {
  const roomId = roomInfo?.roomId || '';
  if (roomId) {
    dismissedRoomIdSet.add(roomId);
    clearPendingParticipantEmptyTimer(roomId);
    const pendingParticipantList = pendingParticipantEmptyListMap.get(roomId);
    if (pendingParticipantList) {
      emitParticipantListChange(roomId, pendingParticipantList);
      pendingParticipantEmptyListMap.delete(roomId);
    }
  }
  TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_DISMISS, { roomInfo });
};

conference.on(RoomEvent.ROOM_DISMISS, handleRoomDismiss);

subscribeEvent(RoomParticipantEvent.onOwnerChanged, (options: { newOwner: RoomUser }) => {
  TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.OWNER_CHANGED, {
    ...options,
    roomId: currentRoom.value?.roomId || '',
  });
});

watch(
  () => currentRoom.value?.roomId,
  async (roomId, oldRoomId) => {
    if (roomId) {
      latestParticipantRoomId = roomId;
      dismissedRoomIdSet.delete(roomId);
      clearPendingParticipantEmptyTimer(roomId);
      pendingParticipantEmptyListMap.delete(roomId);
      const { participantList: list } = await getParticipantList({});
      TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.PARTICIPANT_LIST_CHANGE, {
        roomId,
        participantList: list,
      });
      TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_JOINED, {
        roomInfo: currentRoom.value,
      });
      return;
    }
    if (oldRoomId) {
      TUICore.notifyEvent(TUIConstants.TUIRoom.SERVICE.NAME, TUIConstants.TUIRoom.SERVICE.EVENT.ROOM_LEFT, {
        roomId: oldRoomId,
      });
    }
  },
);

watch(() => participantList.value.map(item => ({
  userId: item.userId,
  userName: item.userName,
  avatarUrl: item.avatarUrl,
})), (newList, oldList) => {
  const roomId = currentRoom.value?.roomId || latestParticipantRoomId;
  const currentUserId = TUILogin.getContext().userID;
  const previousCount = oldList?.length || 0;
  const nextCount = newList?.length || 0;

  if (currentRoom.value?.roomId) {
    latestParticipantRoomId = currentRoom.value.roomId;
  }
  if (!roomId) {
    return;
  }

  if (previousCount > 0 && nextCount === 0) {
    const previousParticipantList = [...oldList];
    pendingParticipantEmptyListMap.set(roomId, previousParticipantList);
    clearPendingParticipantEmptyTimer(roomId);

    const timer = setTimeout(() => {
      pendingParticipantEmptyTimerMap.delete(roomId);
      const pendingParticipantList = pendingParticipantEmptyListMap.get(roomId) || previousParticipantList;
      const nextParticipantList = dismissedRoomIdSet.has(roomId)
        ? pendingParticipantList
        : pendingParticipantList.filter(item => item.userId !== currentUserId);

      emitParticipantListChange(roomId, nextParticipantList);
      pendingParticipantEmptyListMap.delete(roomId);
      dismissedRoomIdSet.delete(roomId);
    }, ROOM_DISMISS_CONFIRM_DELAY);
    pendingParticipantEmptyTimerMap.set(roomId, timer);

    if (!currentRoom.value?.roomId) {
      latestParticipantRoomId = '';
    }
  }
});
