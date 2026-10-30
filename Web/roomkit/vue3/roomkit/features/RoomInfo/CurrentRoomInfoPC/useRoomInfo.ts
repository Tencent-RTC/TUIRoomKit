import { computed, onScopeDispose, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { resolveShareLink, t } from '../../../base';
import { copyTextToClipboard } from '../../../utils/clipboard';

/** Copy bounce-back for field rows; the invitation button asks for a longer hold. */
export const COPY_RESET_MS = 1800;

/** Room ID with the 3-3-3 digit spacing both info cards print. */
export function formatRoomId(roomId: string): string {
  return roomId.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');
}

/** Room identity the info surfaces read: id, display name, and share link. */
export function useRoomIdentity(
  roomName: Ref<string | undefined>,
  inviteUrl: Ref<string | undefined>,
) {
  const { currentRoom } = useRoomState();
  const roomId = computed(() => currentRoom.value?.roomId ?? '');
  const displayRoomName = computed(() =>
    currentRoom.value?.roomName || roomName.value || '',
  );
  const shareLink = computed(() => {
    if (inviteUrl.value) return inviteUrl.value;
    if (!roomId.value) return '';
    return resolveShareLink(roomId.value) ?? window.location.href;
  });
  return { roomId, displayRoomName, shareLink };
}

/** Class timer counting from the room's create time; hh:mm:ss past one hour. */
export function useRoomElapsed() {
  const { currentRoom } = useRoomState();
  const now = ref(Date.now());
  const clock = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  onScopeDispose(() => clearInterval(clock));
  return computed(() => {
    const start = currentRoom.value?.createTime;
    const seconds = start ? Math.max(0, Math.floor((now.value - start) / 1000)) : 0;
    const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
    if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
    return parts.map(value => String(value).padStart(2, '0')).join(':');
  });
}

/**
 * Copy state machine for the info cards: per-key copied flags with a
 * bounce-back timer, a shared error line, and a reset on room change.
 * The card decides what a key copies; this owns the feedback.
 */
export function useRoomInfoCopy(roomId: Ref<string>) {
  const copiedKeys = reactive(new Set<string>());
  const copyError = ref('');
  const resetTimers = new Map<string, ReturnType<typeof setTimeout>>();

  async function copy(key: string, text: string, resetMs = COPY_RESET_MS) {
    if (!text) return;
    try {
      await copyTextToClipboard(text);
    } catch {
      copyError.value = t('RoomInfo.CopyFailed');
      return;
    }
    copyError.value = '';
    copiedKeys.add(key);
    clearTimeout(resetTimers.get(key));
    resetTimers.set(key, setTimeout(() => {
      copiedKeys.delete(key);
      resetTimers.delete(key);
    }, resetMs));
  }

  /** Clears pending timers and copied flags; also clears the error line. */
  function reset() {
    resetTimers.forEach(clearTimeout);
    resetTimers.clear();
    copiedKeys.clear();
    copyError.value = '';
  }

  watch(roomId, reset);
  onScopeDispose(reset);

  return { copiedKeys, copyError, copy, reset };
}
