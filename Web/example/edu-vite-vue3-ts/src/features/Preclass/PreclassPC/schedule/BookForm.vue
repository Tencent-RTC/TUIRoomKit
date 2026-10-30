<template>
  <form class="preclass-book" @submit.prevent="submit">
    <div class="preclass-book-body">
      <label class="preclass-field">
        <span class="preclass-field-label">{{ t('Preclass.RoomName') }}</span>
        <TUIInput
          v-model="title"
          class="preclass-book-input"
          type="text"
          :maxlength="TITLE_MAX"
          :placeholder="t('Preclass.RoomNamePlaceholder')"
        />
      </label>

      <div class="preclass-field">
        <span class="preclass-field-label">{{ t('Preclass.Start') }}</span>
        <div class="preclass-book-time">
          <TUIDatePicker
            v-model="dateKey"
            disable-past
            :weekdays="weekdayLabels()"
            :prev-month-label="t('Schedule.PrevMonth')"
            :next-month-label="t('Schedule.NextMonth')"
            :format-month="formatMonth"
          >
            <template #default="{ open }">
              <span class="preclass-book-date" :class="{ 'is-open': open }">
                <IconCalendar :size="14" />
                <span class="preclass-book-date-text">{{ formatDate(dateKey) }}</span>
              </span>
            </template>
          </TUIDatePicker>
          <TUISelect v-model="clock" class="preclass-book-select">
            <TUIOption v-for="slot in CLOCKS" :key="slot" :value="slot" />
          </TUISelect>
        </div>
      </div>

      <div class="preclass-field">
        <span class="preclass-field-label">{{ t('Preclass.Duration') }}</span>
        <TUISelect v-model="duration" class="preclass-book-select">
          <TUIOption
            v-for="minutes in DURATIONS"
            :key="minutes"
            :value="minutes"
            :label="t('Preclass.Minutes', { n: minutes })"
          />
        </TUISelect>
      </div>

      <div class="preclass-field">
        <span class="preclass-field-label">{{ t('Preclass.Timezone') }}</span>
        <TUISelect v-model="timezone" class="preclass-book-select">
          <TUIOption
            v-for="zone in TIMEZONES"
            :key="zone"
            :value="zone"
            :label="timezoneLabel(zone)"
          />
        </TUISelect>
      </div>

      <div class="preclass-field">
        <span class="preclass-field-label">{{ t('Preclass.ClassMode') }}</span>
        <div class="preclass-book-mode">
          <button
            v-for="item in CLASS_MODES"
            :key="item.value"
            type="button"
            class="preclass-book-mode-item"
            :class="{ 'is-active': item.value === classMode }"
            @click="selectMode(item.value)"
          >
            {{ t(item.label) }}
          </button>
        </div>
        <span class="preclass-book-mode-hint">{{ t('Preclass.ClassModeOneOnOneDesc') }}</span>
      </div>

      <div class="preclass-field is-top">
        <span class="preclass-field-label">{{ t('Preclass.Members') }}</span>
        <MemberField v-model="member" />
      </div>

      <div v-if="classMode !== 'oneOnOne'" class="preclass-field">
        <span class="preclass-field-label">{{ t('Preclass.MemberPolicy') }}</span>
        <TUICheckbox v-model="muteAll" :disabled="!!course">
          {{ t('Preclass.MuteAll') }}
        </TUICheckbox>
      </div>
    </div>

    <footer class="preclass-book-foot">
      <TUIButton class="preclass-book-button" variant="secondary" @click="emit('cancel')">
        {{ t('Preclass.Cancel') }}
      </TUIButton>
      <TUIButton
        class="preclass-book-button"
        variant="primary"
        native-type="submit"
        :disabled="!title.trim()"
        :loading="submitting"
      >
        {{ course ? t('Preclass.Save') : t('Preclass.ConfirmBook') }}
      </TUIButton>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  IconCalendar,
  TUIButton,
  TUICheckbox,
  TUIDatePicker,
  TUIInput,
  TUIOption,
  TUISelect,
  TUIToast,
  t,
} from '@tencentcloud/roomkit-web-vue3';
import type { PickedContact } from '@tencentcloud/roomkit-web-vue3';
import MemberField from './MemberField.vue';
import {
  DEFAULT_DURATION,
  DURATIONS,
  TIMEZONES,
  clockOptions,
  formatDate,
  formatMonth,
  fromEpochSeconds,
  localTimezone,
  nextSlot,
  snapDuration,
  timezoneLabel,
  toEpochSeconds,
  weekdayLabels,
} from './scheduleTime';
import type { BookInput, ClassCourse } from './useClassSchedule';

const TITLE_MAX = 40;
const CLOCKS = clockOptions();

type ClassMode = 'large' | 'small' | 'oneOnOne';
/** Only 1v1 is supported for now; other modes are placeholders. */
const SUPPORTED_MODE: ClassMode = 'oneOnOne';
const CLASS_MODES: { value: ClassMode; label: string }[] = [
  { value: 'large', label: 'Preclass.ClassModeLarge' },
  { value: 'small', label: 'Preclass.ClassModeSmall' },
  { value: 'oneOnOne', label: 'Preclass.ClassModeOneOnOne' },
];

