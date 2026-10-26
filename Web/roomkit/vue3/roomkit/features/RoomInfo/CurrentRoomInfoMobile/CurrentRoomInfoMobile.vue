<template>
  <div
    class="current-room-info-mobile"
    :class="{ 'is-open': isOpen }"
    role="button"
    tabindex="0"
    :aria-label="t('RoomInfo.Details')"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    @click="isOpen = !isOpen"
    @keydown.enter.prevent="isOpen = !isOpen"
    @keydown.space.prevent="isOpen = !isOpen"
  >
    <span class="current-room-info-mobile-title">{{ displayRoomName }}</span>
    <span class="current-room-info-mobile-time">{{ duration }}</span>
    <IconChevron class="current-room-info-mobile-caret" :size="11" />
  </div>

  <TUIPopup v-model:open="isOpen" height="auto">
    <template #header>
      <div class="room-info-sheet-head">
        <div class="room-info-sheet-name">
          {{ displayRoomName }}
        </div>
        <div class="room-info-sheet-divider" />
      </div>
    </template>

    <div class="room-info-sheet-fields">
      <div class="room-info-sheet-row">
        <span class="room-info-sheet-label">{{ t('RoomInfo.Host') }}</span>
        <span class="room-info-sheet-value">{{ ownerName }}</span>
      </div>
      <div v-for="field in fields" :key="field.key" class="room-info-sheet-row">
        <span class="room-info-sheet-label">{{ field.label }}</span>
        <span class="room-info-sheet-value" :title="field.raw">{{ field.raw || '—' }}</span>
        <button
          v-if="field.raw"
          class="room-info-sheet-copy"
          :class="{ 'is-copied': copiedKeys.has(field.key) }"
          type="button"
          :aria-label="t('RoomInfo.Copy', { field: field.label })"
          @click="copy(field.key)"
        >
          <IconCheck v-if="copiedKeys.has(field.key)" :size="16" />
          <IconCopy v-else :size="16" />
        </button>
      </div>
    </div>
    <p v-if="copyError" class="room-info-sheet-error" role="alert">
      {{ copyError }}
    </p>

    <template #footer>
      <div class="room-info-sheet-footer">
        <TUIButton
          class="room-info-sheet-invite"
          :class="{ 'is-copied': copiedKeys.has('invitation') }"
          variant="primary"
          size="lg"
          block
          :icon="copiedKeys.has('invitation') ? IconCheck : undefined"
          :disabled="!roomId"
          @click="copy('invitation')"
        >
          {{ t(copiedKeys.has('invitation') ? 'RoomInfo.Copied' : 'RoomInfo.Invitation') }}
        </TUIButton>
      </div>
    </template>
  </TUIPopup>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, reactive, ref, watch } from 'vue';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { IconCheck, IconChevron, IconCopy, TUIButton, TUIPopup, resolveShareLink, t } from '../../../base';
import { copyTextToClipboard, formatCopyFields } from '../../../utils/clipboard';

const props = defineProps<{
  roomName?: string;
  inviteUrl?: string;
}>();

const COPY_RESET_MS = 1800;
const INVITE_COPY_RESET_MS = 2000;

const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();

const isOpen = ref(false);
const copiedKeys = reactive(new Set<string>());
const copyError = ref('');
const now = ref(Date.now());
const resetTimers = new Map<string, ReturnType<typeof setTimeout>>();
const clock = setInterval(() => {
  now.value = Date.now();
}, 1000);

const roomId = computed(() => currentRoom.value?.roomId ?? '');
const displayRoomName = computed(() => currentRoom.value?.roomName || props.roomName || '');
const password = computed(() => currentRoom.value?.password ?? '');
const ownerName = computed(() => {
  const owner = currentRoom.value?.roomOwner;
  const name = owner?.userName || owner?.userId || '—';
  return owner?.userId && owner.userId === loginUserInfo.value?.userId
    ? `${name}${t('RoomInfo.Me')}`
    : name;
});
const inviteUrl = computed(() => {
  if (props.inviteUrl) return props.inviteUrl;
  if (!roomId.value) return '';
  return resolveShareLink(roomId.value) ?? window.location.href;
});
const duration = computed(() => {
  const start = currentRoom.value?.createTime;
  const seconds = start ? Math.max(0, Math.floor((now.value - start) / 1000)) : 0;
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
  if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
  return parts.map(value => String(value).padStart(2, '0')).join(':');
});
const fields = computed(() => [
  { key: 'id', label: t('Invitation.RoomId'), raw: roomId.value },
  ...(password.value ? [{ key: 'password', label: t('Invitation.Password'), raw: password.value }] : []),
  ...(inviteUrl.value ? [{ key: 'link', label: t('Invitation.Link'), raw: inviteUrl.value }] : []),
]);
const invitationText = computed(() =>
  formatCopyFields([
    { label: t('Invitation.RoomName'), value: displayRoomName.value },
    ...fields.value.map(field => ({ label: field.label, value: field.raw })),
  ]),
);

