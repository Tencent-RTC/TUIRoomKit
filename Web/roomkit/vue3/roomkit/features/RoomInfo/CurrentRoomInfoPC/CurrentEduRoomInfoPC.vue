<template>
  <!-- Offset 5 drops the card onto the topbar's bottom edge (34px chip in a 44px bar). -->
  <TUIPopover v-model:open="isOpen" placement="bottom-start" :offset="5" :padded="false">
    <div
      class="edu-room-info"
      :class="{ 'is-open': isOpen }"
      role="button"
      tabindex="0"
      :aria-label="t('Education.Info.Sheet')"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
    >
      <IconInfo class="edu-room-info-mark" :size="14" />
      <span class="edu-room-info-title" :title="displayRoomName">{{
        displayRoomName
      }}</span>
      <span class="edu-room-info-time" :title="t('RoomInfo.Duration')">{{
        elapsed
      }}</span>
      <IconChevron class="edu-room-info-caret" :size="12" />
    </div>

    <template #content>
      <section
        class="edu-room-info-card"
        role="dialog"
        :aria-label="t('Education.Info.Sheet')"
      >
        <div class="edu-room-info-rows">
          <div class="edu-room-info-row">
            <span class="edu-room-info-label">{{ t('Education.Info.Title') }}</span>
            <span class="edu-room-info-value" :title="displayRoomName">{{
              displayRoomName || t('Education.Info.Untitled')
            }}</span>
          </div>
          <div class="edu-room-info-row">
            <span class="edu-room-info-label">{{ t('Education.Info.Time') }}</span>
            <span class="edu-room-info-value">{{ classWhen }}</span>
          </div>
          <div class="edu-room-info-row">
            <span class="edu-room-info-label">{{ t('Education.Info.Duration') }}</span>
            <span class="edu-room-info-value">{{ classDurationText }}</span>
          </div>
          <div class="edu-room-info-row">
            <span class="edu-room-info-label">{{ t('Education.Info.RoomId') }}</span>
            <div class="edu-room-info-copyable">
              <span class="edu-room-info-value">{{ groupedRoomId }}</span>
              <button
                class="edu-room-info-copy"
                :class="{ 'is-copied': copiedKeys.has('id') }"
                type="button"
                :aria-label="copiedKeys.has('id')
                  ? t('Education.Info.RoomIdCopied')
                  : t('Education.Info.CopyRoomId')"
                @click="copy('id')"
              >
                <IconCheck v-if="copiedKeys.has('id')" :size="12" />
                <IconCopy v-else :size="12" />
              </button>
            </div>
          </div>
          <div class="edu-room-info-row">
            <span class="edu-room-info-label">{{ t('Education.Info.RoomLink') }}</span>
            <div class="edu-room-info-copyable">
              <span class="edu-room-info-value edu-room-info-clip" :title="inviteUrl">{{ inviteUrl }}</span>
              <button
                class="edu-room-info-copy"
                :class="{ 'is-copied': copiedKeys.has('link') }"
                type="button"
                :aria-label="copiedKeys.has('link')
                  ? t('Education.Info.RoomLinkCopied')
                  : t('Education.Info.CopyRoomLink')"
                @click="copy('link')"
              >
                <IconCheck v-if="copiedKeys.has('link')" :size="12" />
                <IconCopy v-else :size="12" />
              </button>
            </div>
          </div>
        </div>
        <p v-if="copyError" class="edu-room-info-error" role="alert">
          {{ copyError }}
        </p>
      </section>
    </template>
  </TUIPopover>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import {
  IconCheck,
  IconChevron,
  IconCopy,
  IconInfo,
  TUIPopover,
  i18n,
  t,
} from '../../../base';
import { formatRoomId, useRoomElapsed, useRoomIdentity, useRoomInfoCopy } from './useRoomInfo';

/**
 * Education classroom info chip and card: the chip carries an info mark and a
 * class timer, and the card shows the five class rows (title / time / length /
 * room id / room link) with hover copy buttons, per the design. The meeting
 * variant stays `CurrentRoomInfoPC`.
 */

const props = defineProps<{
  roomName?: string;
  inviteUrl?: string;
}>();

const { currentRoom } = useRoomState();

const isOpen = ref(false);
const { roomId, displayRoomName, shareLink: inviteUrl } = useRoomIdentity(
  toRef(props, 'roomName'),
  toRef(props, 'inviteUrl'),
);
const elapsed = useRoomElapsed();
const { copiedKeys, copyError, copy: copyValue } = useRoomInfoCopy(roomId);

/** Room ID with the 3-3-3 digit spacing the classroom card prints. */
const groupedRoomId = computed(() => formatRoomId(roomId.value));

/** Booked range from the room state (seconds); an ad-hoc class has none. */
const scheduledRange = computed(() => {
  const start = currentRoom.value?.scheduledStartTime;
  const end = currentRoom.value?.scheduledEndTime;
  if (!start || !end) {
    return null;
  }
  return { start: start * 1000, end: end * 1000 };
});

/** The time row prints the booked range; an ad-hoc class prints its create time. */
const classStartMs = computed(() =>
  scheduledRange.value?.start ?? currentRoom.value?.createTime ?? 0,
);

