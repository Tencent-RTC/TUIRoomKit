<template>
  <div class="meeting-detail-mobile" :class="{ 'is-members': page === 'members' }">
    <section class="meeting-detail-page is-detail" :aria-hidden="page === 'members'">
      <header class="meeting-detail-nav">
        <button
          class="meeting-detail-back"
          type="button"
          :aria-label="t('Schedule.Back')"
          @click="emit('back')"
        >
          <IconChevron class="meeting-detail-back-icon" :size="22" />
        </button>
        <div class="meeting-detail-title">
          {{ t('Schedule.ShareTitleDetail') }}
        </div>
        <div v-if="canManage" class="meeting-detail-actions">
          <TUIDropdown placement="bottom-end" @command="onMore">
            <button
              class="meeting-detail-more"
              type="button"
              :aria-label="t('Calendar.More')"
            >
              <IconMore :size="20" />
            </button>
            <template #menu>
              <TUIDropdownItem command="cancel" danger>
                {{ t('Schedule.CancelRoom') }}
              </TUIDropdownItem>
            </template>
          </TUIDropdown>
        </div>
      </header>

      <div v-if="meeting" class="meeting-detail-body">
        <div class="meeting-detail-card">
          <div class="meeting-detail-row">
            <span class="meeting-detail-label">{{ t('Invitation.RoomName') }}</span>
            <span class="meeting-detail-value">
              <span class="meeting-detail-text">{{ meeting.roomName }}</span>
            </span>
          </div>
          <div class="meeting-detail-row">
            <span class="meeting-detail-label">{{ t('RoomInfo.Host') }}</span>
            <span class="meeting-detail-value">
              <TUIAvatar class="meeting-detail-face" :src="host.avatarUrl" :alt="host.name" :size="24" />
              <span class="meeting-detail-text is-fit">{{ host.name }}</span>
            </span>
          </div>
          <div class="meeting-detail-row">
            <span class="meeting-detail-label">{{ t('Schedule.StartTime') }}</span>
            <span class="meeting-detail-value">
              <span class="meeting-detail-text">{{ startText }}</span>
            </span>
          </div>
          <div class="meeting-detail-row">
            <span class="meeting-detail-label">{{ t('Schedule.Duration') }}</span>
            <span class="meeting-detail-value">
              <span class="meeting-detail-text">{{ durationText }}</span>
            </span>
          </div>
          <div class="meeting-detail-row">
            <span class="meeting-detail-label">{{ t('Schedule.Timezone') }}</span>
            <span class="meeting-detail-value">
              <span class="meeting-detail-text">{{ timezoneText }}</span>
            </span>
          </div>
          <button
            v-if="members.length"
            class="meeting-detail-row"
            type="button"
            @click="openMembers"
          >
            <span class="meeting-detail-label">{{ t('Schedule.Participants') }}</span>
            <span class="meeting-detail-value">
              <span class="meeting-detail-faces">
                <TUIAvatar
                  v-for="member in members.slice(0, 3)"
                  :key="member.userId"
                  class="meeting-detail-face"
                  :src="member.avatarUrl"
                  :alt="member.name"
                  :size="24"
                />
              </span>
              <span class="meeting-detail-text is-fit">{{ membersCountText }}</span>
              <IconChevron class="meeting-detail-chevron" :size="16" />
            </span>
          </button>
        </div>

        <div class="meeting-detail-card">
          <div v-for="field in copyFields" :key="field.key" class="meeting-detail-row">
            <span class="meeting-detail-label">{{ field.label }}</span>
            <span class="meeting-detail-value">
              <span class="meeting-detail-text">{{ field.display }}</span>
              <button
                class="meeting-detail-copy"
                :class="{ 'is-copied': copiedKey === field.key }"
                type="button"
                :aria-label="field.copyLabel"
                @pointerdown.prevent
                @click="copyField(field.key, field.value)"
              >
                <IconCheck v-if="copiedKey === field.key" class="meeting-detail-check" :size="16" />
                <IconCopy v-else :size="16" />
              </button>
            </span>
          </div>
        </div>
      </div>

      <footer class="meeting-detail-foot">
        <TUIButton class="meeting-detail-foot-btn" variant="secondary" size="lg" :disabled="!meeting" @click="copyInvite">
          {{ t('Schedule.CopyInvite') }}
        </TUIButton>
        <TUIButton class="meeting-detail-foot-btn" variant="primary" size="lg" :disabled="!meeting" @click="emit('join', roomId)">
          {{ t('Calendar.Enter') }}
        </TUIButton>
      </footer>
    </section>

    <section class="meeting-detail-page is-members" :aria-hidden="page !== 'members'">
      <header class="meeting-detail-nav">
        <button
          class="meeting-detail-back"
          type="button"
          :aria-label="t('Schedule.Back')"
          @click="page = 'detail'"
        >
          <IconChevron class="meeting-detail-back-icon" :size="22" />
        </button>
        <div class="meeting-detail-title">
          {{ t('Schedule.ParticipantsTitle', { count: members.length }) }}
        </div>
      </header>
      <div class="meeting-detail-search">
        <TUIInput
          v-model="query"
          class="meeting-detail-search-input"
          size="sm"
          clearable
          :placeholder="t('Participants.SearchPlaceholder')"
        >
          <template #prefix>
            <IconSearch class="meeting-detail-search-icon" :size="14" />
          </template>
        </TUIInput>
      </div>
      <div class="meeting-detail-body">
        <ul v-if="filteredMembers.length" class="meeting-detail-card">
          <li
            v-for="member in filteredMembers"
            :key="member.userId"
            class="meeting-detail-row meeting-detail-member"
          >
            <TUIAvatar :src="member.avatarUrl" :alt="member.name" :size="36" />
            <span class="meeting-detail-member-name">{{ member.name }}</span>
            <span v-if="member.isHost" class="meeting-detail-tag">{{ t('RoomInfo.Host') }}</span>
          </li>
        </ul>
        <div v-else class="meeting-detail-empty">
          {{ t('Participants.SearchEmpty') }}
        </div>
      </div>
    </section>

    <TUIDialog
      v-model:open="cancelOpen"
      :title="t('Schedule.CancelRoom')"
      width="320px"
      confirm-text=""
      cancel-text=""
      :close-on-overlay="!cancelling"
      :close-on-esc="!cancelling"
    >
      <p class="meeting-detail-cancel-desc">
        {{ t('Schedule.CancelRoomDesc') }}
      </p>
      <template #footer>
        <div class="meeting-detail-cancel-actions">
          <TUIButton
            class="meeting-detail-cancel-btn"
            variant="secondary"
            :disabled="cancelling"
            @click="cancelOpen = false"
          >
            {{ t('Schedule.CancelThink') }}
          </TUIButton>
          <TUIButton
            class="meeting-detail-cancel-btn"
            variant="primary"
            :disabled="cancelling"
            @click="confirmCancel"
          >
            {{ t('Schedule.CancelConfirm') }}
          </TUIButton>
        </div>
      </template>
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
/* Attendee cursor pages depend on the preceding response. */
/* eslint-disable no-await-in-loop */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RoomStatus, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import type { RoomInfo, RoomUser } from 'tuikit-atomicx-vue3/room';
import {
  IconCheck,
  IconChevron,
  IconCopy,
  IconMore,
  IconSearch,
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIDropdown,
  TUIDropdownItem,
  TUIInput,
  TUIToast,
  t,
} from '../../../base';
import { copyTextToClipboard, formatCopyFields } from '../../../utils/clipboard';
import {
  dateKey,
  durationLabel,
  formatScheduleDate,
  formatTime,
  localTimezone,
  roomShareLink,
  timezoneLabel,
} from '../SchedulePanel/scheduleUtils';

