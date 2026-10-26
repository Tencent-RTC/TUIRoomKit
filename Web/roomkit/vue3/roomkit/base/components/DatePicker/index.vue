<template>
  <div class="rk-date-picker">
    <TUIPopover
      :open="isOpen"
      placement="bottom-start"
      :offset="4"
      :padded="false"
      :disabled="disabled"
      @update:open="setOpen"
    >
      <slot :open="isOpen" />
      <template #content>
        <div class="rk-date-picker-panel">
          <div class="rk-date-picker-head">
            <TUIButton
              class="rk-date-picker-nav"
              variant="ghost"
              size="sm"
              :aria-label="prevMonthLabel"
              :disabled="!canPrevMonth"
              @click="shiftMonth(-1)"
            >
              <IconChevron
                class="rk-date-picker-prev"
                :size="14"
              />
            </TUIButton>
            <div class="rk-date-picker-title">
              {{ monthTitle }}
            </div>
            <TUIButton
              class="rk-date-picker-nav"
              variant="ghost"
              size="sm"
              :aria-label="nextMonthLabel"
              :disabled="!canNextMonth"
              @click="shiftMonth(1)"
            >
              <IconChevron
                class="rk-date-picker-next"
                :size="14"
              />
            </TUIButton>
          </div>
          <div class="rk-date-picker-week">
            <span
              v-for="(label, index) in weekdays"
              :key="index"
            >{{ label }}</span>
          </div>
          <div class="rk-date-picker-grid">
            <div
              v-for="cell in cells"
              :key="cell.iso"
              class="rk-date-picker-day"
              :class="{
                'is-muted': cell.muted,
                'is-disabled': !isSelectable(cell.iso),
                'is-today': cell.iso === today,
                'is-active': cell.iso === modelValue,
              }"
              @click="pick(cell.iso)"
            >
              {{ cell.day }}
            </div>
          </div>
        </div>
      </template>
    </TUIPopover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IconChevron } from '../../icons';
import TUIButton from '../Button/index.vue';
import TUIPopover from '../Popover/index.vue';
import { calendarCells, canShiftMonth, isDateInRange, toDateKey } from './calendar';

defineOptions({ name: 'TUIDatePicker' });

const props = withDefaults(defineProps<{
  /** `YYYY-MM-DD` in local time. */
  modelValue: string;
  min?: string;
  max?: string;
  /** Raises `min` to the current day, re-read every time the panel opens. */
  disablePast?: boolean;
  disabled?: boolean;
  /** Seven labels, Sunday first. */
  weekdays?: string[];
  prevMonthLabel?: string;
  nextMonthLabel?: string;
  formatMonth?: (year: number, month: number) => string;
}>(), {
  min: undefined,
  max: undefined,
  formatMonth: undefined,
  weekdays: () => ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  prevMonthLabel: 'Previous month',
  nextMonthLabel: 'Next month',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
}>();

const isOpen = ref(false);
const today = ref(toDateKey(new Date()));
const viewYear = ref(0);
const viewMonth = ref(0);

const minDate = computed(() => {
  if (!props.disablePast) return props.min;
  return props.min && props.min > today.value ? props.min : today.value;
});
const cells = computed(() => calendarCells(viewYear.value, viewMonth.value));
const canPrevMonth = computed(() =>
  canShiftMonth(viewYear.value, viewMonth.value, -1, minDate.value, props.max),
);
const canNextMonth = computed(() =>
  canShiftMonth(viewYear.value, viewMonth.value, 1, minDate.value, props.max),
);
const monthTitle = computed(() => (
  props.formatMonth
    ? props.formatMonth(viewYear.value, viewMonth.value)
    : new Date(viewYear.value, viewMonth.value - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })
));

function isSelectable(iso: string): boolean {
  return isDateInRange(iso, minDate.value, props.max);
}

/** Shows the selected month, or the first selectable one when the value is out of range. */
function syncView() {
  const anchor = props.modelValue && isSelectable(props.modelValue)
    ? props.modelValue
    : minDate.value ?? today.value;
  const [year, month] = anchor.split('-').map(Number);
  viewYear.value = year;
  viewMonth.value = month;
}

watch(() => props.modelValue, syncView, { immediate: true });

function setOpen(open: boolean) {
  isOpen.value = open;
  if (open) {
    today.value = toDateKey(new Date());
    syncView();
  }
}

function shiftMonth(offset: number) {
  if (!canShiftMonth(viewYear.value, viewMonth.value, offset, minDate.value, props.max)) return;
  const cursor = new Date(viewYear.value, viewMonth.value - 1 + offset, 1);
  viewYear.value = cursor.getFullYear();
  viewMonth.value = cursor.getMonth() + 1;
}

function pick(iso: string) {
  if (!isSelectable(iso)) return;
  emit('update:modelValue', iso);
  emit('change', iso);
  isOpen.value = false;
}
</script>

<style scoped lang="scss">
.rk-date-picker {
  display: flex;
  min-width: 0;
}

.rk-date-picker :deep(.rk-popover-anchor) {
  width: 100%;
  min-width: 0;
}

.rk-date-picker-panel {
  box-sizing: border-box;
  width: 292px;
  min-width: 292px;
  padding: 10px 8px 8px;
}

.rk-date-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.rk-date-picker-title {
  font-size: var(--rk-fs-md);
  font-weight: 600;
  color: var(--rk-text-primary);
}

.rk-date-picker-nav {
  width: 28px;
  min-width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-secondary);
  border: 0;
  border-radius: 8px;
}

.rk-date-picker-nav:hover:not(:disabled) {
  color: var(--rk-text-primary);
  background: var(--rk-bg-muted);
}

.rk-date-picker-prev {
  transform: rotate(90deg);
}

.rk-date-picker-next {
  transform: rotate(-90deg);
}

.rk-date-picker-week,
.rk-date-picker-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.rk-date-picker-week span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: var(--rk-text-tertiary);
}

.rk-date-picker-day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: var(--rk-text-primary);
  cursor: pointer;
  border-radius: 8px;
}

.rk-date-picker-day:hover {
  background: var(--rk-bg-muted);
}

.rk-date-picker-day.is-muted,
.rk-date-picker-day.is-disabled {
  color: var(--rk-text-tertiary);
  opacity: 0.45;
}

.rk-date-picker-day.is-disabled {
  pointer-events: none;
  cursor: default;
}

.rk-date-picker-day.is-today {
  color: var(--rk-brand);
}

.rk-date-picker-day.is-active {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}

@media (width <= 520px) {
  .rk-date-picker-panel {
    width: 100%;
    min-width: 0;
  }
}
</style>
