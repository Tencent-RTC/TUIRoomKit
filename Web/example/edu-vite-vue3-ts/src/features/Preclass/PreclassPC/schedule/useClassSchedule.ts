/* Cursor pages, room id probes and engine-ready retries depend on the preceding response. */
/* eslint-disable no-await-in-loop */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { LoginStatus, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import type { RoomInfo, RoomUser } from 'tuikit-atomicx-vue3/room';
import type { PickedContact, ScheduleOutcome } from '@tencentcloud/roomkit-web-vue3';

export interface ClassCourse {
  roomId: string;
  title: string;
  /** Seconds. */
  start: number;
  /** Seconds. */
  end: number;
  teacherName: string;
  isMine: boolean;
  status: 'idle' | 'live';
  muteAll: boolean;
}

export type CourseMoreCommand = 'detail' | 'edit' | 'cancel';

export interface BookInput {
  title: string;
  start: number;
  end: number;
  attendee: PickedContact;
  muteAll: boolean;
}

const CLOCK_MS = 60000;
const ROOM_ID_ATTEMPTS = 5;
// IM can already be LOGINED while room-engine SSO is still initializing.
const ENGINE_READY_RETRY_DELAYS_MS = [100, 200, 400, 800, 1500];

function errorCode(error: unknown): number | undefined {
  return (error as { code?: number })?.code;
}

function isEngineNotReady(error: unknown): boolean {
  const { message } = (error ?? {}) as { message?: unknown };
  return errorCode(error) === TUIErrorCode.ERR_SDK_NOT_INITIALIZED || String(message ?? '').includes('not inited');
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Students open the link; the router guard sends them through login first. */
export function classLink(roomId: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/home/student?roomId=${roomId}`;
}

export function useClassSchedule() {
  const roomState = useRoomState();
  const { loginStatus, loginUserInfo } = useLoginState();

  const now = ref(Date.now());
  const loading = ref(false);
  const selfId = computed(() => loginUserInfo.value?.userId ?? '');
  const ready = computed(() => loginStatus.value === LoginStatus.LOGINED && !!selfId.value);

  function toCourse(room: RoomInfo): ClassCourse {
    const start = room.scheduledStartTime ?? 0;
    const owner = room.roomOwner;
    return {
      roomId: room.roomId,
      title: room.roomName || room.roomId,
      start,
      end: room.scheduledEndTime ?? 0,
      teacherName: owner?.userName || owner?.userId || '',
      isMine: !!owner?.userId && owner.userId === selfId.value,
      status: now.value >= start * 1000 ? 'live' : 'idle',
      muteAll: !!room.isAllMicrophoneDisabled,
    };
  }

  const courses = computed<ClassCourse[]>(() => {
    if (!ready.value) return [];
    return roomState.scheduledRoomList.value
      .filter(room => !!room.scheduledStartTime
        && !!room.scheduledEndTime
        && room.scheduledEndTime * 1000 > now.value)
      .map(toCourse)
      .sort((a, b) => a.start - b.start);
  });

  async function fetchPage(cursor: string) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await roomState.getScheduledRoomList({ cursor });
      } catch (error) {
        const delay = ENGINE_READY_RETRY_DELAYS_MS[attempt];
        if (delay === undefined || !isEngineNotReady(error)) throw error;
        await wait(delay);
      }
    }
  }

  async function refresh() {
    if (loading.value || !ready.value) return;
    loading.value = true;
    try {
      let cursor = '';
      do {
        ({ cursor } = await fetchPage(cursor));
      } while (cursor);
    } catch (error) {
      console.error('[Preclass] Failed to load scheduled classes:', error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchAttendees(roomId: string): Promise<PickedContact[]> {
    const attendees: RoomUser[] = [];
    let cursor = '';
    do {
      const page = await roomState.getScheduledAttendees({ roomId, cursor });
      attendees.push(...page.attendees);
      ({ cursor } = page);
    } while (cursor);
    return attendees.map(user => ({ userId: user.userId, userName: user.userName || user.userId }));
  }

  async function isRoomIdFree(roomId: string): Promise<boolean> {
    try {
      await roomState.getRoomInfo({ roomId });
      return false;
    } catch (error) {
      if (errorCode(error) === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) return true;
      throw error;
    }
  }

  async function book(input: BookInput): Promise<ScheduleOutcome> {
    const options = {
      roomName: input.title,
      scheduleStartTime: input.start,
      scheduleEndTime: input.end,
      scheduleAttendees: [input.attendee.userId],
      password: '',
      isAllMicrophoneDisabled: input.muteAll,
      isAllCameraDisabled: false,
    };
    try {
      for (let attempt = 0; attempt < ROOM_ID_ATTEMPTS; attempt += 1) {
        const roomId = String(Math.floor(100000 + Math.random() * 900000));
        if (await isRoomIdFree(roomId)) {
          try {
            await roomState.scheduleRoom({ roomId, options });
            return { roomId };
          } catch (error) {
            if (errorCode(error) !== TUIErrorCode.ERR_ROOM_ID_OCCUPIED) throw error;
          }
        }
      }
      return { failure: 'id-exhausted' };
    } catch (error) {
      console.error('[Preclass] Failed to schedule class:', error);
      return { failure: 'failed' };
    }
  }

  /** The engine only updates name and times; the mute policy stays as booked. */
  async function update(roomId: string, input: BookInput): Promise<ScheduleOutcome> {
    try {
      const before = (await fetchAttendees(roomId)).map(user => user.userId);
      const after = [input.attendee.userId];
      const added = after.filter(userId => !before.includes(userId));
      const removed = before.filter(userId => !after.includes(userId));
      await roomState.updateScheduledRoom({
        roomId,
        options: {
          roomName: input.title,
          scheduleStartTime: input.start,
          scheduleEndTime: input.end,
        },
      });
      if (added.length) await roomState.addScheduledAttendees({ roomId, userIdList: added });
      if (removed.length) await roomState.removeScheduledAttendees({ roomId, userIdList: removed });
      return { roomId };
    } catch (error) {
      console.error('[Preclass] Failed to update scheduled class:', error);
      return { failure: 'failed' };
    }
  }

  async function cancel(roomId: string): Promise<void> {
    await roomState.cancelScheduledRoom({ roomId });
  }

  let clock: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    clock = setInterval(() => {
      now.value = Date.now();
    }, CLOCK_MS);
  });
  onBeforeUnmount(() => clearInterval(clock));

  watch(ready, (value) => {
    if (value) refresh();
  }, { immediate: true });

  return {
    now,
    courses,
    loading,
    refresh,
    fetchAttendees,
    book,
    update,
    cancel,
  };
}
