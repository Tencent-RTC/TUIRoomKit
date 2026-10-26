<template>
  <section class="scheduled-list-mobile" :aria-label="t('Calendar.Region')">
    <div class="scheduled-list-mobile-scroll" aria-live="polite">
      <div
        v-if="!groups.length && !error && (loading || !loaded)"
        class="scheduled-list-mobile-loading"
        role="status"
      >
        <TUILoading size="lg" :tip="t('Calendar.Loading')" />
      </div>
      <div v-else-if="error && !groups.length" class="scheduled-list-mobile-state" role="status">
        <p class="scheduled-list-mobile-state-text">
          {{ error }}
        </p>
        <TUIButton variant="ghost" size="sm" @click="refresh">
          {{ t('Calendar.Retry') }}
        </TUIButton>
      </div>
      <div v-else-if="!groups.length" class="scheduled-list-mobile-state">
        <IconAgendaEmpty class="scheduled-list-mobile-empty-art" />
        <p class="scheduled-list-mobile-empty-title">
          {{ t('Calendar.EmptyRecent') }}
        </p>
      </div>
      <template v-else>
        <div
          v-for="group in groups"
          :key="group.key"
          class="scheduled-list-mobile-group"
        >
          <div class="scheduled-list-mobile-group-label">
            {{ group.label }}
          </div>
          <div
            v-for="meeting in group.meetings"
            :key="meeting.roomId"
            class="scheduled-list-mobile-item"
            :class="`is-${status(meeting)}`"
            role="button"
            tabindex="0"
            @click="emit('detail', meeting.roomId)"
            @keydown.enter="emit('detail', meeting.roomId)"
          >
            <div class="scheduled-list-mobile-time">
              <strong class="scheduled-list-mobile-time-h">{{
                formatTime(meeting.scheduledStartTime * 1000)
              }}</strong>
              <span class="scheduled-list-mobile-time-d">{{
                t(STATUS_KEYS[status(meeting)])
              }}</span>
            </div>
            <div class="scheduled-list-mobile-body">
              <div class="scheduled-list-mobile-title" :title="meeting.roomName">
                {{ meeting.roomName }}
              </div>
              <div class="scheduled-list-mobile-meta">
                <span
                  v-if="meeting.roomOwner?.userId === currentUserId"
                  class="scheduled-list-mobile-badge"
                >{{ t('Calendar.Owner') }}</span>
                <i
                  v-if="meeting.roomOwner?.userId === currentUserId"
                  class="scheduled-list-mobile-meta-sep"
                  aria-hidden="true"
                />
                <span class="scheduled-list-mobile-meta-text">{{ timeRange(meeting) }}</span>
                <i class="scheduled-list-mobile-meta-sep" aria-hidden="true" />
                <span class="scheduled-list-mobile-meta-text">{{ meeting.roomId }}</span>
              </div>
            </div>
            <TUIButton
              v-if="meeting.roomId"
              class="scheduled-list-mobile-join"
              variant="ghost"
              size="sm"
              @click.stop="emit('join', meeting.roomId)"
            >
              {{ t('Calendar.Join') }}
            </TUIButton>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
