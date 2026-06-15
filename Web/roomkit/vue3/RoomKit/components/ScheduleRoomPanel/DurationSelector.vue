<template>
  <TUISelect :model-value="modelValue" @update:model-value="handleUpdate">
    <TUIOption
      v-for="option in durationOptions"
      :key="option.value"
      :value="option.value"
      :label="option.label"
    />
  </TUISelect>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUISelect, TUIOption, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  modelValue: number;
  options?: Array<{ label: string; value: number }>;
}

interface Emits {
  (e: 'update:modelValue', value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  options: undefined,
});

const emit = defineEmits<Emits>();

const { t } = useUIKit();

// 时长限制：最少15分钟，最长24小时
const MIN_DURATION = 15 * 60; // 15分钟 = 900秒
const MAX_DURATION = 24 * 3600; // 24小时 = 86400秒
const ONE_HOUR = 3600; // 1小时 = 3600秒
const DURATION_INTERVAL_15MIN = 15 * 60; // 15分钟间隔 = 900秒

// Format duration text using i18n
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} ${t('ScheduleRoomPanel.Minutes')}`;
  }
  return hours === 1 ? `1 ${t('ScheduleRoomPanel.Hour')}` : `${hours} ${t('ScheduleRoomPanel.Hours')}`;
};

// Generate duration values: 15-minute intervals for < 1 hour, 1-hour intervals for >= 1 hour
const durationValues = computed(() => {
  const values: number[] = [];

  // Generate 15-minute intervals for durations less than 1 hour
  for (let seconds = MIN_DURATION; seconds < ONE_HOUR; seconds += DURATION_INTERVAL_15MIN) {
    values.push(seconds);
  }

  // Generate 1-hour intervals for durations >= 1 hour
  for (let hours = 1; hours <= 24; hours += 1) {
    values.push(hours * ONE_HOUR);
  }

  return values;
});

// Default duration options (computed to support i18n updates)
const defaultDurationOptions = computed(() =>
  durationValues.value.map(value => ({
    label: formatDuration(value),
    value,
  })),
);

// 使用传入的选项或默认选项，并过滤超出范围的选项
const durationOptions = computed(() => {
  const options = props.options || defaultDurationOptions.value;
  return options.filter(option => option.value >= MIN_DURATION && option.value <= MAX_DURATION);
});

const handleUpdate = (value: number) => {
  if (value < MIN_DURATION) {
    TUIToast.error({ message: t('ScheduleRoomPanel.DurationMin') });
    return;
  }
  if (value > MAX_DURATION) {
    TUIToast.error({ message: t('ScheduleRoomPanel.DurationMax') });
    return;
  }
  emit('update:modelValue', value);
};
</script>
