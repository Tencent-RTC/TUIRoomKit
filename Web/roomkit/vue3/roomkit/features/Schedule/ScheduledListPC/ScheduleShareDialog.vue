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
          {{ formatScheduleRange(meeting.scheduledStartTime ?? 0, meeting.scheduledEndTime ?? 0) }}
        </div>
      </div>
      <div
        v-for="field in copyFields"
        :key="field.key"
        class="cal-share-row"
      >
        <div class="cal-share-label">
          {{ field.label }}
        </div>
        <div class="cal-share-value-row">
          <div
            class="cal-share-value"
            :class="{ 'cal-share-link': field.key === 'link' }"
          >
            {{ field.value }}
          </div>
          <TUIButton
            class="cal-share-copy"
            :class="{ 'is-copied': copied === field.key }"
            variant="ghost"
            size="sm"
            :title="field.copyLabel"
            :aria-label="field.copyLabel"
            @click="copyField(field.key, field.value)"
          >
            <IconCheck
              v-if="copied === field.key"
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
import { IconCheck, IconCopy, TUIButton, TUIDialog, TUIToast, t } from '../../../base';
import type { RoomInfo } from 'tuikit-atomicx-vue3/room';
import { copyTextToClipboard, formatCopyFields } from '../../../utils/clipboard';
import {
  formatScheduleRange,
  roomShareLink,
} from '../SchedulePanel/scheduleUtils';

const props = defineProps<{
  open: boolean;
  meeting?: RoomInfo | null;
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
const copyFields = computed(() => {
  const { meeting } = props;
  if (!meeting) {
    return [];
  }
  return [
    { key: 'room', label: t('Invitation.RoomId'), value: meeting.roomId, copyLabel: t('Schedule.CopyRoomId') },
    ...(meeting.password
      ? [{ key: 'pw', label: t('Invitation.Password'), value: meeting.password, copyLabel: t('Schedule.CopyPassword') }]
      : []),
    { key: 'link', label: t('Invitation.Link'), value: link.value, copyLabel: t('Schedule.CopyLink') },
  ];
});
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
  (props.meeting?.scheduleAttendees ?? [])
    // The engine pads failed profile lookups with IM placeholder ids.
    .filter(user => user.userId && !/#|not[_-]?found/i.test(user.userId))
    .map(user => user.userName.trim() || user.userId),
);
const peopleText = computed(() => peopleNames.value.join(t('Schedule.NameSep')));
const peopleCountText = computed(() =>
  t('Schedule.AttendeeCount', { count: peopleNames.value.length }),
);
const peopleTitle = computed(() => (
  peopleText.value ? `${peopleCountText.value}：${peopleText.value}` : ''
));

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
        meeting.scheduledStartTime ?? 0,
        meeting.scheduledEndTime ?? 0,
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
  font-size: var(--rk-fs-md);
  color: var(--rk-text-tertiary);
}

.cal-share-value {
  flex: 1;
  min-width: 0;
  font-size: var(--rk-fs-md);
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
  border-radius: 8px;
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card) .rk-dialog-footer .rk-btn {
  height: 44px;
  border-radius: 999px;
}

.rk-dialog-mask .rk-dialog:has(.cal-share-card.is-detail) .rk-dialog-footer {
  display: none;
}
</style>
