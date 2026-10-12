<template>
  <div class="schedule-dialog">
    <TUIDialog
      :open="open"
      :title="editing ? t('Schedule.EditTitle') : t('Schedule.Title')"
      width="540px"
      confirm-text=""
      cancel-text=""
      :closable="!submitting"
      :close-on-overlay="!submitting"
      :close-on-esc="!submitting"
      @update:open="$emit('update:open', $event)"
    >
      <form
        class="schedule-body"
        @submit.prevent="submit"
      >
        <fieldset
          class="schedule-fields"
          :disabled="submitting"
        >
          <div class="sch-field">
            <label
              class="sch-label"
              :for="topicId"
            >{{ t('Schedule.Topic') }}</label>
            <TUIInput
              :id="topicId"
              v-model="title"
              class="sch-topic-card"
              :placeholder="t('Schedule.TopicPlaceholder')"
              :maxlength="TOPIC_MAX"
            />
          </div>

          <ScheduleDateTimeFields
            v-model:date="date"
            v-model:time="time"
            v-model:duration="duration"
            v-model:timezone="timezone"
          />

          <ScheduleAttendeeField
            ref="attendeeField"
            v-model="participants"
            :known-names="knownAttendeeNames"
          />

          <SchedulePolicyFields
            v-if="!isSchedulePolicyLocked(editing)"
            v-model:password-protected="passwordProtected"
            v-model:password="password"
            v-model:password-visible="passwordVisible"
            v-model:password-error="passwordError"
            v-model:is-all-microphone-disabled="isAllMicrophoneDisabled"
            v-model:is-all-camera-disabled="isAllCameraDisabled"
          />
        </fieldset>
      </form>
      <template #footer>
        <div class="schedule-footer">
          <TUIButton
            class="footer-button"
            variant="secondary"
            :disabled="submitting"
            @click="$emit('update:open', false)"
          >
            {{ t('Schedule.Cancel') }}
          </TUIButton>
          <TUIButton
            class="footer-button is-primary"
            variant="primary"
            :disabled="submitting"
            @click="submit"
          >
            {{ submitting ? t('Schedule.Submitting') : (editing ? t('Schedule.Save') : t('Schedule.Confirm')) }}
          </TUIButton>
        </div>
      </template>
    </TUIDialog>
    <ScheduleShareDialog
      v-model:open="shareOpen"
      :meeting="shareMeeting"
      mode="success"
      :host-name="userName"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref, watch } from 'vue';
import { TUIButton, TUIDialog, TUIInput, TUIToast } from '../../../base';
import { t } from '../../../i18n';
import type { ScheduleOutcome, ScheduleRoomInput, ScheduledRoom } from '../ScheduledList';
import ScheduleShareDialog from '../ScheduledList/ScheduleShareDialog.vue';
import ScheduleAttendeeField from './ScheduleAttendeeField.vue';
import ScheduleDateTimeFields from './ScheduleDateTimeFields.vue';
import SchedulePolicyFields from './SchedulePolicyFields.vue';
import {
  DEFAULT_DURATION,
  DURATION_MAX,
  DURATION_MIN,
  PASSWORD_LENGTH,
  TOPIC_MAX,
  isPasswordComplete,
  isSchedulePolicyLocked,
  isValidTopic,
} from './scheduleForm';
import {
  clampScheduleDate,
  dateKey,
  epochMsToWall,
  localTimezone,
  wallTimeToEpochMs,
} from './scheduleUtils';

const props = defineProps<{
  open: boolean;
  userName: string;
  meeting?: ScheduledRoom | null;
  schedule: (input: ScheduleRoomInput) => Promise<ScheduleOutcome>;
}>();
const emit = defineEmits<{
  'update:open': [open: boolean];
  'scheduled': [roomId: string, input: ScheduleRoomInput];
}>();