const props = defineProps<{
  /** Set when editing; the form is remounted per open, so it only seeds once. */
  course?: ClassCourse;
  /** Loaded after mount when editing. */
  attendee?: PickedContact;
  defaultTitle: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  submit: [input: BookInput];
  cancel: [];
}>();

const initialZone = localTimezone();
const initialSlot = props.course
  ? fromEpochSeconds(props.course.start, initialZone)
  : nextSlot(Date.now(), initialZone);

const title = ref(props.course?.title ?? props.defaultTitle);
const dateKey = ref(initialSlot.dateKey);
type SelectValue = string | number | null;
const clock = ref<SelectValue>(initialSlot.clock);
const duration = ref<SelectValue>(props.course
  ? snapDuration((props.course.end - props.course.start) / 60)
  : DEFAULT_DURATION);
const timezone = ref<SelectValue>(initialZone);
const member = ref<PickedContact | undefined>(props.attendee);
const muteAll = ref(props.course?.muteAll ?? false);
const classMode = ref<ClassMode>(SUPPORTED_MODE);

function selectMode(value: ClassMode) {
  if (value !== SUPPORTED_MODE) {
    TUIToast.info(t('Preclass.ComingSoon'));
    return;
  }
  classMode.value = value;
}

watch(() => props.attendee, (value) => {
  if (value && !member.value) member.value = value;
});

function submit() {
  const name = title.value.trim();
  if (!name || props.submitting) return;
  const start = toEpochSeconds(dateKey.value, String(clock.value), String(timezone.value));
  if (start * 1000 <= Date.now()) {
    TUIToast.warning(t('Preclass.StartInPast'));
    return;
  }
  if (!member.value) {
    TUIToast.warning(t('Preclass.MemberRequired'));
    return;
  }
  emit('submit', {
    title: name,
    start,
    end: start + (Number(duration.value) || DEFAULT_DURATION) * 60,
    attendee: member.value,
    muteAll: muteAll.value,
  });
}
</script>

<style scoped lang="scss">
.preclass-book {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.preclass-book-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: 16px 18px 12px;
  overflow: auto;
}

.preclass-field {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 8px 12px;
  align-items: center;
  min-width: 0;
}

.preclass-field.is-top {
  align-items: start;
}

.preclass-field.is-top .preclass-field-label {
  padding-top: 8px;
}

.preclass-field-label {
  font-size: 13px;
  line-height: 20px;
  color: var(--rk-text-secondary);
}

.preclass-book-time {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  min-width: 0;
}

.preclass-book-time :deep(.rk-date-picker),
.preclass-book-time :deep(.rk-popover-anchor) {
  display: block;
  min-width: 0;
}

.rk-input.preclass-book-input,
.preclass-book-date,
.preclass-book-select :deep(.rk-select-trigger) {
  box-sizing: border-box;
  height: 36px;
  min-height: 36px;
  font-size: 13px;
  color: var(--rk-text-primary);
  background: var(--pre-fill);
  border: 1px solid transparent;
  border-radius: 10px;
}

.preclass-book-select {
  width: 100%;
}

.preclass-book-date {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  padding: 0 12px;
  color: var(--rk-text-tertiary);
  cursor: pointer;
}

.preclass-book-date:hover,
.preclass-book-select :deep(.rk-select-trigger:hover) {
  background: var(--pre-fill-hover);
}

.rk-input.preclass-book-input:focus-within,
.preclass-book-date.is-open,
.preclass-book-select.rk-select-open :deep(.rk-select-trigger) {
  border-color: color-mix(in srgb, var(--rk-brand) 60%, transparent);
}

.preclass-book-date-text {
  min-width: 0;
  overflow: hidden;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preclass-book-mode {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  min-width: 0;
  padding: 3px;
  background: var(--pre-fill);
  border-radius: 12px;
}

.preclass-book-mode-item {
  box-sizing: border-box;
  height: 30px;
  padding: 0 8px;
  overflow: hidden;
  font-size: 13px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 9px;
}

.preclass-book-mode-item:hover {
  background: var(--pre-fill-hover);
}

.preclass-book-mode-item.is-active {
  color: #fff;
  background: var(--rk-brand);
}

.preclass-book-mode-hint {
  grid-column: 2;
  font-size: 12px;
  line-height: 18px;
  color: var(--rk-text-tertiary);
}

.preclass-book-foot {
  display: flex;
  flex: none;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px 16px;
}

.rk-btn.preclass-book-button {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  border: 0;
  border-radius: 12px;
  transition: background 0.15s, filter 0.15s;
}

.rk-btn-secondary.preclass-book-button {
  background: var(--pre-fill-hover);
}

.rk-btn-secondary.preclass-book-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--rk-text-primary) 13%, transparent);
}

.rk-btn-primary.preclass-book-button {
  font-weight: 600;
}

.rk-btn-primary.preclass-book-button:hover:not(:disabled) {
  background: var(--rk-brand);
  filter: brightness(1.08);
}
</style>
