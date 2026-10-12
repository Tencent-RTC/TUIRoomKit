<template>
  <TUIDialog
    :open="open"
    :title="title"
    width="420px"
    confirm-text=""
    cancel-text=""
    closable
    :close-on-overlay="true"
    @update:open="$emit('update:open', $event)"
  >
    <div
      v-if="meeting"
      class="cal-share-card"
      :class="{ 'is-detail': mode === 'detail' }"
    >
      <div class="cal-share-row">
        <div class="cal-share-label">
          {{ t('Invitation.RoomName') }}
        </div>
        <div class="cal-share-value">
          {{ meeting.roomName }}
        </div>
      </div>
      <div class="cal-share-row">
        <div class="cal-share-label">
          {{ t('Invitation.Time') }}
        </div>
        <div class="cal-share-value">
          {{ formatScheduleRange(meeting.scheduledStartTime, meeting.scheduledEndTime) }}
        </div>
      </div>
      <div class="cal-share-row">
        <div class="cal-share-label">
          {{ t('Invitation.RoomId') }}
        </div>
        <div class="cal-share-value-row">
          <div class="cal-share-value">
            {{ meeting.roomId }}
          </div>
          <TUIButton
            class="cal-share-copy"
            :class="{ 'is-copied': copied === 'room' }"
            variant="ghost"
            size="sm"
            :title="t('Schedule.CopyRoomId')"
            :aria-label="t('Schedule.CopyRoomId')"
            @click="copyField('room', meeting.roomId)"
          >
            <IconCheck
              v-if="copied === 'room'"
              :size="12"
            />
            <IconCopy
              v-else
              :size="12"
            />
          </TUIButton>
        </div>
      </div>
      <div
        v-if="meeting.password"
        class="cal-share-row"
      >
        <div class="cal-share-label">
          {{ t('Invitation.Password') }}
        </div>
        <div class="cal-share-value-row">
          <div class="cal-share-value">
            {{ meeting.password }}
          </div>
          <TUIButton
            class="cal-share-copy"
            :class="{ 'is-copied': copied === 'pw' }"
            variant="ghost"
            size="sm"
            :title="t('Schedule.CopyPassword')"
            :aria-label="t('Schedule.CopyPassword')"
            @click="copyField('pw', meeting.password || '')"
          >
            <IconCheck
              v-if="copied === 'pw'"
              :size="12"
            />
            <IconCopy
              v-else
              :size="12"
            />
          </TUIButton>
        </div>
      </div>
      <div class="cal-share-row">
        <div class="cal-share-label">
          {{ t('Invitation.Link') }}
        </div>
        <div class="cal-share-value-row">
          <div class="cal-share-value cal-share-link">
            {{ link }}
          </div>
          <TUIButton
            class="cal-share-copy"
            :class="{ 'is-copied': copied === 'link' }"
            variant="ghost"
            size="sm"
            :title="t('Schedule.CopyLink')"
            :aria-label="t('Schedule.CopyLink')"
            @click="copyField('link', link)"
          >
            <IconCheck
              v-if="copied === 'link'"
              :size="12"
            />
            <IconCopy
              v-else
              :size="12"
            />
          </TUIButton>
        </div>
      </div>
      <template v-if="mode === 'detail'">
        <div class="cal-share-row">
          <div class="cal-share-label">
            {{ t('Schedule.ShareAttendees') }}
          </div>
          <div class="cal-share-value cal-share-people-wrap">
            <span
              class="cal-share-people"
              :class="{ 'is-empty': !peopleText }"
              :title="peopleTitle"
            >{{ peopleText || t('Schedule.NoScheduledMembers') }}</span>
            <span class="cal-share-people-count">{{ peopleCountText }}</span>
          </div>
        </div>
      </template>
    </div>
    <template
      v-if="mode !== 'detail'"
      #footer
    >
      <TUIButton
        class="cal-share-copy-all"
        variant="primary"
        block
        @click="copyAll"
      >
        {{ copied === 'all' ? t('Schedule.ShareCopied') : t('Schedule.ShareCopyAll') }}
      </TUIButton>
    </template>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { IconCheck, IconCopy, TUIButton, TUIDialog, TUIToast } from '../../../base';
import { t } from '../../../i18n';
import { formatCopyFields } from '../../../utils/copyText';
import { scheduledAttendeeLabel } from './index';
import type { ScheduledRoom } from './index';
import {
  formatScheduleRange,
  roomShareLink,
} from '../SchedulePanel/scheduleUtils';

