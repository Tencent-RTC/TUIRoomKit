<template>
  <div class="sch-field">
    <span class="sch-label">{{ t('Schedule.Start') }}</span>
    <div class="sch-time-row">
      <TUIDatePicker
        :model-value="date"
        disable-past
        :weekdays="weekdays"
        :prev-month-label="t('Schedule.PrevMonth')"
        :next-month-label="t('Schedule.NextMonth')"
        :format-month="formatScheduleMonth"
        @change="emit('update:date', $event)"
      >
        <template #default="{ open }">
          <div
            class="sch-time-card"
            :class="{ 'is-open': open }"
          >
            <span class="sch-time-icon">
              <IconCalendar :size="14" />
            </span>
            <span class="sch-time-value-text">{{ formatScheduleDate(date) }}</span>
          </div>
        </template>
      </TUIDatePicker>
      <TUISelect
        class="sch-select"
        :model-value="time"
        @change="emit('update:time', String($event))"
      >
        <TUIOption
          v-for="slot in slots"
          :key="slot"
          :value="slot"
        />
      </TUISelect>
    </div>
  </div>

  <div class="sch-field">
    <span class="sch-label">{{ t('Schedule.Duration') }}</span>
    <TUISelect
      class="sch-select"
      :model-value="duration"
      @change="emit('update:duration', Number($event))"
    >
      <TUIOption
        v-for="minutes in DURATION_MINUTES"
        :key="minutes"
        :value="minutes"
        :label="durationLabel(minutes)"
      />
    </TUISelect>
  </div>

  <div class="sch-field">
    <span class="sch-label">{{ t('Schedule.Timezone') }}</span>
    <TUISelect
      class="sch-select"
      :model-value="timezone"
      @change="emit('update:timezone', String($event))"
    >
      <TUIOption
        v-for="zone in TIMEZONE_VALUES"
        :key="zone"
        :value="zone"
        :label="timezoneLabel(zone)"
      />
    </TUISelect>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconCalendar, TUIDatePicker, TUIOption, TUISelect, t } from '../../../base';
import {
  DURATION_MINUTES,
  TIMEZONE_VALUES,
  WEEKDAY_SHORT_KEYS,
  durationLabel,
  formatScheduleDate,
  formatScheduleMonth,
  timeSlots,
  timezoneLabel,
} from './scheduleUtils';

defineProps<{
  date: string;
  time: string;
  duration: number;
  timezone: string;
}>();

const emit = defineEmits<{
  'update:date': [value: string];
  'update:time': [value: string];
  'update:duration': [value: number];
  'update:timezone': [value: string];
}>();

const slots = timeSlots();
const weekdays = computed(() => WEEKDAY_SHORT_KEYS.map(key => t(key)));
</script>

<style scoped lang="scss">
.sch-field {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px 16px;
  align-items: center;
  min-width: 0;
}

.sch-label {
  font-size: var(--rk-fs-md);
  font-weight: 400;
  line-height: 40px;
  color: var(--rk-text-primary);
}

.sch-time-card,
.sch-select :deep(.rk-select-trigger) {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  min-height: 40px;
  padding: 6px 10px;
  cursor: pointer;
  background: var(--rk-bg-raised, var(--rk-bg-surface));
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.sch-time-card {
  gap: 6px;
  min-width: 0;
  color: var(--rk-text-primary);
}

.sch-time-card.is-open,
.sch-select.rk-select-open :deep(.rk-select-trigger) {
  border-color: var(--rk-brand);
  box-shadow: 0 0 0 1px var(--rk-brand);
}

.sch-time-card:hover,
.sch-select :deep(.rk-select-trigger:hover) {
  border-color: var(--rk-brand);
}

.sch-time-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sch-time-icon {
  display: inline-flex;
  flex: none;
  color: var(--rk-text-tertiary);
}

.sch-time-value-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: var(--rk-fs-md);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (width <= 520px) {
  .sch-field {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .sch-label {
    line-height: 22px;
  }

  .sch-time-row {
    grid-template-columns: 1fr;
  }
}
</style>
