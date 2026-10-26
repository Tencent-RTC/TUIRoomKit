/* Cursor pages and room-ID retries depend on the preceding response. */
/* eslint-disable no-await-in-loop */
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import TUIRoomEngine, { TUIConferenceListManagerEvents, TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { LoginStatus, roomClient, useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import type { TUIConferenceInfo, TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';
import type { RoomInfo, RoomStatus, RoomUser, ScheduleRoomOptions } from 'tuikit-atomicx-react/room';
import type { ScheduleFailure, ScheduleOutcome, ScheduleRoomInput } from '../SchedulePanel/scheduleForm';

export type { ScheduleFailure, ScheduleOutcome, ScheduleRoomInput } from '../SchedulePanel/scheduleForm';

type ConferenceListManager = ReturnType<InstanceType<typeof TUIRoomEngine>['getConferenceListManager']>;

interface AttendeesUpdatedPayload {
  conferenceInfo: TUIConferenceInfo;
  joinedUsers?: TUIUserInfo[];
  leftUsers?: TUIUserInfo[];
}

const ROOM_ID_MIN = 100000;
const ROOM_ID_RANGE = 900000;
const ROOM_ID_ATTEMPTS = 5;
// IM can already be LOGINED while room-engine SSO is still initializing.
// The observed gap is under a second; keep retrying through a slower login.
const ENGINE_READY_RETRY_DELAYS_MS = [100, 200, 400, 800, 1500];

/* Load failures reuse the schedule failure codes plus a pagination-loop guard. */
export type ScheduleLoadFailure = ScheduleFailure | 'pagination-loop';

export interface ScheduledAttendee {
  userId: string;
  userName: string;
}

export function scheduledAttendeeLabel(attendee: Pick<ScheduledAttendee, 'userId' | 'userName'>): string {
  const name = attendee.userName.trim();
  return name || attendee.userId;
}

export interface ScheduledRoom {
  roomId: string;
  roomName: string;
  scheduledStartTime: number;
  scheduledEndTime: number;
  ownerUserId: string;
  roomStatus?: RoomStatus;
  password?: string;
  isAllMicrophoneDisabled?: boolean;
  isAllCameraDisabled?: boolean;
  attendees: ScheduledAttendee[];
}

function generateSixDigitRoomId(): string {
  return String(Math.floor(ROOM_ID_MIN + Math.random() * ROOM_ID_RANGE));
}

function errorCode(error: unknown): unknown {
  return error && typeof error === 'object' && 'code' in error ? error.code : undefined;
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '';
}

function isEngineNotReady(error: unknown): boolean {
  if (errorCode(error) === TUIErrorCode.ERR_SDK_NOT_INITIALIZED) {
    return true;
  }
  return errorText(error).includes('not inited');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function callWhenEngineReady<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const delay = ENGINE_READY_RETRY_DELAYS_MS[attempt];
      if (delay === undefined || !isEngineNotReady(error)) {
        throw error;
      }
      await wait(delay);
    }
  }
}

function isRealUserId(userId: string): boolean {
  const next = userId.trim();
  if (!next || /\s/.test(next)) {
    return false;
  }
  /* Engine attendee pages include IM placeholders when a profile lookup fails. */
  return !/#/.test(next) && !/not[_-]?found/i.test(next);
}

function uniqueUserIds(ids: string[]): string[] {
  return [...new Set(ids.map(id => id.trim()).filter(isRealUserId))];
}

function isValidScheduleInput(input: ScheduleRoomInput): boolean {
  if (!input.roomName.trim()) {
    return false;
  }
  if (!Number.isFinite(input.scheduledStartTime) || !Number.isFinite(input.scheduledEndTime)) {
    return false;
  }
  return input.scheduledEndTime > input.scheduledStartTime;
}

function toAtomicOptions(input: ScheduleRoomInput): ScheduleRoomOptions {
  return {
    roomName: input.roomName.trim(),
    scheduleStartTime: input.scheduledStartTime,
    scheduleEndTime: input.scheduledEndTime,
    scheduleAttendees: uniqueUserIds(input.scheduleAttendees),
    password: input.password || '',
    isAllMicrophoneDisabled: !!input.isAllMicrophoneDisabled,
    isAllCameraDisabled: !!input.isAllCameraDisabled,
  };
}

function uniqueAttendees(users: ReadonlyArray<{ userId?: string; userName?: string }>): ScheduledAttendee[] {
  const byId = new Map<string, ScheduledAttendee>();
  for (const user of users) {
    const userId = (user.userId ?? '').trim();
    const userName = (user.userName ?? '').trim();
    if (isRealUserId(userId)) {
      const current = byId.get(userId);
      if (!current || (!current.userName && userName)) {
        byId.set(userId, { userId, userName: current?.userName || userName });
      }
    }
  }
  return [...byId.values()];
}
function attendeeRecords(room: RoomInfo): ScheduledAttendee[] {
  return uniqueAttendees(room.scheduleAttendees ?? []);
}

function attendeeIds(room: RoomInfo): string[] {
  return attendeeRecords(room).map(user => user.userId);
}

function toRoomUsers(users: ScheduledAttendee[]): RoomUser[] {
  return users.map(user => ({ userId: user.userId, userName: user.userName, avatarUrl: '' }));
}

function toUserIds(users: TUIUserInfo[] | undefined): string[] {
  return uniqueUserIds((users ?? []).map(user => user.userId));
}

interface ScheduleSession {
  loading: boolean;
  submitting: boolean;
  loadFailure: ScheduleLoadFailure | undefined;
}

// One schedule session for the list and the schedule panel. Per-call state would
// split the in-flight guard and the attendee listener.
let session: ScheduleSession = { loading: false, submitting: false, loadFailure: undefined };
const sessionListeners = new Set<() => void>();
let loadRequest: Promise<ScheduleLoadFailure | undefined> | undefined;
let boundConferenceList: ConferenceListManager | undefined;
let listening = false;
let listenerUsers = 0;

function setSession(patch: Partial<ScheduleSession>) {
  session = { ...session, ...patch };
  sessionListeners.forEach(listener => listener());
}

function subscribeSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function getSession(): ScheduleSession {
  return session;
}

// `useRoomState().scheduledRoomList` is a read-only snapshot with no setter, so hydrated
// fields that Vue writes back onto the list are layered on top here, shared by every caller.
let roomPatches: Record<string, Partial<RoomInfo>> = {};
const roomPatchListeners = new Set<() => void>();

function subscribeRoomPatches(listener: () => void) {
  roomPatchListeners.add(listener);
  return () => {
    roomPatchListeners.delete(listener);
  };
}

function getRoomPatches() {
  return roomPatches;
}

function setRoomPatch(roomId: string, patch: Partial<RoomInfo>) {
  roomPatches = { ...roomPatches, [roomId]: { ...roomPatches[roomId], ...patch } };
  roomPatchListeners.forEach(listener => listener());
}

function applyRoomPatches(list: RoomInfo[], patches: Record<string, Partial<RoomInfo>>): RoomInfo[] {
  return list.map(room => (patches[room.roomId] ? { ...room, ...patches[room.roomId] } : room));
}

export function useSchedule() {
  const roomState = useRoomState();
  const patches = useSyncExternalStore(subscribeRoomPatches, getRoomPatches, getRoomPatches);
  const patchedRoomList = useMemo(
    () => applyRoomPatches(roomState.scheduledRoomList, patches),
    [roomState.scheduledRoomList, patches],
  );
  const rooms = { ...roomState, scheduledRoomList: patchedRoomList };
  const login = useLoginState();
  const { loading, submitting, loadFailure } = useSyncExternalStore(subscribeSession, getSession, getSession);

  // Async flows and engine listeners outlive the render; they read the latest state here.
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;
  const loginRef = useRef(login);
  loginRef.current = login;

  async function ensureSignedIn(): Promise<ScheduleFailure | undefined> {
    const userId = loginRef.current.loginUserInfo?.userId?.trim();
    if (loginRef.current.loginStatus === LoginStatus.LOGINED && userId) {
      return undefined;
    }
    return 'not-signed-in';
  }

  function patchScheduledRoom(roomId: string, patch: Partial<RoomInfo>) {
    if (!roomsRef.current.scheduledRoomList.some(item => item.roomId === roomId)) {
      return;
    }
    setRoomPatch(roomId, patch);
    roomsRef.current = {
      ...roomsRef.current,
      scheduledRoomList: applyRoomPatches(roomsRef.current.scheduledRoomList, { [roomId]: patch }),
    };
  }

  const loginUserId = login.loginUserInfo?.userId;
  const { loginStatus } = login;
  const { scheduledRoomList } = rooms;
  const scheduledRooms = useMemo<ScheduledRoom[]>(() => {
    if (loginStatus !== LoginStatus.LOGINED || !loginUserId) {
      return [];
    }
    return scheduledRoomList
      .filter(room => room.scheduledStartTime != null && room.scheduledEndTime != null)
      .map(room => ({
        roomId: room.roomId,
        roomName: room.roomName,
        scheduledStartTime: room.scheduledStartTime!,
        scheduledEndTime: room.scheduledEndTime!,
        ownerUserId: room.roomOwner?.userId ?? '',
        roomStatus: room.roomStatus,
        password: room.password,
        isAllMicrophoneDisabled: room.isAllMicrophoneDisabled,
        isAllCameraDisabled: room.isAllCameraDisabled,
        attendees: attendeeRecords(room),
      }));
  }, [loginStatus, loginUserId, scheduledRoomList]);

  async function fetchAllAttendees(roomId: string): Promise<ScheduledAttendee[]> {
    const attendees: ScheduledAttendee[] = [];
    let cursor = '';
    const visited = new Set<string>();
    do {
      if (visited.has(cursor)) {
        throw new Error('pagination-loop');
      }
      visited.add(cursor);
      const page = await roomClient.getScheduledAttendees({ roomId, cursor });
      attendees.push(...page.attendees.map(user => ({
        userId: user.userId,
        userName: user.userName ?? '',
      })));
      cursor = page.cursor;
    } while (cursor);
    return uniqueAttendees(attendees);
  }

  // Attendee edits made by the owner reach every other client as engine events.
  // Replay them only onto a roster already loaded for detail or edit.
  function applyAttendeeUpdate(roomId: string, joined: ScheduledAttendee[], left: string[]) {
    const current = roomsRef.current.scheduledRoomList.find(room => room.roomId === roomId);
    if (!current || current.scheduleAttendees === undefined) {
      return;
    }
    const departed = new Set(left);
    const attendees = uniqueAttendees([
      ...attendeeRecords(current).filter(user => !departed.has(user.userId)),
      ...joined,
    ]);
    patchScheduledRoom(roomId, { scheduleAttendees: toRoomUsers(attendees) });
  }

  function onScheduleAttendeesUpdated({ conferenceInfo, joinedUsers, leftUsers }: AttendeesUpdatedPayload) {
    const roomId = conferenceInfo?.basicRoomInfo?.roomId;
    if (!roomId || !roomsRef.current.scheduledRoomList.some(room => room.roomId === roomId)) {
      return;
    }
    applyAttendeeUpdate(roomId, uniqueAttendees(joinedUsers ?? []), toUserIds(leftUsers));
  }

  function listenRemoteChanges() {
    listenerUsers += 1;
    if (listening) {
      return;
    }
    listening = true;
    // The list itself never pages attendees. A delta applies only after detail or edit has loaded that roster.
    TUIRoomEngine.once('ready', () => {
      if (!listening) {
        return;
      }
      boundConferenceList = TUIRoomEngine.getInstance().getConferenceListManager();
      boundConferenceList?.on(
        TUIConferenceListManagerEvents.onScheduleAttendeesUpdated,
        onScheduleAttendeesUpdated,
      );
    });
  }

  function stopListeningRemoteChanges() {
    listenerUsers = Math.max(0, listenerUsers - 1);
    if (listenerUsers > 0 || !listening) {
      return;
    }
    listening = false;
    boundConferenceList?.off(
      TUIConferenceListManagerEvents.onScheduleAttendeesUpdated,
      onScheduleAttendeesUpdated,
    );
    boundConferenceList = undefined;
  }

  async function hydrate(roomId: string, options?: { attendees?: boolean }): Promise<ScheduleLoadFailure | undefined> {
    if (!roomId) {
      return 'invalid-input';
    }
    const loginFailure = await ensureSignedIn();
    if (loginFailure) {
      return loginFailure;
    }
    if (options?.attendees !== false) {
      try {
        const attendees = await fetchAllAttendees(roomId);
        patchScheduledRoom(roomId, { scheduleAttendees: toRoomUsers(attendees) });
      } catch (error) {
        console.error('[useSchedule] Failed to load attendees:', error);
        return 'failed';
      }
    }
    try {
      const info = await roomClient.getRoomInfo({ roomId });
      patchScheduledRoom(roomId, { password: info.password || '' });
    } catch (error) {
      console.error('[useSchedule] Failed to load room password:', error);
    }
    return undefined;
  }

  function refresh(): Promise<ScheduleLoadFailure | undefined> {
    if (loadRequest) {
      return loadRequest;
    }
    setSession({ loading: true, loadFailure: undefined });
    loadRequest = (async () => {
      try {
        const loginFailure = await ensureSignedIn();
        if (loginFailure) {
          setSession({ loadFailure: loginFailure });
          return loginFailure;
        }
        let cursor = '';
        const visited = new Set<string>();
        do {
          if (visited.has(cursor)) {
            setSession({ loadFailure: 'pagination-loop' });
            return 'pagination-loop';
          }
          visited.add(cursor);
          const page = await fetchScheduledPage(cursor);
          cursor = page.cursor;
        } while (cursor);
        return undefined;
      } catch (error) {
        setSession({ loadFailure: 'failed' });
        console.error('[useSchedule] Failed to load scheduled rooms:', error);
        return 'failed';
      } finally {
        setSession({ loading: false });
        loadRequest = undefined;
      }
    })();
    return loadRequest;
  }

  async function fetchScheduledPage(cursor: string) {
    return callWhenEngineReady(() => roomClient.getScheduledRoomList({ cursor }));
  }

  async function schedule(input: ScheduleRoomInput): Promise<ScheduleOutcome> {
    if (session.submitting) {
      return { failure: 'in-flight' };
    }
    if (!isValidScheduleInput(input)) {
      return { failure: 'invalid-input' };
    }
    const options = toAtomicOptions(input);
    setSession({ submitting: true });
    let roomId = '';
    try {
      const loginFailure = await ensureSignedIn();
      if (loginFailure) {
        return { failure: loginFailure };
      }
      for (let attempt = 0; attempt < ROOM_ID_ATTEMPTS; attempt += 1) {
        const candidate = generateSixDigitRoomId();
        try {
          await callWhenEngineReady(() => roomClient.getRoomInfo({ roomId: candidate }));
          // An occupied candidate must be skipped before attempting to schedule.
          // eslint-disable-next-line no-continue
          continue;
        } catch (error) {
          if (errorCode(error) !== TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
            console.error('[useSchedule] Failed to probe room id:', error);
            return { failure: 'failed' };
          }
        }
        try {
          await roomClient.scheduleRoom({ roomId: candidate, options });
          roomId = candidate;
          break;
        } catch (error) {
          if (errorCode(error) !== TUIErrorCode.ERR_ROOM_ID_OCCUPIED) {
            console.error('[useSchedule] Failed to schedule room:', error);
            return { failure: 'failed' };
          }
        }
      }
      if (!roomId) {
        return { failure: 'id-exhausted' };
      }
      return { roomId };
    } finally {
      setSession({ submitting: false });
    }
  }

  async function update(roomId: string, input: ScheduleRoomInput): Promise<ScheduleOutcome> {
    if (session.submitting) {
      return { failure: 'in-flight' };
    }
    if (!roomId || !isValidScheduleInput(input)) {
      return { failure: 'invalid-input' };
    }
    setSession({ submitting: true });
    try {
      const loginFailure = await ensureSignedIn();
      if (loginFailure) {
        return { failure: loginFailure };
      }
      const current = roomsRef.current.scheduledRoomList.find(item => item.roomId === roomId);
      const original = current ? attendeeIds(current) : [];
      const next = uniqueUserIds(input.scheduleAttendees);
      await roomClient.updateScheduledRoom({
        roomId,
        options: {
          roomName: input.roomName.trim(),
          scheduleStartTime: input.scheduledStartTime,
          scheduleEndTime: input.scheduledEndTime,
        },
      });
      const originalSet = new Set(original);
      const nextSet = new Set(next);
      const added = next.filter(userId => !originalSet.has(userId));
      const removed = original.filter(userId => !nextSet.has(userId));
      if (added.length > 0) {
        await roomClient.addScheduledAttendees({ roomId, userIdList: added });
      }
      if (removed.length > 0) {
        await roomClient.removeScheduledAttendees({ roomId, userIdList: removed });
      }
      return { roomId };
    } catch (error) {
      console.error('[useSchedule] Failed to update scheduled room:', error);
      return { failure: 'failed' };
    } finally {
      setSession({ submitting: false });
    }
  }

  async function cancel(roomId: string): Promise<ScheduleFailure | undefined> {
    if (session.submitting) {
      return 'in-flight';
    }
    if (!roomId) {
      return 'invalid-input';
    }
    setSession({ submitting: true });
    try {
      const loginFailure = await ensureSignedIn();
      if (loginFailure) {
        return loginFailure;
      }
      await roomClient.cancelScheduledRoom({ roomId });
      return undefined;
    } catch (error) {
      console.error('[useSchedule] Failed to cancel scheduled room:', error);
      return 'failed';
    } finally {
      setSession({ submitting: false });
    }
  }

  useEffect(() => {
    listenRemoteChanges();
    return stopListeningRemoteChanges;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    scheduledRooms,
    loading,
    submitting,
    loadFailure,
    refresh,
    hydrate,
    schedule,
    update,
    cancel,
  };
}