interface Member {
  userId: string;
  name: string;
  avatarUrl: string;
  isHost?: boolean;
}

const COPY_RESET_MS = 1800;

const props = defineProps<{
  roomId: string;
}>();
const emit = defineEmits<{
  back: [];
  join: [roomId: string];
  cancelled: [roomId: string];
}>();

const roomState = useRoomState();
const { loginUserInfo } = useLoginState();

const page = ref<'detail' | 'members'>('detail');
const query = ref('');
const copiedKey = ref('');
const cancelOpen = ref(false);
const cancelling = ref(false);
const closedLocally = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const meeting = computed<RoomInfo | undefined>(
  () => roomState.scheduledRoomList.value.find(room => room.roomId === props.roomId),
);
const selfId = computed(() => loginUserInfo.value?.userId ?? '');
const isSelfHost = computed(() => !!selfId.value && meeting.value?.roomOwner?.userId === selfId.value);

const host = computed<Member>(() => {
  const owner = meeting.value?.roomOwner;
  const userId = owner?.userId ?? '';
  const attendee = meeting.value?.scheduleAttendees?.find(user => user.userId === userId);
  const self = isSelfHost.value ? loginUserInfo.value : undefined;
  return {
    userId,
    name: owner?.userName || self?.userName || attendee?.userName || userId,
    avatarUrl: owner?.avatarUrl || self?.avatarUrl || attendee?.avatarUrl || '',
    isHost: true,
  };
});
/* The list is the scheduled attendees as the state holds them: the owner is neither
   prepended nor removed, only tagged when the state lists them. */