/** `2026/10/28 周三 15:49 – 16:34`; an ad-hoc class drops the end. */
const classWhen = computed(() => {
  const start = classStartMs.value;
  if (!start) {
    return '—';
  }
  const locale = i18n.language;
  const date = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(start).replace(/-/g, '/');
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(start);
  const clockFormat = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const begin = clockFormat.format(start);
  const range = scheduledRange.value;
  if (range) {
    return `${date} ${weekday} ${begin} – ${clockFormat.format(range.end)}`;
  }
  return `${date} ${weekday} ${begin}`;
});

const classDurationText = computed(() => {
  const range = scheduledRange.value;
  return range
    ? t('Education.Info.Minutes', { count: Math.round((range.end - range.start) / 60_000) })
    : '—';
});

/** The card decides what a key copies; the shared machine owns the feedback. */
function copy(key: 'id' | 'link') {
  const text = key === 'id' ? roomId.value : inviteUrl.value;
  return text ? copyValue(key, text) : undefined;
}

watch(roomId, () => {
  isOpen.value = false;
});
</script>

<style scoped lang="scss">
/* Classroom chip: no hover plate, only a slight fade, per the design. */
.edu-room-info {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  max-width: min(460px, 42vw);
  height: 34px;
  padding: 0 4px;
  color: var(--rk-text-primary);
  cursor: pointer;
  user-select: none;
  background: transparent;
  outline: none;
  transition: opacity 0.15s;
}

.edu-room-info:hover {
  opacity: 0.88;
}

.edu-room-info.is-open {
  opacity: 1;
}

.edu-room-info-mark {
  flex-shrink: 0;
  color: var(--rk-brand);
}

.edu-room-info-title {
  min-width: 0;
  max-width: 200px;
  overflow: hidden;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.edu-room-info-time {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding-left: 10px;
  margin-left: 2px;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-primary);
  letter-spacing: 0.02em;
  border-left: 1px solid var(--rk-border-strong);
}

.edu-room-info-caret {
  flex-shrink: 0;
  margin-left: 2px;
  color: var(--rk-text-tertiary);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.edu-room-info.is-open .edu-room-info-caret {
  color: var(--rk-brand-hover);
  transform: rotate(180deg);
}

.rk-root[data-rk-theme='light'] .edu-room-info.is-open .edu-room-info-caret {
  color: var(--rk-brand);
}

/* Classroom card: five class rows with dashed dividers, per the design. */
.edu-room-info-card {
  display: flex;
  flex-direction: column;
  width: 330px;
  max-width: min(330px, calc(100vw - 40px));
  overflow: hidden;
  color: var(--rk-text-primary);
  letter-spacing: -0.005em;
  pointer-events: auto;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border-strong);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.edu-room-info-rows {
  padding: 12px 18px;
}

.edu-room-info-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 9px 0;
  font-size: var(--rk-fs-md);
  border-bottom: 1px dashed var(--rk-border);
}

.edu-room-info-row:last-child {
  border-bottom: none;
}

.edu-room-info-label {
  flex-shrink: 0;
  font-size: var(--rk-fs-sm);
  color: var(--rk-text-tertiary);
  white-space: nowrap;
}

.edu-room-info-value {
  min-width: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edu-room-info-copyable {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

/* Icon-only copy: row hover lifts the icon one step, button hover paints the
   grey plate, and the copied check sits on a constant pale green plate. */
.edu-room-info-copy {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 0;
  border-radius: var(--rk-radius-sm);
  transition: background 0.14s, color 0.14s, transform 0.1s;
}

.edu-room-info-copy:focus-visible {
  outline: 2px solid var(--rk-focus-ring);
  outline-offset: 2px;
}

/* Copied: green check on the constant pale green plate, like the design */
.edu-room-info-copy.is-copied {
  color: color-mix(in srgb, var(--rk-success) 80%, var(--rk-text-primary));
  background: color-mix(in srgb, var(--rk-success) 12%, transparent);
}

.edu-room-info-copy:active {
  transform: scale(0.88);
}

.edu-room-info-row:hover .edu-room-info-copy:not(.is-copied) {
  color: var(--rk-text-secondary);
}

.edu-room-info-row .edu-room-info-copy:not(.is-copied):hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.edu-room-info-error {
  padding: 0 18px 10px;
  margin: 0;
  font-size: var(--rk-fs-sm);
  color: var(--rk-danger);
}

@media (prefers-reduced-motion: reduce) {
  .edu-room-info,
  .edu-room-info-caret {
    transition: none;
  }

  .edu-room-info-copy:active {
    transform: none;
  }
}
</style>

<style lang="scss">
/* TUIPopover teleports the card; strip the float chrome so the card owns the surface.
   A clipping shell with a smaller radius would cut the card's shadow into dark corner slivers. */
.rk-float.rk-popover:has(> .edu-room-info-card) {
  min-width: 0;
  padding: 0;
  overflow: visible;
  background: transparent;
  border: 0;
  border-radius: 14px;
  box-shadow: none;
}
</style>
