<template>
  <div ref="pickerRef" class="container">
    <TUIInput
      v-model:model-value="formattedDate"
      readonly
      class="datepicker-input"
      @focus="togglePicker"
    />
    <div v-if="showPicker" class="picker">
      <div class="picker-header">
        <span class="current-time">
          {{ currentYear }}/{{
            currentMonth < 10 ? `0${currentMonth}` : currentMonth
          }}
        </span>
        <button class="arrow" @click="changeMonth(-1)">
          &lt;
        </button>
        <button class="arrow" @click="changeMonth(1)">
          &gt;
        </button>
      </div>
      <div class="picker-weekdays">
        <div
          v-for="weekday in weekdays"
          :key="weekday"
          class="weekday"
        >
          {{ weekday }}
        </div>
      </div>
      <div class="picker-body">
        <div
          v-for="day in days"
          :key="day.id"
          class="day"
          :class="{
            'other-month': day.otherMonth,
            selected: isSelected(day.date),
            today: isToday(day.date),
            past: isPast(day.date),
          }"
          @click="selectDate(day.date)"
        >
          {{ day.label }}
          <span v-if="isToday(day.date)" class="today-dot" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
} from 'vue';
import { TUIInput, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

const isPast = (date: any) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

interface Props {
  modelValue: number;
}
const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);
const showPicker = ref(false);

const selectedDate = ref(props.modelValue ? new Date(props.modelValue * 1000) : new Date());
const currentYear = ref(selectedDate.value.getFullYear());
const currentMonth = ref(selectedDate.value.getMonth() + 1);

const pickerRef = ref<any>(null);
const closeOnOutsideClick = (event: any) => {
  if (!pickerRef.value.contains(event.target)) {
    showPicker.value = false;
  }
};
const togglePicker = () => {
  showPicker.value = !showPicker.value;
};
onMounted(() => {
  window.addEventListener('click', closeOnOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener('click', closeOnOutsideClick);
});

watch(
  selectedDate,
  (newValue) => {
    const dateOnly = new Date(newValue);
    dateOnly.setHours(0, 0, 0, 0);
    const timestamp = Math.floor(dateOnly.getTime() / 1000);
    emit('update:modelValue', timestamp);
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      return;
    }
    selectedDate.value = new Date(newValue * 1000);
    currentMonth.value = selectedDate.value.getMonth() + 1;
    currentYear.value = selectedDate.value.getFullYear();
  },
  { immediate: true },
);

const changeMonth = (value: any) => {
  currentMonth.value += value;
  if (currentMonth.value === 0) {
    currentMonth.value = 12;
    currentYear.value -= 1;
  } else if (currentMonth.value === 13) {
    currentMonth.value = 1;
    currentYear.value += 1;
  }
};

const selectDate = (date: any) => {
  if (isPast(date)) {
    return;
  }
  selectedDate.value = date;
  showPicker.value = false;
};

const days = ref<any[]>([]);

const updateDays = () => {
  const daysArray = [];
  const firstDay = new Date(
    currentYear.value,
    currentMonth.value - 1,
    1,
  ).getDay();
  const daysInMonth = new Date(
    currentYear.value,
    currentMonth.value,
    0,
  ).getDate();
  const daysInPrevMonth = new Date(
    currentYear.value,
    currentMonth.value - 1,
    0,
  ).getDate();

  for (let i = daysInPrevMonth - firstDay + 1; i <= daysInPrevMonth; i += 1) {
    const date = new Date(currentYear.value, currentMonth.value - 2, i);
    daysArray.push({
      id: date.toISOString(),
      label: i,
      date,
      otherMonth: true,
    });
  }

  for (let i = 1; i <= daysInMonth; i += 1) {
    const date = new Date(currentYear.value, currentMonth.value - 1, i);
    daysArray.push({
      id: date.toISOString(),
      label: i,
      date,
      otherMonth: false,
    });
  }

  const remainingDays = 35 - daysArray.length;
  if (remainingDays > 0) {
    for (let i = 1; i <= remainingDays; i += 1) {
      const date = new Date(currentYear.value, currentMonth.value, i);
      daysArray.push({
        id: date.toISOString(),
        label: i,
        date,
        otherMonth: true,
      });
    }
  }

  days.value = daysArray.slice(0, 35);
};

watchEffect(() => {
  updateDays();
});

const formattedDate = computed(
  () =>
    `${selectedDate.value.getFullYear()}-${selectedDate.value.getMonth() + 1}-${selectedDate.value.getDate()}`,
);

const isSelected = (date: any) =>
  date.toISOString() === selectedDate.value.toISOString();

const isToday = (date: any) => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
  );
};

const weekdays = computed(() => [
  t('ScheduleRoomPanel.Sunday'),
  t('ScheduleRoomPanel.Monday'),
  t('ScheduleRoomPanel.Tuesday'),
  t('ScheduleRoomPanel.Wednesday'),
  t('ScheduleRoomPanel.Thursday'),
  t('ScheduleRoomPanel.Friday'),
  t('ScheduleRoomPanel.Saturday'),
]);
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.datepicker-input {
  width: 100%;
  cursor: pointer;
}

.picker {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: inline-block;
  width: 100%;
  min-width: 222px;
  padding: 5px;
  font-size: 12px;
  border-radius: 4px;
  background-color: var(--bg-color-dialog);
  color: var(--text-color-primary);
  border: 1px solid var(--stroke-color-module);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
  font-size: 14px;
  line-height: normal;

  .current-time {
    width: 80%;
    font-weight: bold;
    color: var(--text-color-primary);
  }
}

.arrow {
  display: inline-block;
  padding: 0 5px;
  cursor: pointer;
  background-color: transparent;
  border: none;
  color: var(--text-color-primary);
}

.arrow:hover {
  color: var(--text-color-link);
}

.picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.weekday {
  padding: 5px;
  line-height: initial;
  text-align: center;
}

.picker-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day {
  position: relative;
  padding: 5px;
  line-height: initial;
  text-align: center;
  cursor: pointer;
}

.day.selected {
  color: var(--text-color-button);
  background-color: var(--button-color-primary-hover);
}

.day.today .today-dot {
  position: absolute;
  bottom: 0;
  left: 50%;
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  transform: translateX(-50%);
  background-color: var(--button-color-primary-hover);
}

.day.past {
  color: var(--text-color-disabled);
  pointer-events: none;
}
</style>
