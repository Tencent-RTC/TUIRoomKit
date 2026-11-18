import { useEffect, useRef, useState } from 'react';
import { useRoomState } from 'tuikit-atomicx-react/room';
import { resolveShareLink } from '../../../base';
import { t } from '../../../i18n';
import { copyTextToClipboard } from '../../../utils/clipboard';

/** Copy bounce-back for field rows; the invitation button asks for a longer hold. */
export const COPY_RESET_MS = 1800;

/** Room ID with the 3-3-3 digit spacing both info cards print. */
export function formatRoomId(roomId: string): string {
  return roomId.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');
}

/** Room identity the info surfaces read: id, display name, and share link. */
export function useRoomIdentity(roomName: string | undefined, inviteUrl: string | undefined) {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom?.roomId ?? '';
  const displayRoomName = currentRoom?.roomName || roomName || '';
  let shareLink = '';
  if (inviteUrl) {
    shareLink = inviteUrl;
  } else if (roomId) {
    shareLink = resolveShareLink(roomId) ?? window.location.href;
  }
  return { roomId, displayRoomName, shareLink };
}

/** Room clock; classrooms can count from their booked start instead of creation. */
export function useRoomElapsed(scheduled = false): string {
  const { currentRoom } = useRoomState();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const clock = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(clock);
  }, []);
  const scheduledStart = scheduled && currentRoom?.scheduledStartTime
    ? currentRoom.scheduledStartTime * 1000
    : 0;
  const start = scheduledStart || currentRoom?.createTime;
  const seconds = start ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
  if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
  // Scheduled classrooms stay blank until the booked start, even after early entry.
  return scheduledStart > now ? '' : parts.map(value => String(value).padStart(2, '0')).join(':');
}

/**
 * Copy state machine for the info cards: per-key copied flags with a
 * bounce-back timer, a shared error line, and a reset on room change.
 * The card decides what a key copies; this owns the feedback.
 */
export function useRoomInfoCopy(roomId: string) {
  const [copiedKeys, setCopiedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [copyError, setCopyError] = useState('');
  const resetTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>()).current;

  async function copy(key: string, text: string, resetMs = COPY_RESET_MS) {
    if (!text) return;
    try {
      await copyTextToClipboard(text);
    } catch {
      setCopyError(t('RoomInfo.CopyFailed'));
      return;
    }
    setCopyError('');
    setCopiedKeys(previous => new Set(previous).add(key));
    clearTimeout(resetTimers.get(key));
    resetTimers.set(key, setTimeout(() => {
      setCopiedKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
      resetTimers.delete(key);
    }, resetMs));
  }

  /** Clears pending timers and copied flags; also clears the error line. */
  function reset() {
    resetTimers.forEach(clearTimeout);
    resetTimers.clear();
    setCopiedKeys(new Set());
    setCopyError('');
  }

  // Runs on room change and on unmount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => reset, [roomId]);

  return { copiedKeys, copyError, copy, reset };
}