const props = defineProps<{
  open: boolean;
  meeting?: ScheduledRoom | null;
  mode?: 'invite' | 'success' | 'detail';
  hostName?: string;
}>();
defineEmits<{ 'update:open': [open: boolean] }>();

const copied = ref('');
let copiedTimer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => clearTimeout(copiedTimer));
const mode = computed(() => props.mode ?? 'invite');
const link = computed(() =>
  props.meeting ? roomShareLink(props.meeting.roomId) : '',
);
const title = computed(() => {
  if (mode.value === 'detail') {
    return t('Schedule.ShareTitleDetail');
  }
  if (mode.value === 'success') {
    return t('Schedule.ShareTitleSuccess');
  }
  const host = props.hostName?.trim();
  return host
    ? t('Schedule.ShareTitleInvite', { name: host })
    : t('Schedule.ShareTitleInvitePlain');
});
const peopleNames = computed(() =>
  (props.meeting?.attendees ?? [])
    .map(scheduledAttendeeLabel)
    .filter(name => name.length > 0),
);
const peopleText = computed(() => peopleNames.value.join(t('Schedule.NameSep')));
const peopleCountText = computed(() =>
  t('Schedule.AttendeeCount', { count: peopleNames.value.length }),
);
const peopleTitle = computed(() => (
  peopleText.value ? `${peopleCountText.value}：${peopleText.value}` : ''
));

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
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

watch(
  () => props.open,
  (open) => {
    if (!open) {
      copied.value = '';
    }
  },
);

async function copyField(kind: string, value: string) {
  if (!value) {
    return;
  }
  try {
    await copyTextToClipboard(value);
    copied.value = kind;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = '';
    }, 1600);
  } catch {
    copied.value = '';
    TUIToast.error(t('Schedule.CopyFailed'));
  }
}

const shareText = computed(() => {
  const { meeting } = props;
  if (!meeting) {
    return '';
  }
  return formatCopyFields([
    { label: t('Invitation.RoomName'), value: meeting.roomName },
    {
      label: t('Invitation.Time'),
      value: formatScheduleRange(
        meeting.scheduledStartTime,
        meeting.scheduledEndTime,
      ),
    },
    { label: t('Invitation.RoomId'), value: meeting.roomId },
    { label: t('Invitation.Password'), value: meeting.password },
    { label: t('Invitation.Link'), value: link.value },
  ]);
});

function copyAll() {
  void copyField('all', shareText.value);
}
</script>

<style scoped lang="scss">
.cal-share-card {
  min-width: 0;
}

.cal-share-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 10px 0;
}

.cal-share-label {
  flex: none;
  width: 72px;
  padding-top: 2px;
  font-size: 13px;
  color: var(--rk-text-tertiary);
}

.cal-share-value {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--rk-text-primary);
  word-break: break-all;
}

.cal-share-value-row {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.cal-share-link {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal-share-people-wrap {
  display: flex;
  align-items: flex-end;
}

.cal-share-people {
  display: -webkit-box;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  -webkit-line-clamp: 2;
  word-break: break-word;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
}

.cal-share-people.is-empty {
  color: var(--rk-text-tertiary);
}

.cal-share-people-count {
  flex: none;
  margin-left: 4px;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  color: var(--rk-text-tertiary);
  white-space: nowrap;
}

.cal-share-copy {
  flex: none;
  width: 20px;
  min-width: 20px;
  height: 20px;
  padding: 0;
  margin: -4px 0;
  color: var(--rk-text-tertiary);
  background: var(--rk-bg-surface);
  border: 0;
  border-radius: 5px;
}

.cal-share-copy:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.cal-share-copy.is-copied,
.cal-share-copy.is-copied:hover {
  color: var(--rk-success);
  background: var(--rk-success-soft);
}

.cal-share-copy-all {
  width: 100%;
  height: 44px;
  border-radius: 999px;
}
</style>

<!-- Dialog chrome is teleported, so the share card has to restyle the shell from outside its scope. -->
<style lang="scss">
.rk-dialog-mask .rk-dialog:has(.cal-share-card) {
  padding: 22px 24px 20px;
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card) .rk-dialog-header {
  align-items: center;
  margin-bottom: 18px;
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card) .rk-dialog-title {
  padding-right: 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0;
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card) .rk-dialog-close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-secondary);
  border-radius: 8px;
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card) .rk-dialog-close:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card) .rk-dialog-footer {
  margin-top: 16px;
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card) .rk-dialog-footer .rk-btn {
  height: 44px;
  border-radius: 999px;
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card.is-detail) .rk-dialog-footer {
  display: none;
}
</style>