/* Cursor pages and engine-ready retries depend on the preceding response. */
/* eslint-disable no-await-in-loop */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { LoginStatus, RoomStatus, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import type { RoomInfo } from 'tuikit-atomicx-vue3/room';
import { IconAgendaEmpty, TUIButton, TUILoading, t } from '../../../base';
import { dateKey, formatTime } from '../SchedulePanel/scheduleUtils';

type ScheduledMeeting = RoomInfo & { scheduledStartTime: number; scheduledEndTime: number };

const CLOCK_MS = 30000;
// IM can already be LOGINED while room-engine SSO is still initializing.
const ENGINE_READY_RETRY_DELAYS_MS = [100, 200, 400, 800, 1500];
const WEEKDAY_KEYS = [
  'Calendar.Sun',
  'Calendar.Mon',
  'Calendar.Tue',
  'Calendar.Wed',
  'Calendar.Thu',
  'Calendar.Fri',
  'Calendar.Sat',
];
const STATUS_KEYS = {
  live: 'Calendar.StatusLive',
  upcoming: 'Calendar.StatusSoon',
  ended: 'Calendar.StatusEnded',
};

const emit = defineEmits<{
  join: [roomId: string];
  detail: [roomId: string];
}>();

const roomState = useRoomState();
const { loginStatus, loginUserInfo } = useLoginState();

const loading = ref(false);
const loaded = ref(false);
const error = ref('');
const now = ref(Date.now());
let clock: ReturnType<typeof setInterval> | undefined;

const currentUserId = computed(() => loginUserInfo.value?.userId ?? '');
const sessionReady = computed(() => loginStatus.value === LoginStatus.LOGINED && !!currentUserId.value);

const groups = computed(() => {
  if (!sessionReady.value) return [];
  const byDay = new Map<string, { key: string; label: string; meetings: ScheduledMeeting[] }>();
  roomState.scheduledRoomList.value
    .filter((room): room is ScheduledMeeting => !!room.scheduledStartTime && !!room.scheduledEndTime)
    .filter(meeting => status(meeting) !== 'ended')
    .sort((a, b) => a.scheduledStartTime - b.scheduledStartTime)
    .forEach((meeting) => {
      const date = new Date(meeting.scheduledStartTime * 1000);
      const key = dateKey(date);
      if (!byDay.has(key)) {
        byDay.set(key, { key, label: groupLabel(date), meetings: [] });
      }
      byDay.get(key)?.meetings.push(meeting);
    });
  return [...byDay.values()];
});

function groupLabel(date: Date) {
  return t('Calendar.DateWk', {
    month: date.getMonth() + 1,
    day: date.getDate(),
    week: t(WEEKDAY_KEYS[date.getDay()]),
  });
}

function status(meeting: ScheduledMeeting): keyof typeof STATUS_KEYS {
  if (meeting.scheduledEndTime * 1000 <= now.value) {
    return 'ended';
  }
  if (meeting.roomStatus === RoomStatus.Running) {
    return 'live';
  }
  return 'upcoming';
}

function timeRange(meeting: ScheduledMeeting): string {
  return `${formatTime(meeting.scheduledStartTime * 1000)}-${formatTime(meeting.scheduledEndTime * 1000)}`;
}

function isEngineNotReady(err: unknown): boolean {
  const { code, message } = (err ?? {}) as { code?: unknown; message?: unknown };
  return code === TUIErrorCode.ERR_SDK_NOT_INITIALIZED || String(message ?? '').includes('not inited');
}

async function fetchPage(cursor: string) {
  for (const delay of [...ENGINE_READY_RETRY_DELAYS_MS, undefined]) {
    try {
      return await roomState.getScheduledRoomList({ cursor });
    } catch (err) {
      if (delay === undefined || !isEngineNotReady(err)) throw err;
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }
  throw new Error('unreachable');
}

async function refresh() {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    let cursor = '';
    do {
      ({ cursor } = await fetchPage(cursor));
    } while (cursor);
  } catch (err) {
    console.error('[ScheduledListMobile] Failed to load scheduled rooms:', err);
    error.value = t('Schedule.LoadFailure.failed');
  } finally {
    loading.value = false;
    loaded.value = true;
  }
}

watch(sessionReady, (ready) => {
  if (ready) {
    void refresh();
  } else {
    loaded.value = false;
  }
}, { immediate: true });

onMounted(() => {
  clock = setInterval(() => {
    now.value = Date.now();
  }, CLOCK_MS);
});
onBeforeUnmount(() => {
  clearInterval(clock);
});
</script>

<style scoped lang="scss">
.scheduled-list-mobile {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.scheduled-list-mobile-scroll {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden auto;
  overscroll-behavior: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.scheduled-list-mobile-group {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 4px;
}

.scheduled-list-mobile-group + .scheduled-list-mobile-group {
  margin-top: 12px;
}

.scheduled-list-mobile-group-label {
  margin-bottom: 4px;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  color: var(--rk-text-tertiary);
  letter-spacing: 0.02em;
}

.scheduled-list-mobile-item {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 60px;
  padding: 10px 12px 10px 14px;
  cursor: pointer;
  background: var(--rk-bg-surface);
  border-radius: 12px;
  transition: opacity 0.15s ease;
}

.scheduled-list-mobile-item:active {
  opacity: 0.92;
}

.scheduled-list-mobile-item:focus-visible {
  outline: 2px solid var(--rk-brand);
  outline-offset: 2px;
}

.scheduled-list-mobile-time {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  width: 44px;
  text-align: center;
}

.scheduled-list-mobile-time-h {
  font-size: var(--rk-fs-md);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  color: var(--rk-text-primary);
  letter-spacing: -0.02em;
}

.scheduled-list-mobile-time-d {
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  line-height: 1.2;
  color: var(--rk-text-tertiary);
  white-space: nowrap;
}

.scheduled-list-mobile-item.is-live .scheduled-list-mobile-time-h,
.scheduled-list-mobile-item.is-live .scheduled-list-mobile-time-d {
  color: var(--rk-brand);
}

.scheduled-list-mobile-item.is-live .scheduled-list-mobile-time-d {
  font-weight: 700;
}

.scheduled-list-mobile-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.scheduled-list-mobile-title {
  overflow: hidden;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  line-height: 1.3;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scheduled-list-mobile-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  overflow: hidden;
  font-size: var(--rk-fs-sm);
  line-height: 1.2;
  color: var(--rk-text-tertiary);
  white-space: nowrap;
}

.scheduled-list-mobile-meta-text {
  overflow: hidden;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
}

.scheduled-list-mobile-meta-sep {
  flex: none;
  width: 2px;
  height: 2px;
  background: var(--rk-text-tertiary);
  border-radius: 50%;
  opacity: 0.55;
}

.scheduled-list-mobile-badge {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-radius: 4px;
}

/* Beat TUIButton ghost hover (`.rk-btn-ghost:hover:not(:disabled)`). */
.scheduled-list-mobile-item .scheduled-list-mobile-join {
  flex: none;
  align-self: center;
  min-width: 56px;
  height: 30px;
  padding: 0 14px;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  color: var(--rk-text-secondary);
  background: var(--rk-bg-muted);
  border: 0;
  border-radius: var(--rk-radius-pill);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.scheduled-list-mobile-item .scheduled-list-mobile-join:active {
  opacity: 0.88;
  transform: scale(0.98);
}

.scheduled-list-mobile-item.is-live .scheduled-list-mobile-join,
.scheduled-list-mobile-item.is-live .scheduled-list-mobile-join:hover:not(:disabled) {
  font-weight: 600;
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
}

.scheduled-list-mobile-item:not(.is-live) .scheduled-list-mobile-join:hover:not(:disabled) {
  background: var(--rk-bg-muted);
}

.scheduled-list-mobile-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 12px 20px 64px;
  text-align: center;
}

.scheduled-list-mobile-loading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 28px 12px;
}

.scheduled-list-mobile-state-text {
  margin: 0;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-tertiary);
}

.scheduled-list-mobile-empty-art {
  width: min(232px, 78%);
  height: auto;
  aspect-ratio: 2 / 1;
}

.scheduled-list-mobile-empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--rk-text-secondary);
}
</style>
