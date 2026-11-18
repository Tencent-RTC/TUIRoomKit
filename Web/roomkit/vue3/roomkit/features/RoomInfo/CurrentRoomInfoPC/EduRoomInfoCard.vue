<template>
  <section
    class="edu-room-info-card"
    :class="{ 'is-plain': plain }"
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
            <IconCheck v-if="copiedKeys.has('id')" :size="copyIconSize" />
            <IconCopy v-else :size="copyIconSize" />
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
            <IconCheck v-if="copiedKeys.has('link')" :size="copyIconSize" />
            <IconCopy v-else :size="copyIconSize" />
          </button>
        </div>
      </div>
    </div>
    <p v-if="copyError" class="edu-room-info-error" role="alert">
      {{ copyError }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { IconCheck, IconCopy, t, useI18n } from '../../../base';
import { formatRoomId, useRoomIdentity, useRoomInfoCopy } from './useRoomInfo';

/**
 * Classroom detail card shared by the PC popover, the education H5 landscape
 * dropdown, and the portrait sheet: title, time, length, room id, and room link.
 */
const props = defineProps<{
  roomName?: string;
  inviteUrl?: string;
  /** H5 portrait sheet: larger rows and copy targets. The popup owns the surface. */
  plain?: boolean;
}>();

const copyIconSize = computed(() => (props.plain ? 16 : 12));

const { currentRoom } = useRoomState();
const { language } = useI18n();
const { roomId, displayRoomName, shareLink: inviteUrl } = useRoomIdentity(
  toRef(props, 'roomName'),
  toRef(props, 'inviteUrl'),
);
const { copiedKeys, copyError, copy: copyValue } = useRoomInfoCopy(roomId);

const groupedRoomId = computed(() => formatRoomId(roomId.value));

const scheduledRange = computed(() => {
  const start = currentRoom.value?.scheduledStartTime;
  const end = currentRoom.value?.scheduledEndTime;
  if (!start || !end) {
    return null;
  }
  return { start: start * 1000, end: end * 1000 };
});

const classStartMs = computed(() =>
  scheduledRange.value?.start ?? currentRoom.value?.createTime ?? 0,
);

/** `2026/10/28 周三 15:49 – 16:34`; an ad-hoc class drops the end. */
const classWhen = computed(() => {
  const start = classStartMs.value;
  if (!start) {
    return '—';
  }
  const locale = language.value;
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

function copy(key: 'id' | 'link') {
  const text = key === 'id' ? roomId.value : inviteUrl.value;
  return text ? copyValue(key, text) : undefined;
}
</script>

<style scoped lang="scss">
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

.edu-room-info-card.is-plain {
  width: auto;
  max-width: none;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.edu-room-info-rows {
  padding: 12px 18px;
}

.edu-room-info-card.is-plain .edu-room-info-rows {
  padding: 0 0 4px;
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

.edu-room-info-card.is-plain .edu-room-info-row {
  padding: 12px 0;
  font-size: 14px;
}

:global(html[lang='en-US']) .edu-room-info-card.is-plain .edu-room-info-row {
  gap: 16px;
}

.edu-room-info-label {
  flex-shrink: 0;
  font-size: var(--rk-fs-sm);
  color: var(--rk-text-tertiary);
  white-space: nowrap;
}

.edu-room-info-card.is-plain .edu-room-info-label {
  margin-right: 8px;
  font-size: 14px;
  color: var(--rk-text-secondary);
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

.edu-room-info-copy.is-copied {
  color: color-mix(in srgb, var(--rk-success) 80%, var(--rk-text-primary));
  background: color-mix(in srgb, var(--rk-success) 12%, transparent);
}

.edu-room-info-copy:active {
  transform: scale(0.88);
}

.edu-room-info-card.is-plain .edu-room-info-copy {
  width: 26px;
  height: 26px;
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
  .edu-room-info-copy:active {
    transform: none;
  }
}
</style>

<style lang="scss">
/* TUIPopover teleports the card; strip the float chrome so the card owns the surface. */
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
