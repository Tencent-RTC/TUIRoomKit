<template>
  <div class="sch-field">
    <span class="sch-label">{{ t('Schedule.Start') }}</span>
    <div class="sch-time-row">
      <TUIPopover
        class="sch-dd"
        :open="openPicker === 'date'"
        placement="bottom-start"
        :offset="4"
        :padded="false"
        @update:open="onPickerOpen('date', $event)"
      >
        <div
          class="sch-time-card is-picker"
          :class="{ 'is-open': openPicker === 'date' }"
        >
          <span class="sch-time-value">
            <span class="sch-time-icon">
              <IconCalendar :size="14" />
            </span>
            <span class="sch-time-value-text">{{ formatScheduleDate(date) }}</span>
          </span>
        </div>
        <template #content>
          <div class="sch-cal">
            <div class="sch-cal-head">
              <TUIButton
                class="sch-cal-nav"
                variant="ghost"
                size="sm"
                :aria-label="t('Schedule.PrevMonth')"
                :disabled="!canPrevMonth"
                @click="shiftMonth(-1)"
              >
                <IconChevron
                  class="is-prev"
                  :size="14"
                />
              </TUIButton>
              <div class="sch-cal-head-title">
                {{ formatScheduleMonth(calYear, calMonth) }}
              </div>
              <TUIButton
                class="sch-cal-nav"
                variant="ghost"
                size="sm"
                :aria-label="t('Schedule.NextMonth')"
                :disabled="!canNextMonth"
                @click="shiftMonth(1)"
              >
                <IconChevron
                  class="is-next"
                  :size="14"
                />
              </TUIButton>
            </div>
            <div class="sch-cal-week">
              <span
                v-for="key in WEEKDAY_SHORT_KEYS"
                :key="key"
              >{{ t(key) }}</span>
            </div>
            <div class="sch-cal-grid">
              <div
                v-for="cell in monthCells"
                :key="cell.iso"
                class="sch-cal-day"
                :class="{
                  'is-muted': cell.muted,
                  'is-disabled': !isDateSelectable(cell.iso),
                  'is-today': cell.iso === today,
                  'is-active': cell.iso === date,
                }"
                @click="pickDate(cell.iso)"
              >
                {{ cell.day }}
              </div>
            </div>
          </div>
        </template>
      </TUIPopover>
      <TUIPopover
        class="sch-dd"
        :open="openPicker === 'time'"
        placement="bottom-start"
        :offset="4"
        :padded="false"
        @update:open="onPickerOpen('time', $event)"
      >
        <div
          class="sch-time-card is-picker"
          :class="{ 'is-open': openPicker === 'time' }"
        >
          <span class="sch-time-value">
            <span class="sch-time-value-text">{{ time }}</span>
            <IconChevron
              class="sch-dd-caret"
              :class="{ 'is-open': openPicker === 'time' }"
              :size="12"
            />
          </span>
        </div>
        <template #content>
          <div
            ref="timeMenu"
            class="sch-dd-menu"
          >
            <div
              v-for="slot in slots"
              :key="slot"
              class="sch-dd-item"
              :class="{ 'is-active': slot === time }"
              @click="pickTime(slot)"
            >
              <span>{{ slot }}</span>
              <span class="sch-dd-item-check">
                <IconCheck :size="14" />
              </span>
            </div>
          </div>
        </template>
      </TUIPopover>
    </div>
  </div>

  <div class="sch-field">
    <span class="sch-label">{{ t('Schedule.Duration') }}</span>
    <TUIPopover
      class="sch-dd"
      :open="openPicker === 'duration'"
      placement="bottom-start"
      :offset="4"
      :padded="false"
      @update:open="onPickerOpen('duration', $event)"
    >
      <div
        class="sch-topic-card sch-dd-btn"
        :class="{ 'is-open': openPicker === 'duration' }"
      >
        <span class="sch-topic-input">{{ durationLabel(duration) }}</span>
        <IconChevron
          class="sch-dd-caret"
          :class="{ 'is-open': openPicker === 'duration' }"
          :size="12"
        />
      </div>
      <template #content>
        <div
          ref="durationMenu"
          class="sch-dd-menu"
        >
          <div
            v-for="minutes in DURATION_MINUTES"
            :key="minutes"
            class="sch-dd-item"
            :class="{ 'is-active': minutes === duration }"
            @click="pickDuration(minutes)"
          >
            <span>{{ durationLabel(minutes) }}</span>
            <span class="sch-dd-item-check">
              <IconCheck :size="14" />
            </span>
          </div>
        </div>
      </template>
    </TUIPopover>
  </div>

  <div class="sch-field">
    <span class="sch-label">{{ t('Schedule.Timezone') }}</span>
    <TUIPopover
      class="sch-dd"
      :open="openPicker === 'timezone'"
      placement="bottom-start"
      :offset="4"
      :padded="false"
      @update:open="onPickerOpen('timezone', $event)"
    >
      <div
        class="sch-topic-card sch-dd-btn"
        :class="{ 'is-open': openPicker === 'timezone' }"
      >
        <span class="sch-topic-input">{{ timezoneLabel(timezone) }}</span>
        <IconChevron
          class="sch-dd-caret"
          :class="{ 'is-open': openPicker === 'timezone' }"
          :size="12"
        />
      </div>
      <template #content>
        <div
          ref="timezoneMenu"
          class="sch-dd-menu"
        >
          <div
            v-for="zone in TIMEZONE_VALUES"
            :key="zone"
            class="sch-dd-item"
            :class="{ 'is-active': zone === timezone }"
            @click="pickTimezone(zone)"
          >
            <span>{{ timezoneLabel(zone) }}</span>
            <span class="sch-dd-item-check">
              <IconCheck :size="14" />
            </span>
          </div>
        </div>
      </template>
    </TUIPopover>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { IconCalendar, IconCheck, IconChevron, TUIButton, TUIPopover } from '../../../base';
