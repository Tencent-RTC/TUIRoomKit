<template>
  <div class="preclass-week">
    <div class="preclass-week-bar">
      <button
        type="button"
        class="preclass-week-nav"
        :aria-label="t('Preclass.PrevWeek')"
        @click="emit('select', addDays(selected, -7))"
      >
        ‹
      </button>
      <span>{{ formatMonth(selected.getFullYear(), selected.getMonth() + 1) }}</span>
      <button
        type="button"
        class="preclass-week-nav"
        :aria-label="t('Preclass.NextWeek')"
        @click="emit('select', addDays(selected, 7))"
      >
        ›
      </button>
    </div>
    <div class="preclass-week-head" aria-hidden="true">
      <span v-for="label in weekdayLabels()" :key="label">{{ label }}</span>
    </div>
    <div class="preclass-week-days">
      <button
        v-for="day in days"
        :key="toDateKey(day)"
        type="button"
        class="preclass-week-day"
        :class="{ 'is-on': sameDay(day, selected), 'is-today': sameDay(day, today) }"
        :aria-pressed="sameDay(day, selected)"
        :aria-label="formatDayLabel(day)"
        @click="emit('select', day)"
      >
        <b class="preclass-week-num">{{ day.getDate() }}</b>
        <i class="preclass-week-dot" :class="{ 'is-empty': !markedDays.has(toDateKey(day)) }" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { t } from '@tencentcloud/roomkit-web-vue3';
import {
  addDays,
  daysOfWeek,
  formatDayLabel,
  formatMonth,
  sameDay,
  toDateKey,
  weekStart,
  weekdayLabels,
} from './scheduleTime';

const props = defineProps<{
  selected: Date;
  /** `YYYY-MM-DD` keys of days that have at least one class. */
  markedDays: Set<string>;
  now: number;
}>();

const emit = defineEmits<{
  select: [day: Date];
}>();

const days = computed(() => daysOfWeek(weekStart(props.selected)));
const today = computed(() => new Date(props.now));
</script>

<style scoped lang="scss">
.preclass-week {
  padding: 10px 16px 12px;
  border-bottom: 1px solid var(--pre-line, var(--rk-border));
}

.preclass-week-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 650;
}

.preclass-week-nav {
  width: 28px;
  height: 28px;
  font: inherit;
  font-size: 18px;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.preclass-week-nav:hover {
  background: var(--rk-bg-hover);
}

.preclass-week-head,
.preclass-week-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.preclass-week-head span {
  font-size: 11px;
  color: var(--rk-text-tertiary);
  text-align: center;
}

.preclass-week-days {
  margin-top: 4px;
}

.preclass-week-day {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  padding: 2px 0 0;
  font: inherit;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.preclass-week-num {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 50%;
}

.preclass-week-day:hover .preclass-week-num {
  background: var(--rk-bg-hover);
}

.preclass-week-day.is-today:not(.is-on) .preclass-week-num {
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 12%, transparent);
}

.preclass-week-day.is-on .preclass-week-num,
.preclass-week-day.is-on:hover .preclass-week-num {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}

.preclass-week-dot {
  width: 4px;
  height: 4px;
  background: var(--rk-brand);
  border-radius: 50%;
}

.preclass-week-dot.is-empty {
  background: transparent;
}
</style>
