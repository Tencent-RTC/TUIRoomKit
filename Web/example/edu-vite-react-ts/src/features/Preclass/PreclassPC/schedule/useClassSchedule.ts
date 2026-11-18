/* Cursor pages, room-id probes and engine-ready retries are sequential. */
/* eslint-disable no-await-in-loop */
import { useEffect, useRef, useState } from 'react';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { LoginStatus, useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import type { RoomInfo, RoomUser } from 'tuikit-atomicx-react/room';
import type { PickedContact, ScheduleOutcome } from '@tencentcloud/roomkit-web-react';
import { getClassMode } from '../../classMode';
import type { ClassMode } from '../../classMode';
import type { ClassCourse } from '../../types';

export type CourseMoreCommand = 'detail' | 'edit' | 'cancel';
export interface BookInput {
  title: string;
  start: number;
  end: number;
  attendees: PickedContact[];
  muteAll: boolean;
  classMode: ClassMode;
}

const ENGINE_READY_RETRY_DELAYS_MS = [100, 200, 400, 800, 1500];
function errorCode(error: unknown): number | undefined {
  return (error as { code?: number })?.code;
}
function isEngineNotReady(error: unknown): boolean {
  return errorCode(error) === TUIErrorCode.ERR_SDK_NOT_INITIALIZED
    || String((error as { message?: unknown })?.message ?? '').includes('not inited');
}
const wait = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

/** Links open the lobby; students select their class after authentication. */
export function classLink(): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/home`;
}

export function useClassSchedule() {
  const roomState = useRoomState();
  const { loginStatus, loginUserInfo } = useLoginState();
  const [now, setNow] = useState(Date.now);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoading = useRef(false);
  const selfId = loginUserInfo?.userId ?? '';
  const isReady = loginStatus === LoginStatus.LOGINED && !!selfId;
  const courses: ClassCourse[] = !isReady
    ? []
    : roomState.scheduledRoomList
      .filter(room => !!room.scheduledStartTime && !!room.scheduledEndTime && room.scheduledEndTime * 1000 > now)
      .map((room: RoomInfo): ClassCourse => ({
        roomId: room.roomId,
        title: room.roomName || room.roomId,
        start: room.scheduledStartTime ?? 0,
        end: room.scheduledEndTime ?? 0,
        teacherName: room.roomOwner?.userName || room.roomOwner?.userId || '',
        isMine: !!room.roomOwner?.userId && room.roomOwner.userId === selfId,
        status: now >= (room.scheduledStartTime ?? 0) * 1000 ? 'live' : 'idle',
        muteAll: !!room.isAllMicrophoneDisabled,
        classMode: getClassMode(room),
      }))
      .sort((a, b) => a.start - b.start);

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
    if (isLoading.current || !isReady) return;
    isLoading.current = true;
    setLoading(true);
    try {
      let cursor = '';
      let page = 0;
      do {
        ({ cursor } = await fetchPage(cursor));
        page += 1;
      } while (cursor && page < 3);
    } catch (error) {
      console.error('[Preclass] Failed to load scheduled classes:', error);
    } finally {
      isLoading.current = false;
      setLoading(false);
      setIsLoaded(true);
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
      scheduleAttendees: input.attendees.map(user => user.userId),
      password: '',
      isAllMicrophoneDisabled: input.muteAll,
      isAllCameraDisabled: false,
    };
    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const prefix = input.classMode === 'small' ? 'edu_small_' : 'edu_1v1_';
        const roomId = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
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

  async function update(roomId: string, input: BookInput): Promise<ScheduleOutcome> {
    try {
      const before = (await fetchAttendees(roomId)).map(user => user.userId);
      const after = input.attendees.map(user => user.userId);
      const added = after.filter(userId => !before.includes(userId));
      const removed = before.filter(userId => !after.includes(userId));
      await roomState.updateScheduledRoom({ roomId, options: {
        roomName: input.title,
        scheduleStartTime: input.start,
        scheduleEndTime: input.end,
      } });
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

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(clock);
  }, []);
  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, selfId]);

  return { now, courses, loading, isLoaded, refresh, fetchAttendees, book, update, cancel };
}