async function copy(key: string) {
  const text = key === 'invitation'
    ? invitationText.value
    : fields.value.find(field => field.key === key)?.raw;
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
  }, key === 'invitation' ? INVITE_COPY_RESET_MS : COPY_RESET_MS));
}

function resetCopyState() {
  resetTimers.forEach(clearTimeout);
  resetTimers.clear();
  copiedKeys.clear();
}

watch(roomId, () => {
  isOpen.value = false;
  copyError.value = '';
  resetCopyState();
});

onScopeDispose(() => {
  clearInterval(clock);
  resetCopyState();
});
</script>

<style scoped lang="scss">
/* The chip sits flush with the topbar's 16px inset; the negative margin keeps the
   text aligned while the pressed tint still has room around it. */
.current-room-info-mobile {
  display: inline-flex;
  flex: 0 1 auto;
  gap: 7px;
  align-items: center;
  min-width: 0;
  padding: 4px 6px;
  margin-left: -6px;
  color: var(--rk-text-primary);
  cursor: pointer;
  user-select: none;
  border-radius: 8px;
  outline: none;
}

.current-room-info-mobile:active {
  background: var(--rk-bg-hover);
}

.current-room-info-mobile-title {
  min-width: 0;
  overflow: hidden;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-room-info-mobile-time {
  flex-shrink: 0;
  padding-left: 7px;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-secondary);
  border-left: 1px solid color-mix(in srgb, var(--rk-text-primary) 22%, transparent);
}

.current-room-info-mobile-caret {
  flex-shrink: 0;
  margin-left: 2px;
  color: var(--rk-text-tertiary);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.current-room-info-mobile.is-open .current-room-info-mobile-caret {
  transform: rotate(180deg);
}

.room-info-sheet-head {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
  padding-top: 4px;
}

.room-info-sheet-name {
  overflow: hidden;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--rk-text-primary);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-info-sheet-divider {
  height: 1px;
  background: color-mix(in srgb, var(--rk-text-primary) 6%, transparent);
}

/* Label, value and copy share one column grid so every value starts on the same line. */
.room-info-sheet-fields {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr) 22px;
  column-gap: 16px;
}

.room-info-sheet-row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  min-height: 42px;
  font-size: var(--rk-fs-lg);
  line-height: 1.2;
}

.room-info-sheet-label {
  grid-column: 1;
  color: var(--rk-text-secondary);
  white-space: nowrap;
}

.room-info-sheet-value {
  grid-column: 2;
  min-width: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-info-sheet-copy {
  display: flex;
  grid-column: 3;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--rk-brand);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 5px;
}

.room-info-sheet-copy:active {
  opacity: 0.72;
}

.room-info-sheet-copy.is-copied {
  color: color-mix(in srgb, var(--rk-success) 80%, var(--rk-text-primary));
  background: color-mix(in srgb, var(--rk-success) 12%, transparent);
}

.room-info-sheet-error {
  margin: 4px 0 0;
  font-size: var(--rk-fs-sm);
  color: var(--rk-danger);
}

.room-info-sheet-footer {
  padding: 16px 16px 14px;
}

/* TUIButton has no success tone; the selector has to outrank its sticky touch :hover. */
.room-info-sheet-footer .room-info-sheet-invite.is-copied:not(:disabled) {
  color: color-mix(in srgb, var(--rk-success) 80%, var(--rk-text-primary));
  background: color-mix(in srgb, var(--rk-success) 14%, transparent);
  border-color: transparent;
}
</style>