const instanceUid = getCurrentInstance()?.uid;
const topicId = `meeting-topic-${instanceUid}`;
const attendeeField = ref<{ flushInput: () => boolean } | null>(null);
const title = ref('');
const date = ref('');
const time = ref('');
const duration = ref(DEFAULT_DURATION);
const timezone = ref(localTimezone());
const submitting = ref(false);
const participants = ref<string[]>([]);
const passwordProtected = ref(false);
const password = ref('');
const passwordVisible = ref(false);
const passwordError = ref(false);
const isAllMicrophoneDisabled = ref(false);
const isAllCameraDisabled = ref(false);
const editing = computed(() => !!props.meeting?.roomId);
const knownAttendeeNames = computed(() => {
  const names: Record<string, string> = {};
  for (const user of props.meeting?.attendees ?? []) {
    names[user.userId] = user.userName;
  }
  return names;
});
const shareOpen = ref(false);
const shareMeeting = ref<ScheduledRoom>();
const startTime = computed(() =>
  wallTimeToEpochMs(date.value, time.value, timezone.value),
);

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm();
    }
  },
);

function resetForm() {
  const { meeting } = props;
  const next = new Date(Math.ceil((Date.now() + 60000) / 1800000) * 1800000);
  timezone.value = localTimezone();
  if (meeting) {
    const wall = epochMsToWall(meeting.scheduledStartTime * 1000, timezone.value);
    title.value = meeting.roomName;
    date.value = wall.date;
    time.value = wall.time;
    duration.value = Math.max(
      DURATION_MIN,
      Math.round((meeting.scheduledEndTime - meeting.scheduledStartTime) / 60),
    );
    participants.value = meeting.attendees.map(user => user.userId);
    passwordProtected.value = !!meeting.password;
    password.value = meeting.password || '';
    isAllMicrophoneDisabled.value = !!meeting.isAllMicrophoneDisabled;
    isAllCameraDisabled.value = !!meeting.isAllCameraDisabled;
  } else {
    date.value = clampScheduleDate(dateKey(next));
    time.value = `${String(next.getHours()).padStart(2, '0')}:${String(Math.floor(next.getMinutes() / 15) * 15).padStart(2, '0')}`;
    title.value = t('Schedule.DefaultTopic', { name: props.userName.trim() });
    duration.value = DEFAULT_DURATION;
    participants.value = [];
    passwordProtected.value = false;
    password.value = '';
    isAllMicrophoneDisabled.value = false;
    isAllCameraDisabled.value = false;
  }
  passwordVisible.value = false;
  passwordError.value = false;
}