import { t } from '../../../i18n';
import { scrollActiveMenuItem } from './scheduleOverlay';
import {
  DURATION_MINUTES,
  TIMEZONE_VALUES,
  WEEKDAY_SHORT_KEYS,
  calendarCells,
  canShiftScheduleMonth,
  dateKey,
  durationLabel,
  formatScheduleDate,
  formatScheduleMonth,
  isScheduleDateSelectable,
  timeSlots,
  timezoneLabel,
} from './scheduleUtils';
import type { TimezoneValue } from './scheduleUtils';

type PickerKind = 'date' | 'time' | 'duration' | 'timezone' | '';

const props = defineProps<{
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

const rangeNow = ref(new Date());
const today = computed(() => dateKey(rangeNow.value));
const minDate = computed(() => dateKey(rangeNow.value));
const calYear = ref(new Date().getFullYear());
const calMonth = ref(new Date().getMonth() + 1);
const openPicker = ref<PickerKind>('');
const timeMenu = ref<HTMLElement>();
const durationMenu = ref<HTMLElement>();
const timezoneMenu = ref<HTMLElement>();
const slots = timeSlots();
const monthCells = computed(() => calendarCells(calYear.value, calMonth.value));
const canPrevMonth = computed(() =>
  canShiftScheduleMonth(calYear.value, calMonth.value, -1, minDate.value),
);
const canNextMonth = computed(() =>
  canShiftScheduleMonth(calYear.value, calMonth.value, 1, minDate.value),
);

function isDateSelectable(iso: string): boolean {
  return isScheduleDateSelectable(iso, minDate.value);
}

function showMonthForDate(iso: string) {
  if (iso >= minDate.value) {
    const [year, month] = iso.split('-').map(Number);
    if (year && month) {
      calYear.value = year;
      calMonth.value = month;
    }
    return;
  }
  const now = new Date();
  calYear.value = now.getFullYear();
  calMonth.value = now.getMonth() + 1;
}

watch(() => props.date, showMonthForDate, { immediate: true });

function onPickerOpen(kind: Exclude<PickerKind, ''>, open: boolean) {
  if (!open) {
    if (openPicker.value === kind) {
      openPicker.value = '';
    }
    return;
  }
  openPicker.value = kind;
  if (kind === 'date') {
    rangeNow.value = new Date();
    showMonthForDate(props.date);
    return;
  }
  void nextTick(() => {
    const menus: Partial<Record<PickerKind, HTMLElement | undefined>> = {
      time: timeMenu.value,
      duration: durationMenu.value,
      timezone: timezoneMenu.value,
    };
    scrollActiveMenuItem(menus[kind]);
  });
}

function shiftMonth(offset: number) {
  if (!canShiftScheduleMonth(calYear.value, calMonth.value, offset, minDate.value)) {
    return;
  }
  const cursor = new Date(calYear.value, calMonth.value - 1 + offset, 1);
  calYear.value = cursor.getFullYear();
  calMonth.value = cursor.getMonth() + 1;
}

function pickDate(iso: string) {
  if (!isDateSelectable(iso)) {
    return;
  }
  emit('update:date', iso);
  openPicker.value = '';
}

function pickTime(slot: string) {
  emit('update:time', slot);
  openPicker.value = '';
}

function pickDuration(minutes: number) {
  emit('update:duration', minutes);
  openPicker.value = '';
}

function pickTimezone(zone: TimezoneValue) {
  emit('update:timezone', zone);
  openPicker.value = '';
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

.sch-topic-card,
.sch-time-card {
  box-sizing: border-box;
  display: flex;
  align-items: center;
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

.sch-topic-card:focus-within,
.sch-time-card.is-open,
.sch-dd-btn.is-open {
  border-color: var(--rk-brand);
  box-shadow: 0 0 0 1px var(--rk-brand);
}

.sch-time-card:hover {
  border-color: var(--rk-brand);
}

.sch-topic-input {
  width: 100%;
  min-width: 0;
  padding: 0;
  font-size: 13px;
  font-weight: 400;
  line-height: 1;
  color: var(--rk-text-primary);
  background: transparent;
  border: 0;
  outline: none;
}

.sch-time-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sch-time-card.is-picker,
.sch-dd-btn {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.sch-time-value {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  min-width: 0;
  color: var(--rk-text-primary);
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
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sch-dd.sch-dd {
  display: flex;
  width: 100%;
  min-width: 0;
}

.sch-dd-btn {
  gap: 10px;
  justify-content: space-between;
}

.sch-dd-btn .sch-topic-input {
  pointer-events: none;
}

.sch-dd-caret {
  flex: none;
  color: var(--rk-text-tertiary);
  transition: transform 0.16s ease;
}

.sch-dd-caret.is-open,
.sch-time-card.is-open .sch-dd-caret {
  transform: rotate(180deg);
}

.is-prev {
  transform: rotate(90deg);
}

.is-next {
  transform: rotate(-90deg);
}

.sch-dd-menu {
  min-width: 180px;
  max-height: 280px;
  padding: 6px;
  overflow-y: auto;

  @include hide-scrollbar;
}

.sch-dd-item {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 36px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--rk-text-primary);
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
}

.sch-dd-item-check {
  display: inline-flex;
  flex: none;
  color: var(--rk-brand);
  opacity: 0;
}

.sch-dd-item:hover {
  background: var(--rk-bg-muted);
}

.sch-dd-item.is-active {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
}

.sch-dd-item.is-active .sch-dd-item-check {
  opacity: 1;
}

.sch-cal {
  box-sizing: border-box;
  width: 292px;
  min-width: 292px;
  padding: 10px 8px 8px;
}

.sch-cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.sch-cal-head-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--rk-text-primary);
}

.sch-cal-nav {
  width: 28px;
  min-width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-secondary);
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.sch-cal-nav:hover:not(:disabled) {
  color: var(--rk-text-primary);
  background: var(--rk-bg-muted);
}

.sch-cal-week,
.sch-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.sch-cal-week span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  font-size: 11px;
  font-weight: 500;
  color: var(--rk-text-tertiary);
}

.sch-cal-day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: 12px;
  font-weight: 500;
  color: var(--rk-text-primary);
  cursor: pointer;
  border-radius: 8px;
}

.sch-cal-day:hover {
  background: var(--rk-bg-muted);
}

.sch-cal-day.is-muted,
.sch-cal-day.is-disabled {
  color: var(--rk-text-tertiary);
  opacity: 0.45;
}

.sch-cal-day.is-disabled {
  pointer-events: none;
  cursor: default;
}

.sch-cal-day.is-disabled:hover {
  background: transparent;
}

.sch-cal-day.is-today {
  color: var(--rk-brand);
}

.sch-cal-day.is-active {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
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

  .sch-cal {
    width: 100%;
    min-width: 0;
  }
}
</style>
