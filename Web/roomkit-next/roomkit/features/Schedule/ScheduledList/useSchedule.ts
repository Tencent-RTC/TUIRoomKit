/* Cursor pages and room-ID retries depend on the preceding response. */
/* eslint-disable no-await-in-loop */
import { computed, getCurrentInstance, onBeforeUnmount, readonly, ref } from 'vue';
import TUIRoomEngine, { TUIConferenceListManagerEvents, TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { LoginStatus, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import type { TUIConferenceInfo, TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';
import type { RoomInfo, RoomStatus, RoomUser, ScheduleRoomOptions } from 'tuikit-atomicx-vue3/room';

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

export type ScheduleFailure =
  | 'in-flight'
  | 'id-exhausted'
  | 'pagination-loop'
  | 'not-signed-in'
  | 'invalid-input'
  | 'failed';

export type ScheduleOutcome = { roomId: string } | { failure: ScheduleFailure };

export interface ScheduleRoomInput {
  roomName: string;
  scheduledStartTime: number;
  scheduledEndTime: number;
  scheduleAttendees: string[];
  password?: string;
  isAllMicrophoneDisabled?: boolean;
  isAllCameraDisabled?: boolean;
}

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
    if (!isRealUserId(userId)) {
      continue;
    }
    const userName = (user.userName ?? '').trim();
    const current = byId.get(userId);
    if (!current || (!current.userName && userName)) {
      byId.set(userId, { userId, userName: current?.userName || userName });
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

// One schedule session for the list and the schedule panel. Per-call refs would
// split the in-flight guard and the attendee listener.
const loading = ref(false);
const submitting = ref(false);
const loadFailure = ref<ScheduleFailure>();
let loadRequest: Promise<ScheduleFailure | undefined> | undefined;
let boundConferenceList: ConferenceListManager | undefined;
let listening = false;
let listenerUsers = 0;

export function useSchedule() {
  const rooms = useRoomState();
  const login = useLoginState();

  async function ensureSignedIn(): Promise<ScheduleFailure | undefined> {
    const userId = login.loginUserInfo.value?.userId?.trim();
    if (login.loginStatus.value === LoginStatus.LOGINED && userId) {
      return undefined;
    }
    return 'not-signed-in';
  }

  function patchScheduledRoom(roomId: string, patch: Partial<RoomInfo>) {
    const list = rooms.scheduledRoomList.value;
    const index = list.findIndex(item => item.roomId === roomId);
    if (index === -1) {
      return;
    }
    const next = list.slice();
    next[index] = { ...list[index], ...patch };
    rooms.scheduledRoomList.value = next;
  }

  const scheduledRooms = computed<ScheduledRoom[]>(() => {
    if (login.loginStatus.value !== LoginStatus.LOGINED || !login.loginUserInfo.value?.userId) {
      return [];
    }
    return rooms.scheduledRoomList.value
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
  });

  async function fetchAllAttendees(roomId: string): Promise<ScheduledAttendee[]> {
    const attendees: ScheduledAttendee[] = [];
    let cursor = '';
    const visited = new Set<string>();
    do {
      if (visited.has(cursor)) {
        throw new Error('pagination-loop');
      }
      visited.add(cursor);
      const page = await rooms.getScheduledAttendees({ roomId, cursor });
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
    const current = rooms.scheduledRoomList.value.find(room => room.roomId === roomId);
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
    if (!roomId || !rooms.scheduledRoomList.value.some(room => room.roomId === roomId)) {
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

  async function hydrate(roomId: string, options?: { attendees?: boolean }): Promise<ScheduleFailure | undefined> {
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
      const info = await rooms.getRoomInfo({ roomId });
      patchScheduledRoom(roomId, { password: info.password || '' });
    } catch (error) {
      console.error('[useSchedule] Failed to load room password:', error);
    }
    return undefined;
  }

  function refresh(): Promise<ScheduleFailure | undefined> {
    if (loadRequest) {
      return loadRequest;
    }
    loading.value = true;
    loadFailure.value = undefined;
    loadRequest = (async () => {
      try {
        const loginFailure = await ensureSignedIn();
        if (loginFailure) {
          loadFailure.value = loginFailure;
          return loginFailure;
        }
        let cursor = '';
        const visited = new Set<string>();
        do {
          if (visited.has(cursor)) {
            loadFailure.value = 'pagination-loop';
            return 'pagination-loop';
          }
          visited.add(cursor);
          const page = await fetchScheduledPage(cursor);
          cursor = page.cursor;
        } while (cursor);
        return undefined;
      } catch (error) {
        loadFailure.value = 'failed';
        console.error('[useSchedule] Failed to load scheduled rooms:', error);
        return 'failed';
      } finally {
        loading.value = false;
        loadRequest = undefined;
      }
    })();
    return loadRequest;
  }

  async function fetchScheduledPage(cursor: string) {
    return callWhenEngineReady(() => rooms.getScheduledRoomList({ cursor }));
  }

  async function schedule(input: ScheduleRoomInput): Promise<ScheduleOutcome> {
    if (submitting.value) {
      return { failure: 'in-flight' };
    }
    if (!isValidScheduleInput(input)) {
      return { failure: 'invalid-input' };
    }
    const options = toAtomicOptions(input);
    submitting.value = true;
    let roomId = '';
    try {
      const loginFailure = await ensureSignedIn();
      if (loginFailure) {
        return { failure: loginFailure };
      }
      for (let attempt = 0; attempt < ROOM_ID_ATTEMPTS; attempt += 1) {
        const candidate = generateSixDigitRoomId();
        try {
          await callWhenEngineReady(() => rooms.getRoomInfo({ roomId: candidate }));
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
          await rooms.scheduleRoom({ roomId: candidate, options });
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
      submitting.value = false;
    }
  }

  async function update(roomId: string, input: ScheduleRoomInput): Promise<ScheduleOutcome> {
    if (submitting.value) {
      return { failure: 'in-flight' };
    }
    if (!roomId || !isValidScheduleInput(input)) {
      return { failure: 'invalid-input' };
    }
    submitting.value = true;
    try {
      const loginFailure = await ensureSignedIn();
      if (loginFailure) {
        return { failure: loginFailure };
      }
      const current = rooms.scheduledRoomList.value.find(item => item.roomId === roomId);
      const original = current ? attendeeIds(current) : [];
      const next = uniqueUserIds(input.scheduleAttendees);
      await rooms.updateScheduledRoom({
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
        await rooms.addScheduledAttendees({ roomId, userIdList: added });
      }
      if (removed.length > 0) {
        await rooms.removeScheduledAttendees({ roomId, userIdList: removed });
      }
      return { roomId };
    } catch (error) {
      console.error('[useSchedule] Failed to update scheduled room:', error);
      return { failure: 'failed' };
    } finally {
      submitting.value = false;
    }
  }

  async function cancel(roomId: string): Promise<ScheduleFailure | undefined> {
    if (submitting.value) {
      return 'in-flight';
    }
    if (!roomId) {
      return 'invalid-input';
    }
    submitting.value = true;
    try {
      const loginFailure = await ensureSignedIn();
      if (loginFailure) {
        return loginFailure;
      }
      await rooms.cancelScheduledRoom({ roomId });
      return undefined;
    } catch (error) {
      console.error('[useSchedule] Failed to cancel scheduled room:', error);
      return 'failed';
    } finally {
      submitting.value = false;
    }
  }

  listenRemoteChanges();
  if (getCurrentInstance()) {
    onBeforeUnmount(stopListeningRemoteChanges);
  }

  return {
    scheduledRooms,
    loading: readonly(loading),
    submitting: readonly(submitting),
    loadFailure: readonly(loadFailure),
    refresh,
    hydrate,
    schedule,
    update,
    cancel,
  };
}
