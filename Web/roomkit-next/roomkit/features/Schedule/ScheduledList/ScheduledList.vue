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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { LoginStatus, useLoginState } from 'tuikit-atomicx-vue3/room';
import { TUIToast } from '../../../base';
import { t } from '../../../i18n';
import MeetingCalendar from './MeetingCalendar.vue';
import ScheduleCancelDialog from './ScheduleCancelDialog.vue';
import ScheduleShareDialog from './ScheduleShareDialog.vue';
import { useSchedule } from './useSchedule';
import type { ScheduledRoom } from './useSchedule';

const CLOCK_MS = 30000;

const {
  scheduledRooms,
  loading,
  submitting,
  loadFailure,
  refresh,
  hydrate,
  cancel,
} = useSchedule();
const { loginStatus, loginUserInfo } = useLoginState();
const emit = defineEmits<{
  join: [roomId: string];
  edit: [meeting: ScheduledRoom];
}>();

const hostName = computed(() => {
  const profile = loginUserInfo.value;
  return profile?.userName?.trim() || profile?.userId || '';
});
const currentUserId = computed(() => loginUserInfo.value?.userId ?? '');
const sessionReady = computed(() =>
  loginStatus.value === LoginStatus.LOGINED && currentUserId.value.length > 0,
);
const error = computed(() => {
  if (!loadFailure.value) {
    return '';
  }
  return t(loadFailure.value === 'failed'
    ? 'Schedule.LoadFailure.failed'
    : `Schedule.Failure.${loadFailure.value}`);
});
const now = ref(Date.now());
let clock: ReturnType<typeof setInterval> | undefined;

watch(sessionReady, (ready) => {
  if (ready) {
    void refresh();
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

const calendar = ref<InstanceType<typeof MeetingCalendar>>();
const shareOpen = ref(false);
const shareMode = ref<'invite' | 'detail'>('invite');
const shareRoomId = ref('');
const shareFallback = ref<ScheduledRoom>();
const shareMeeting = computed(
  () => scheduledRooms.value.find(item => item.roomId === shareRoomId.value) ?? shareFallback.value,
);
const cancelOpen = ref(false);
const cancelMeeting = ref<ScheduledRoom>();

async function openShare(meeting: ScheduledRoom, mode: 'invite' | 'detail') {
  await hydrate(meeting.roomId, { attendees: mode === 'detail' });
  shareRoomId.value = meeting.roomId;
  shareFallback.value = meeting;
  shareMode.value = mode;
  shareOpen.value = true;
}

async function editMeeting(meeting: ScheduledRoom) {
  if (meeting.roomId) {
    await hydrate(meeting.roomId);
  }
  emit('edit', scheduledRooms.value.find(item => item.roomId === meeting.roomId) ?? meeting);
}

function openCancel(meeting: ScheduledRoom) {
  cancelMeeting.value = meeting;
  cancelOpen.value = true;
}

async function confirmCancel() {
  if (!cancelMeeting.value) {
    return;
  }
  const failure = await cancel(cancelMeeting.value.roomId);
  if (failure) {
    TUIToast.error(
      failure === 'not-signed-in' || failure === 'in-flight'
        ? t(`Schedule.Failure.${failure}`)
        : t('Schedule.CancelFailed'),
    );
    return;
  }
  cancelOpen.value = false;
  cancelMeeting.value = undefined;
  TUIToast.success(t('Schedule.Cancelled'));
}

defineExpose({
  selectDate: (date: Date) => calendar.value?.selectDate(date),
});
</script>