const members = computed<Member[]>(() => (meeting.value?.scheduleAttendees ?? [])
  // The engine pads failed profile lookups with IM placeholder ids.
  .filter(user => user.userId && !/#|not[_-]?found/i.test(user.userId))
  .map(user => ({
    userId: user.userId,
    name: user.userName.trim() || user.userId,
    avatarUrl: user.avatarUrl,
    isHost: user.userId === host.value.userId,
  })));
const filteredMembers = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  return keyword ? members.value.filter(member => member.name.toLowerCase().includes(keyword)) : members.value;
});
const membersCountText = computed(() => t(
  members.value.length > 3 ? 'Schedule.MembersMore' : 'Schedule.MembersCount',
  { count: members.value.length },
));

const canManage = computed(() => isSelfHost.value
  && meeting.value?.roomStatus === RoomStatus.Scheduled
  && (meeting.value.scheduledEndTime ?? 0) * 1000 > Date.now());

const startMs = computed(() => (meeting.value?.scheduledStartTime ?? 0) * 1000);
const startText = computed(() => `${formatScheduleDate(dateKey(new Date(startMs.value)))} ${formatTime(startMs.value)}`);
const durationText = computed(() => {
  const start = meeting.value?.scheduledStartTime ?? 0;
  return durationLabel(Math.max(0, Math.round(((meeting.value?.scheduledEndTime ?? start) - start) / 60)));
});
// Scheduled rooms carry no timezone; times are shown in the device zone.
const timezoneText = computed(() => timezoneLabel(localTimezone()));
const link = computed(() => roomShareLink(props.roomId));
const password = computed(() => meeting.value?.password?.trim() ?? '');

const copyFields = computed(() => [
  {
    key: 'roomId',
    label: t('Invitation.RoomId'),
    display: props.roomId.replace(/(\d{3})(?=\d)/g, '$1 '),
    value: props.roomId,
    copyLabel: t('Schedule.CopyRoomId'),
  },
  ...(password.value
    ? [{
      key: 'password',
      label: t('Schedule.Password'),
      display: password.value,
      value: password.value,
      copyLabel: t('Schedule.CopyPassword'),
    }]
    : []),
  {
    key: 'link',
    label: t('Invitation.Link'),
    display: link.value,
    value: link.value,
    copyLabel: t('Schedule.CopyLink'),
  },
]);

async function copyField(key: string, value: string) {
  try {
    await copyTextToClipboard(value);
    copiedKey.value = key;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copiedKey.value = '';
    }, COPY_RESET_MS);
  } catch {
    TUIToast.error(t('Schedule.CopyFailed'));
  }
}

