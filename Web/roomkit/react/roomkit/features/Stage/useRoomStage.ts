import { useEffect, useSyncExternalStore } from 'react';
import TUIRoomEngine, { TUIRequestAction, TUIRequestCallbackType, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import type { TUIRequest, TUIRequestCallback, TUISeatInfo } from '@tencentcloud/tuiroom-engine-js';
import { useLoginState, useRoomEngine, useRoomState } from 'tuikit-atomicx-react/room';

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

interface StageSnapshot {
  stageList: StageUser[];
  stageApplicants: StageRequest[];
  stageInvitees: StageRequest[];
  localStageApplication: StageRequest | null;
  localStageInvitation: StageRequest | null;
}

/** Module scoped, so every caller shares one copy whichever component asks first. */
let stage: StageSnapshot = {
  stageList: [],
  stageApplicants: [],
  stageInvitees: [],
  localStageApplication: null,
  localStageInvitation: null,
};
const snapshotListeners = new Set<() => void>();

function patch(next: Partial<StageSnapshot>): void {
  stage = { ...stage, ...next };
  snapshotListeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  snapshotListeners.add(listener);
  return () => {
    snapshotListeners.delete(listener);
  };
}

function getSnapshot(): StageSnapshot {
  return stage;
}

const roomEngine = useRoomEngine();

/** Mirrored from the latest render: atomicx-react exposes room and login state only through hooks. */
const room: { roomId: string | undefined; loginUser: UserFields | null } = { roomId: undefined, loginUser: null };
let loadedRoomId: string | undefined;

// userId -> requestId; callers address requests by user.
const applicationIds = new Map<string, string>();
const invitationIds = new Map<string, string>();
let localApplicationId = '';
let localInvitationId = '';

const eventListeners = new Map<RoomStageEvent, Set<StageListener>>();
function emit(event: RoomStageEvent, user?: StageRequest) {
  eventListeners.get(event)?.forEach(listener => listener(user));
}

function engine() {
  if (!roomEngine.instance) {
    throw new Error('[useRoomStage] the room engine is not ready');
  }
  return roomEngine.instance;
}

function setStageList(seatList: TUISeatInfo[]) {
  patch({ stageList: seatList.filter(seat => seat.userId).map(toStageUser) });
}

function addApplicant(request: TUIRequest) {
  const applicant = toStageRequest(request);
  applicationIds.set(applicant.userId, request.requestId);
  patch({ stageApplicants: [...stage.stageApplicants.filter(item => item.userId !== applicant.userId), applicant] });
}

function removeApplicant(userId: string) {
  applicationIds.delete(userId);
  patch({ stageApplicants: stage.stageApplicants.filter(item => item.userId !== userId) });
}

function removeInvitee(userId: string) {
  invitationIds.delete(userId);
  patch({ stageInvitees: stage.stageInvitees.filter(item => item.userId !== userId) });
}

function clearLocalApplication() {
  localApplicationId = '';
  patch({ localStageApplication: null });
}

function clearLocalInvitation() {
  localInvitationId = '';
  patch({ localStageInvitation: null });
}

function reset() {
  applicationIds.clear();
  invitationIds.clear();
  localApplicationId = '';
  localInvitationId = '';
  patch({
    stageList: [],
    stageApplicants: [],
    stageInvitees: [],
    localStageApplication: null,
    localStageInvitation: null,
  });
}

// A room without seats rejects these calls, which leaves the lists empty.
async function loadRoom(roomId: string | undefined) {
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
  if (room.roomId !== roomId) {
    return;
  }
  setStageList(seatList);
  applications.forEach(addApplicant);
}

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
    patch({ localStageInvitation: toStageRequest(request) });
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
    const self = room.loginUser;
    localApplicationId = request.requestId;
    patch({
      localStageApplication: {
        ...toStageUser({ userId: self?.userId ?? '', userName: self?.userName, avatarUrl: self?.avatarUrl }),
        timestamp: Date.now(),
      },
    });
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
      const invitee = stage.stageInvitees.find(item => item.userId === userId);
      removeInvitee(userId);
      const event = INVITATION_RESULTS[requestCallbackType];
      if (event) {
        emit(event, invitee);
      }
    },
  });
  const receiver = request.toUser?.userId ? request.toUser : { userId };
  invitationIds.set(userId, request.requestId);
  patch({
    stageInvitees: [
      ...stage.stageInvitees.filter(item => item.userId !== userId),
      { ...toStageUser(receiver), timestamp: request.timestamp || Date.now() },
    ],
  });
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
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(listener);
}

function unsubscribeEvent(event: RoomStageEvent, listener: StageListener) {
  eventListeners.get(event)?.delete(listener);
}

export function useRoomStage() {
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const roomId = currentRoom?.roomId;
  room.roomId = roomId;
  room.loginUser = loginUserInfo ?? null;

  // Every caller runs this; only the first to see a new room reloads it.
  useEffect(() => {
    if (roomId === loadedRoomId) {
      return;
    }
    loadedRoomId = roomId;
    void loadRoom(roomId);
  }, [roomId]);

  return {
    ...snapshot,
    isLocalOnStage: snapshot.stageList.some(user => user.userId === loginUserInfo?.userId),
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
