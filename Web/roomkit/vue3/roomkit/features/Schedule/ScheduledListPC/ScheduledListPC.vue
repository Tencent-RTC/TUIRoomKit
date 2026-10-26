<template>
  <MeetingCalendar
    ref="calendar"
    :meetings="scheduledRooms"
    :now="now"
    :current-user-id="currentUserId"
    :loading="loading"
    :error="error"
    @join="$emit('join', $event)"
    @refresh="refresh"
    @edit="editMeeting"
    @share="openShare($event, 'invite')"
    @detail="openShare($event, 'detail')"
    @cancel="openCancel"
  />
  <ScheduleShareDialog
    v-model:open="shareOpen"
    :meeting="shareMeeting"
    :mode="shareMode"
    :host-name="hostName"
  />
  <ScheduleCancelDialog
    v-model:open="cancelOpen"
    :busy="submitting"
    @confirm="confirmCancel"
  />
</template>

<script setup lang="ts">
/* Cursor pages and engine-ready retries depend on the preceding response. */
/* eslint-disable no-await-in-loop */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { LoginStatus, useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import type { RoomInfo, RoomUser } from 'tuikit-atomicx-vue3/room';
import { TUIToast, t } from '../../../base';
import MeetingCalendar from './MeetingCalendar.vue';
import ScheduleCancelDialog from './ScheduleCancelDialog.vue';
import ScheduleShareDialog from './ScheduleShareDialog.vue';

type ScheduledMeeting = RoomInfo & { scheduledStartTime: number; scheduledEndTime: number };

const CLOCK_MS = 30000;
// IM can already be LOGINED while room-engine SSO is still initializing.
const ENGINE_READY_RETRY_DELAYS_MS = [100, 200, 400, 800, 1500];

const emit = defineEmits<{
  join: [roomId: string];
  edit: [meeting: RoomInfo];
}>();

const roomState = useRoomState();
const { loginStatus, loginUserInfo } = useLoginState();

const loading = ref(false);
const submitting = ref(false);
const error = ref('');
const now = ref(Date.now());
let clock: ReturnType<typeof setInterval> | undefined;

const currentUserId = computed(() => loginUserInfo.value?.userId ?? '');
const hostName = computed(() => loginUserInfo.value?.userName?.trim() || currentUserId.value);
const sessionReady = computed(() => loginStatus.value === LoginStatus.LOGINED && !!currentUserId.value);
const scheduledRooms = computed(() => (sessionReady.value
  ? roomState.scheduledRoomList.value.filter(
    (room): room is ScheduledMeeting => !!room.scheduledStartTime && !!room.scheduledEndTime,
  )
  : []));

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
    console.error('[ScheduledListPC] Failed to load scheduled rooms:', err);
    error.value = t('Schedule.LoadFailure.failed');
  } finally {
    loading.value = false;
  }
}

function patchRoom(roomId: string, patch: Partial<RoomInfo>) {
  roomState.scheduledRoomList.value = roomState.scheduledRoomList.value
    .map(room => (room.roomId === roomId ? { ...room, ...patch } : room));
}

// Detail, share and edit need the full roster and the password, which the list page omits.
async function hydrate(roomId: string, withAttendees: boolean) {
  try {
    if (withAttendees) {
      const attendees: RoomUser[] = [];
      let cursor = '';
      do {
        const page = await roomState.getScheduledAttendees({ roomId, cursor });
        attendees.push(...page.attendees);
        ({ cursor } = page);
      } while (cursor);
      patchRoom(roomId, { scheduleAttendees: attendees });
    }
    const info = await roomState.getRoomInfo({ roomId });
    patchRoom(roomId, { password: info.password || '' });
  } catch (err) {
    console.error('[ScheduledListPC] Failed to load meeting detail:', err);
  }
}

watch(sessionReady, (ready) => {
  if (ready) void refresh();
}, { immediate: true });

onMounted(() => {
  clock = setInterval(() => {
    now.value = Date.now();
  }, CLOCK_MS);
});
onBeforeUnmount(() => {
  clearInterval(clock);
});

const calendar = ref<InstanceType<typeof MeetingCalendar>>();
const shareOpen = ref(false);
const shareMode = ref<'invite' | 'detail'>('invite');
const shareRoomId = ref('');
const shareMeeting = computed(() => scheduledRooms.value.find(item => item.roomId === shareRoomId.value));
const cancelOpen = ref(false);
const cancelMeeting = ref<RoomInfo>();

async function openShare(meeting: RoomInfo, mode: 'invite' | 'detail') {
  await hydrate(meeting.roomId, mode === 'detail');
  shareRoomId.value = meeting.roomId;
  shareMode.value = mode;
  shareOpen.value = true;
}

async function editMeeting(meeting: RoomInfo) {
  await hydrate(meeting.roomId, true);
  emit('edit', scheduledRooms.value.find(item => item.roomId === meeting.roomId) ?? meeting);
}

function openCancel(meeting: RoomInfo) {
  cancelMeeting.value = meeting;
  cancelOpen.value = true;
}

async function confirmCancel() {
  if (!cancelMeeting.value || submitting.value) return;
  submitting.value = true;
  try {
    await roomState.cancelScheduledRoom({ roomId: cancelMeeting.value.roomId });
    cancelOpen.value = false;
    cancelMeeting.value = undefined;
    TUIToast.success(t('Schedule.Cancelled'));
  } catch (err) {
    console.error('[ScheduledListPC] Failed to cancel scheduled room:', err);
    TUIToast.error(t('Schedule.CancelFailed'));
  } finally {
    submitting.value = false;
  }
}

defineExpose({
  selectDate: (date: Date) => calendar.value?.selectDate(date),
});
</script>