async function copyInvite() {
  if (!meeting.value) return;
  const text = formatCopyFields([
    { label: t('Invitation.RoomName'), value: meeting.value.roomName },
    { label: t('Schedule.StartTime'), value: startText.value },
    { label: t('Invitation.RoomId'), value: props.roomId },
    { label: t('Schedule.Password'), value: password.value },
    { label: t('Invitation.Link'), value: link.value },
  ]);
  try {
    await copyTextToClipboard(text);
    TUIToast.success(t('Schedule.InviteCopied'));
  } catch {
    TUIToast.error(t('Schedule.CopyFailed'));
  }
}

function openMembers() {
  query.value = '';
  page.value = 'members';
}

function onMore(command: string | number) {
  if (command === 'cancel') cancelOpen.value = true;
}

async function confirmCancel() {
  if (cancelling.value) return;
  cancelling.value = true;
  closedLocally.value = true;
  try {
    await roomState.cancelScheduledRoom({ roomId: props.roomId });
    cancelOpen.value = false;
    TUIToast.success(t('Schedule.Cancelled'));
    emit('cancelled', props.roomId);
  } catch (err) {
    closedLocally.value = false;
    console.error('[MeetingDetailMobile] Failed to cancel scheduled room:', err);
    TUIToast.error(t('Schedule.CancelFailed'));
  } finally {
    cancelling.value = false;
  }
}

function patchRoom(patch: Partial<RoomInfo>) {
  roomState.scheduledRoomList.value = roomState.scheduledRoomList.value
    .map(room => (room.roomId === props.roomId ? { ...room, ...patch } : room));
}

// The list page omits the roster and the password; load both for this meeting.
async function loadDetail(roomId: string) {
  try {
    const roster: RoomUser[] = [];
    let cursor = '';
    do {
      const result = await roomState.getScheduledAttendees({ roomId, cursor });
      roster.push(...result.attendees);
      ({ cursor } = result);
    } while (cursor);
    const info = await roomState.getRoomInfo({ roomId });
    if (roomId === props.roomId) {
      patchRoom({ scheduleAttendees: roster, password: info.password || '' });
    }
  } catch (err) {
    console.error('[MeetingDetailMobile] Failed to load meeting detail:', err);
  }
}

watch(meeting, (next, previous) => {
  if (!previous || next || closedLocally.value) return;
  TUIToast.info(t('Schedule.NotFound'));
  emit('back');
});

watch(() => props.roomId, (roomId) => {
  page.value = 'detail';
  query.value = '';
  copiedKey.value = '';
  if (roomId) void loadDetail(roomId);
}, { immediate: true });

onBeforeUnmount(() => {
  clearTimeout(copyTimer);
});
</script>

<style scoped lang="scss">
.meeting-detail-mobile {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
}

.meeting-detail-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--rk-bg-page);
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s;
}

.meeting-detail-page.is-detail {
  z-index: 0;
}

.meeting-detail-page.is-members {
  z-index: 1;
  visibility: hidden;
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s 0.32s;
  transform: translateX(100%);
}

.meeting-detail-mobile.is-members .meeting-detail-page.is-detail {
  pointer-events: none;
}

.meeting-detail-mobile.is-members .meeting-detail-page.is-members {
  visibility: visible;
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .meeting-detail-page,
  .meeting-detail-page.is-members,
  .meeting-detail-mobile.is-members .meeting-detail-page.is-members {
    transition-duration: 0s;
  }
}

.meeting-detail-nav {
  position: relative;
  z-index: 2;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 52px;
  padding: 0 72px;
  background: var(--rk-bg-surface);
}

