import { computed, effectScope, ref, watch } from 'vue';
import TUIRoomEngine, { TUIRequestAction, TUIRequestCallbackType, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import type { TUIRequest, TUIRequestCallback, TUISeatInfo } from '@tencentcloud/tuiroom-engine-js';
import { useLoginState, useRoomEngine, useRoomState } from 'tuikit-atomicx-vue3/room';

/**
 * Who is on stage and who is asking to get there, on top of the engine's seat model.
 * It stays scene-neutral and touches only atomicx and the engine, so it can move into
 * atomicx as-is later.
 */

export interface StageUser {
  userId: string;
  userName: string;
  avatarUrl: string;
}

export interface StageRequest extends StageUser {
  /** When the request was sent, in milliseconds. */
  timestamp: number;
}

/** Results the lists cannot show; arrivals and withdrawals show up in the lists themselves. */
export enum RoomStageEvent {
  /** To the applicant. */
  onStageApplicationAccepted = 'onStageApplicationAccepted',
  onStageApplicationRejected = 'onStageApplicationRejected',
  onStageApplicationTimeout = 'onStageApplicationTimeout',
  /** To the inviter; the listener gets the invitee. */
  onStageInvitationAccepted = 'onStageInvitationAccepted',
  onStageInvitationRejected = 'onStageInvitationRejected',
  onStageInvitationTimeout = 'onStageInvitationTimeout',
  /** To a member an admin took off the stage. */
  onRemovedFromStage = 'onRemovedFromStage',
}

type StageListener = (user?: StageRequest) => void;

/** conference rooms have no seat numbers; -1 lets the engine pick. */
const ANY_SEAT = -1;

const APPLICATION_RESULTS: Partial<Record<TUIRequestCallbackType, RoomStageEvent>> = {
  [TUIRequestCallbackType.kRequestAccepted]: RoomStageEvent.onStageApplicationAccepted,
  [TUIRequestCallbackType.kRequestRejected]: RoomStageEvent.onStageApplicationRejected,
  [TUIRequestCallbackType.kRequestTimeout]: RoomStageEvent.onStageApplicationTimeout,
};

const INVITATION_RESULTS: Partial<Record<TUIRequestCallbackType, RoomStageEvent>> = {
  [TUIRequestCallbackType.kRequestAccepted]: RoomStageEvent.onStageInvitationAccepted,
  [TUIRequestCallbackType.kRequestRejected]: RoomStageEvent.onStageInvitationRejected,
  [TUIRequestCallbackType.kRequestTimeout]: RoomStageEvent.onStageInvitationTimeout,
};

type UserFields = { userId: string; userName?: string; nameCard?: string; avatarUrl?: string };

function toStageUser(user: UserFields): StageUser {
  return {
    userId: user.userId,
    userName: user.nameCard || user.userName || user.userId,
    avatarUrl: user.avatarUrl ?? '',
  };
}

/** `fromUser` exists since engine v3.5; older builds only fill the flat fields. */
function toStageRequest(request: TUIRequest): StageRequest {
  const sender = request.fromUser?.userId ? request.fromUser : request;
  return { ...toStageUser(sender), timestamp: request.timestamp };
}

function createStage() {
  const roomEngine = useRoomEngine();
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();

  const stageList = ref<StageUser[]>([]);
  const stageApplicants = ref<StageRequest[]>([]);
  const stageInvitees = ref<StageRequest[]>([]);
  const localStageApplication = ref<StageRequest | null>(null);
  const localStageInvitation = ref<StageRequest | null>(null);

  // userId -> requestId; callers address requests by user.
  const applicationIds = new Map<string, string>();
  const invitationIds = new Map<string, string>();
  let localApplicationId = '';
  let localInvitationId = '';

  const listeners = new Map<RoomStageEvent, Set<StageListener>>();
  function emit(event: RoomStageEvent, user?: StageRequest) {
    listeners.get(event)?.forEach(listener => listener(user));
  }

  const isLocalOnStage = computed(() => (
    stageList.value.some(user => user.userId === loginUserInfo.value?.userId)
  ));

  function engine() {
    if (!roomEngine.instance) {
      throw new Error('[useRoomStage] the room engine is not ready');
    }
    return roomEngine.instance;
  }

  function setStageList(seatList: TUISeatInfo[]) {
    stageList.value = seatList.filter(seat => seat.userId).map(toStageUser);
  }

  function addApplicant(request: TUIRequest) {
    const applicant = toStageRequest(request);
    applicationIds.set(applicant.userId, request.requestId);
    stageApplicants.value = [...stageApplicants.value.filter(item => item.userId !== applicant.userId), applicant];
  }

  function removeApplicant(userId: string) {
    applicationIds.delete(userId);
    stageApplicants.value = stageApplicants.value.filter(item => item.userId !== userId);
  }

  function removeInvitee(userId: string) {
    invitationIds.delete(userId);
    stageInvitees.value = stageInvitees.value.filter(item => item.userId !== userId);
  }

  function clearLocalApplication() {
    localApplicationId = '';
    localStageApplication.value = null;
  }

  function clearLocalInvitation() {
    localInvitationId = '';
    localStageInvitation.value = null;
  }

  function reset() {
    stageList.value = [];
    stageApplicants.value = [];
    stageInvitees.value = [];
    applicationIds.clear();
    invitationIds.clear();
    clearLocalApplication();
    clearLocalInvitation();
  }

  // A room without seats rejects these calls, which leaves the lists empty.
  watch(() => currentRoom.value?.roomId, async (roomId) => {
    reset();
    const { instance } = roomEngine;
    if (!roomId || !instance) {
      return;
    }
    const [seatList, applications] = await Promise.all([
      instance.getSeatList().catch(() => []),
      // Only admins may read the applications.
      instance.getSeatApplicationList().catch(() => []),
    ]);
    if (currentRoom.value?.roomId !== roomId) {
      return;
    }
    setStageList(seatList);
    applications.forEach(addApplicant);
  }, { immediate: true });

  function onSeatListChanged({ seatList }: { seatList: TUISeatInfo[] }) {
    setStageList(seatList);
  }

  function onKickedOffSeat() {
    emit(RoomStageEvent.onRemovedFromStage);
  }

  function onRequestReceived({ request }: { request: TUIRequest }) {
    if (request.requestAction === TUIRequestAction.kRequestToTakeSeat) {
      addApplicant(request);
    } else if (request.requestAction === TUIRequestAction.kRequestRemoteUserOnSeat) {
      localInvitationId = request.requestId;
      localStageInvitation.value = toStageRequest(request);
    }
  }

  /** Withdrawn by the sender, or answered by another admin. */
  function onRequestSettled({ request }: { request: TUIRequest }) {
    if (request.requestAction === TUIRequestAction.kRequestToTakeSeat) {
      removeApplicant(toStageRequest(request).userId);
    } else if (request.requestAction === TUIRequestAction.kRequestRemoteUserOnSeat && request.requestId === localInvitationId) {
      clearLocalInvitation();
    }
  }

  const engineEvents = [
    [TUIRoomEvents.onSeatListChanged, onSeatListChanged],
    [TUIRoomEvents.onKickedOffSeat, onKickedOffSeat],
    [TUIRoomEvents.onRequestReceived, onRequestReceived],
    [TUIRoomEvents.onRequestCancelled, onRequestSettled],
    [TUIRoomEvents.onRequestProcessed, onRequestSettled],
  ] as const;

  function attach() {
    const { instance } = roomEngine;
    if (!instance) {
      return;
    }
    engineEvents.forEach(([event, handler]) => {
      instance.off(event, handler);
      instance.on(event, handler);
    });
  }

  attach();
  TUIRoomEngine.once('ready', attach);

  async function applyToStage(options: { timeout?: number } = {}): Promise<void> {
    const request = await engine().takeSeat({
      seatIndex: ANY_SEAT,
      timeout: options.timeout ?? 0,
      requestCallback: ({ requestCallbackType }: TUIRequestCallback) => {
        clearLocalApplication();
        const event = APPLICATION_RESULTS[requestCallbackType];
        if (event) {
          emit(event);
        }
      },
    });
    // Owners and admins go straight up without a request id.
    if (request.requestId) {
      const self = loginUserInfo.value;
      localApplicationId = request.requestId;
      localStageApplication.value = {
        ...toStageUser({ userId: self?.userId ?? '', userName: self?.userName, avatarUrl: self?.avatarUrl }),
        timestamp: Date.now(),
      };
    }
  }

  async function cancelStageApplication(): Promise<void> {
    if (!localApplicationId) {
      return;
    }
    await engine().cancelRequest({ requestId: localApplicationId });
    clearLocalApplication();
  }

  async function answerStageInvitation(agree: boolean): Promise<void> {
    if (!localInvitationId) {
      return;
    }
    await engine().responseRemoteRequest({ requestId: localInvitationId, agree });
    clearLocalInvitation();
  }

  async function leaveStage(): Promise<void> {
    await engine().leaveSeat();
  }

  async function answerStageApplication(userId: string, agree: boolean): Promise<void> {
    const requestId = applicationIds.get(userId);
    if (!requestId) {
      return;
    }
    await engine().responseRemoteRequest({ requestId, agree });
    removeApplicant(userId);
  }

  async function inviteToStage(options: { userId: string; timeout?: number }): Promise<void> {
    const { userId } = options;
    const request = await engine().takeUserOnSeatByAdmin({
      seatIndex: ANY_SEAT,
      userId,
      timeout: options.timeout ?? 0,
      requestCallback: ({ requestCallbackType }: TUIRequestCallback) => {
        const invitee = stageInvitees.value.find(item => item.userId === userId);
        removeInvitee(userId);
        const event = INVITATION_RESULTS[requestCallbackType];
        if (event) {
          emit(event, invitee);
        }
      },
    });
    const receiver = request.toUser?.userId ? request.toUser : { userId };
    invitationIds.set(userId, request.requestId);
    stageInvitees.value = [
      ...stageInvitees.value.filter(item => item.userId !== userId),
      { ...toStageUser(receiver), timestamp: request.timestamp || Date.now() },
    ];
  }

  async function cancelStageInvitation(options: { userId: string }): Promise<void> {
    const requestId = invitationIds.get(options.userId);
    if (!requestId) {
      return;
    }
    await engine().cancelRequest({ requestId });
    removeInvitee(options.userId);
  }

  async function removeFromStage(options: { userId: string }): Promise<void> {
    await engine().kickUserOffSeatByAdmin({ seatIndex: ANY_SEAT, userId: options.userId });
  }

  function subscribeEvent(event: RoomStageEvent, listener: StageListener) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(listener);
  }

  function unsubscribeEvent(event: RoomStageEvent, listener: StageListener) {
    listeners.get(event)?.delete(listener);
  }

  return {
    stageList,
    isLocalOnStage,
    stageApplicants,
    stageInvitees,
    localStageApplication,
    localStageInvitation,
    applyToStage,
    cancelStageApplication,
    acceptStageInvitation: () => answerStageInvitation(true),
    rejectStageInvitation: () => answerStageInvitation(false),
    leaveStage,
    acceptStageApplication: ({ userId }: { userId: string }) => answerStageApplication(userId, true),
    rejectStageApplication: ({ userId }: { userId: string }) => answerStageApplication(userId, false),
    inviteToStage,
    cancelStageInvitation,
    removeFromStage,
    subscribeEvent,
    unsubscribeEvent,
  };
}

let stage: ReturnType<typeof createStage> | null = null;

/** Detached, so every caller shares one copy whichever component asks first. */
export function useRoomStage() {
  stage ??= effectScope(true).run(createStage)!;
  return stage;
}
