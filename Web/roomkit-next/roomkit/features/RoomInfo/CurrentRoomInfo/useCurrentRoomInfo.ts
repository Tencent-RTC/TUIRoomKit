import { computed, onScopeDispose, ref, watch } from 'vue';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { t } from '../../../i18n';
import { formatCopyFields } from '../../../utils/copyText';

const COPY_RESET_MS = 1800;
const INVITE_COPY_RESET_MS = 2000;

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Teleported popovers often lose document focus, which makes the
      // async clipboard API reject even though the click is a user gesture.
    }
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(input);
  if (!ok) {
    throw new Error('copy failed');
  }
}

export function useCurrentRoomInfo(options: {
  roomName: () => string;
  inviteUrl: () => string | undefined;
}) {
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const isOpen = ref(false);
  const copied = ref('');
  const copiedFields = ref<Record<string, boolean>>({});
  const copyError = ref('');
  const now = ref(Date.now());
  const resetTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const copyTokens = new Map<string, number>();
  let disposed = false;
  const timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  const roomId = computed(() => currentRoom.value?.roomId ?? '');
  const roomName = computed(
    () => currentRoom.value?.roomName || options.roomName(),
  );
  const password = computed(() => currentRoom.value?.password ?? '');
  const owner = computed(() => currentRoom.value?.roomOwner);
  const ownerName = computed(() => {
    const name = owner.value?.userName || owner.value?.userId || '—';
    return owner.value?.userId
      && owner.value.userId === loginUserInfo.value?.userId
      ? `${name}${t('RoomInfo.You')}`
      : name;
  });
  const ownerInitial = computed(
    () => (owner.value?.userName || owner.value?.userId || '').trim().slice(0, 1).toUpperCase() || '?',
  );
  const inviteUrl = computed(() => {
    if (options.inviteUrl()) return options.inviteUrl()!;
    if (!roomId.value || typeof window === 'undefined') return '';
    return window.location.href;
  });
  const duration = computed(() => {
    const start = currentRoom.value?.createTime;
    const seconds = start
      ? Math.max(0, Math.floor((now.value - start) / 1000))
      : 0;
    const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
    if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
    return parts.map(value => String(value).padStart(2, '0')).join(':');
  });
  const fields = computed(() => [
    {
      key: 'id',
      label: t('Invitation.RoomId'),
      value: roomId.value.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3'),
      raw: roomId.value,
    },
    ...(password.value
      ? [{
        key: 'password',
        label: t('Invitation.Password'),
        value: password.value,
        raw: password.value,
      }]
      : []),
    {
      key: 'link',
      label: t('Invitation.Link'),
      value: inviteUrl.value.replace(/^https?:\/\//, ''),
      raw: inviteUrl.value,
    },
  ]);
  function bumpCopyToken(key: string): number {
    const token = (copyTokens.get(key) ?? 0) + 1;
    copyTokens.set(key, token);
    return token;
  }

  function setCopiedField(key: string, active: boolean) {
    const next = { ...copiedFields.value };
    if (active) next[key] = true;
    else delete next[key];
    // Replace the object so Vue always re-renders, even when the same key
    // is marked copied again before the previous flag was cleared.
    copiedFields.value = next;
  }

  function scheduleCopiedReset(key: string) {
    const token = bumpCopyToken(key);
    clearTimeout(resetTimers.get(key));
    resetTimers.set(
      key,
      setTimeout(() => {
        if (disposed || copyTokens.get(key) !== token) return;
        setCopiedField(key, false);
        if (copied.value === key) copied.value = '';
        resetTimers.delete(key);
      }, key === 'invitation' ? INVITE_COPY_RESET_MS : COPY_RESET_MS),
    );
  }

  function markCopied(key: string) {
    copied.value = key;
    setCopiedField(key, true);
    copyError.value = '';
    scheduleCopiedReset(key);
  }

  const invitationText = computed(() =>
    formatCopyFields([
      { label: t('Invitation.RoomName'), value: roomName.value },
      ...fields.value.map(field => ({ label: field.label, value: field.raw })),
    ]),
  );

  async function copy(key: string) {
    const text
      = key === 'invitation'
        ? invitationText.value
        : fields.value.find(field => field.key === key)?.raw;
    if (!text) return;
    // Drop a pending hide so a retry cannot be wiped while clipboard is in flight.
    bumpCopyToken(key);
    clearTimeout(resetTimers.get(key));
    try {
      await copyTextToClipboard(text);
      if (disposed) return;
      markCopied(key);
    } catch {
      if (disposed) return;
      copyError.value = t('RoomInfo.CopyFailed');
      if (copiedFields.value[key]) scheduleCopiedReset(key);
    }
  }
  watch(roomId, () => {
    isOpen.value = false;
    copied.value = '';
    copyError.value = '';
    resetTimers.forEach(clearTimeout);
    resetTimers.clear();
    copyTokens.clear();
    copiedFields.value = {};
  });
  onScopeDispose(() => {
    disposed = true;
    clearInterval(timer);
    resetTimers.forEach(clearTimeout);
    resetTimers.clear();
    copyTokens.clear();
    copiedFields.value = {};
  });
  return {
    isOpen,
    roomId,
    roomName,
    owner,
    ownerName,
    ownerInitial,
    duration,
    fields,
    copied,
    copiedFields,
    copyError,
    copy,
  };
}