.meeting-detail-title {
  min-width: 0;
  overflow: hidden;
  font-size: var(--rk-fs-xl);
  font-weight: 600;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-detail-back,
.meeting-detail-actions {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.meeting-detail-actions {
  right: 16px;
  display: flex;
}

.meeting-detail-back,
.meeting-detail-more {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--rk-text-primary);
  appearance: none;
  cursor: pointer;
  background: transparent;
  border: none;
}

.meeting-detail-back {
  left: 8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.meeting-detail-back-icon {
  transform: rotate(90deg);
}

.meeting-detail-more {
  width: 32px;
  height: 32px;
  color: var(--rk-text-secondary);
  border-radius: var(--rk-radius-sm);
}

.meeting-detail-back:active,
.meeting-detail-more:active {
  opacity: 0.72;
}

.meeting-detail-body {
  flex: 1;
  min-height: 0;
  padding: 12px 16px 16px;
  overflow: hidden auto;
  overscroll-behavior: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.meeting-detail-card {
  padding: 4px 16px;
  margin: 0 0 12px;
  list-style: none;
  background: var(--rk-bg-surface);
  border-radius: var(--rk-radius-md);
}

.meeting-detail-row {
  display: flex;
  gap: 16px;
  align-items: center;
  width: 100%;
  min-height: 56px;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  background: transparent;
  border: none;
}

button.meeting-detail-row {
  appearance: none;
  cursor: pointer;
}

.meeting-detail-label {
  flex: 0 0 auto;
  min-width: 88px;
  font-size: var(--rk-fs-lg);
  white-space: nowrap;
}

.meeting-detail-value {
  display: flex;
  flex: 1;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  font-size: var(--rk-fs-lg);
  color: var(--rk-text-secondary);
}

.meeting-detail-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-detail-text.is-fit {
  flex: 0 1 auto;
}

.meeting-detail-face {
  margin-right: 4px;
  box-shadow: 0 0 0 1.5px var(--rk-bg-surface);
}

.meeting-detail-faces {
  display: flex;
  flex-shrink: 0;
  margin-right: 4px;
}

.meeting-detail-faces .meeting-detail-face {
  margin-right: 0;
}

.meeting-detail-faces .meeting-detail-face + .meeting-detail-face {
  margin-left: -6px;
}

.meeting-detail-chevron {
  flex-shrink: 0;
  color: var(--rk-text-tertiary);
  transform: rotate(-90deg);
}

.meeting-detail-copy {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  color: var(--rk-brand);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--rk-radius-sm);
}

.meeting-detail-copy:active {
  opacity: 0.72;
}

.meeting-detail-copy.is-copied {
  color: var(--rk-success);
  background: var(--rk-success-soft);
}

.meeting-detail-check {
  animation: meeting-detail-pop 0.26s cubic-bezier(0.22, 1.3, 0.36, 1);
}

@keyframes meeting-detail-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .meeting-detail-check {
    animation: none;
  }
}

.meeting-detail-foot {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  padding: 8px 16px 20px;
  background: var(--rk-bg-page);
}

.meeting-detail-foot-btn {
  flex: 1;
}

.meeting-detail-search {
  flex-shrink: 0;
  padding: 12px 16px 0;
}

/* TUIInput pads its prefix and field 8px + 10px; the draft keeps 6px between them. */
.meeting-detail-search .meeting-detail-search-input {
  box-sizing: border-box;
  gap: 6px;
  height: 36px;
  min-height: 36px;
  padding: 0 12px;
  font-size: var(--rk-fs-md);
  background: var(--rk-bg-surface);
  border: 0;
  border-radius: 999px;
}

.meeting-detail-search-input :deep(.rk-input-addon),
.meeting-detail-search-input :deep(.rk-input-field) {
  padding: 0;
}

.meeting-detail-search-icon {
  color: var(--rk-text-tertiary);
}

.meeting-detail-member {
  gap: 12px;
  min-height: 60px;
}

.meeting-detail-member-name {
  min-width: 0;
  overflow: hidden;
  font-size: var(--rk-fs-lg);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-detail-tag {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-radius: var(--rk-radius-sm);
}

.meeting-detail-empty {
  padding: 48px 0;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-tertiary);
  text-align: center;
}

.meeting-detail-cancel-desc {
  margin: 0;
  font-size: var(--rk-fs-md);
  line-height: 1.6;
  color: var(--rk-text-secondary);
}

.meeting-detail-cancel-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.meeting-detail-cancel-btn {
  flex: 1;
}
</style>