async function submit() {
  if (submitting.value) {
    return;
  }
  if (!isValidTopic(title.value)) {
    TUIToast.error(t('Schedule.Error.Topic', { min: 1, max: TOPIC_MAX }));
    return;
  }
  if (!Number.isFinite(startTime.value) || startTime.value <= Date.now()) {
    TUIToast.error(t('Schedule.Error.StartTime'));
    return;
  }
  if (!Number.isInteger(duration.value) || duration.value < DURATION_MIN) {
    TUIToast.error(t('Schedule.Error.DurationMin'));
    return;
  }
  if (duration.value > DURATION_MAX) {
    TUIToast.error(t('Schedule.Error.DurationMax'));
    return;
  }
  if (attendeeField.value && !attendeeField.value.flushInput()) {
    return;
  }
  const policyLocked = isSchedulePolicyLocked(editing.value);
  if (!policyLocked && passwordProtected.value && !isPasswordComplete(password.value)) {
    passwordError.value = true;
    TUIToast.error(t('Schedule.Error.Password', { length: PASSWORD_LENGTH }));
    return;
  }
  const scheduledStartTime = Math.floor(startTime.value / 1000);
  const input: ScheduleRoomInput = {
    roomName: title.value.trim(),
    scheduledStartTime,
    scheduledEndTime: scheduledStartTime + duration.value * 60,
    scheduleAttendees: [...participants.value],
    password: passwordProtected.value ? password.value : undefined,
    isAllMicrophoneDisabled: isAllMicrophoneDisabled.value,
    isAllCameraDisabled: isAllCameraDisabled.value,
  };
  submitting.value = true;
  try {
    const result = await props.schedule(input);
    if ('failure' in result) {
      TUIToast.error(t(`Schedule.Failure.${result.failure}`));
      return;
    }
    const wasEditing = editing.value;
    emit('scheduled', result.roomId, input);
    emit('update:open', false);
    if (wasEditing) {
      TUIToast.success(t('Schedule.Updated'));
    } else {
      shareMeeting.value = {
        roomId: result.roomId,
        roomName: input.roomName,
        scheduledStartTime: input.scheduledStartTime,
        scheduledEndTime: input.scheduledEndTime,
        ownerUserId: '',
        password: input.password,
        attendees: input.scheduleAttendees.map(userId => ({ userId, userName: '' })),
      };
      shareOpen.value = true;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
@mixin hide-scrollbar {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.schedule-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 8px 24px 16px;
  overflow: auto;

  @include hide-scrollbar;
}

.schedule-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 0;
  margin: 0;
  border: 0;
}

.sch-field {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px 16px;
  align-items: center;
  min-width: 0;
}

.sch-label {
  font-size: 14px;
  font-weight: 400;
  line-height: 40px;
  color: var(--rk-text-primary);
}

.sch-topic-card {
  box-sizing: border-box;
  height: 40px;
  min-height: 40px;
  background: var(--rk-bg-raised, var(--rk-bg-surface));
  border: 1px solid var(--rk-border);
  border-radius: 12px;
}

.schedule-body .sch-topic-card:focus-within {
  border-color: var(--rk-brand);
  box-shadow: 0 0 0 1px var(--rk-brand);
}

.schedule-footer {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  padding: 10px 24px 12px;
  background: var(--rk-bg-surface);
  border-top: 1px solid var(--rk-border);
}

.footer-button {
  flex: none;
  height: 36px;
  padding: 0 16px;
  border-radius: 12px;
}

@media (width <= 520px) {
  .sch-field {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .sch-label {
    line-height: 22px;
  }
}
</style>

<style lang="scss">
.rk-dialog-mask .rk-dialog:has(.schedule-body) {
  height: auto;
  max-height: min(88vh, calc(100% - 48px));
  overflow: hidden;
  border-radius: 12px;
}

.rk-dialog-mask .rk-dialog:has(.schedule-body) .rk-dialog-header {
  padding: 0 0 8px;
  margin-bottom: 0;
}

.rk-dialog-mask .rk-dialog:has(.schedule-body) .rk-dialog-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 18px;
}

.rk-dialog-mask .rk-dialog:has(.schedule-body) .rk-dialog-title::before {
  flex: none;
  width: 3px;
  height: 16px;
  content: '';
  background: var(--rk-brand);
  border-radius: 2px;
}

.rk-dialog-mask .rk-dialog:has(.schedule-body) .rk-dialog-footer {
  justify-content: flex-end;
  padding: 0;
  margin-top: 0;
}

.rk-dialog-mask .rk-dialog:has(.schedule-body) .rk-dialog-footer .rk-btn {
  flex: none;
  width: auto;
  min-width: 0;
  height: 36px;
  padding: 0 16px;
  border-radius: 12px;
}

.rk-dialog-mask .rk-dialog:has(.schedule-body),
.rk-dialog-mask .rk-dialog:has(.schedule-body) * {
  scrollbar-width: none;
}

.rk-dialog-mask .rk-dialog:has(.schedule-body)::-webkit-scrollbar,
.rk-dialog-mask .rk-dialog:has(.schedule-body) *::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.rk-dialog-mask .rk-dialog:has(.schedule-body) .rk-dialog-body {
  min-height: 0;
  overflow: auto;
}
</style>
