import { readonly, ref } from 'vue';

const STORAGE_KEY = 'tuiRoom-lastActiveRoom';

export interface LastActiveRoom {
  roomId: string;
  password?: string;
}

function readLastActiveRoom(): LastActiveRoom | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<LastActiveRoom>;
    if (!parsed.roomId || typeof parsed.roomId !== 'string') {
      return null;
    }
    return {
      roomId: parsed.roomId,
      ...(typeof parsed.password === 'string' && parsed.password
        ? { password: parsed.password }
        : {}),
    };
  } catch {
    return null;
  }
}

function writeLastActiveRoom(room: LastActiveRoom | null) {
  if (!room) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(room));
}

/**
 * Refresh recovery only applies when the link still names that meeting.
 * A different roomId is a new join intent and must not keep the old prompt.
 */
export function isRefreshReturnForLink(lastRoomId: string | undefined, linkedRoomId: string): boolean {
  if (!lastRoomId) {
    return false;
  }
  return !linkedRoomId || linkedRoomId === lastRoomId;
}

const lastRoom = ref<LastActiveRoom | null>(readLastActiveRoom());

export function useRefreshReturn() {
  function remember(room: LastActiveRoom) {
    const next: LastActiveRoom = {
      roomId: room.roomId,
      ...(room.password ? { password: room.password } : {}),
    };
    lastRoom.value = next;
    writeLastActiveRoom(next);
  }

  function dismiss() {
    lastRoom.value = null;
    writeLastActiveRoom(null);
  }

  return {
    lastRoom: readonly(lastRoom),
    remember,
    dismiss,
  };
}
