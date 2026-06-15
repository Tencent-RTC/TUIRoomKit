<template>
  <div class="time-picker">
    <TUISelect
      v-model="selectedTime"
      class="timepicker-select"
      :teleported="false"
      :custom-select-content-style="{ 'font-weight': 400 }"
    >
      <TUIOption
        v-for="time in timeOptions"
        :key="time"
        :value="time"
        :label="time"
        :custom-option-content-style="{ 'font-weight': 400 }"
      />
    </TUISelect>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { TUISelect, TUIOption } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  modelValue: number; // 时间戳（秒）
}
const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

// 从时间戳中提取时间字符串
const getTimeFromTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const selectedTime = ref(props.modelValue ? getTimeFromTimestamp(props.modelValue) : '00:00');

const timeOptions = computed(() => {
  const options = [];
  for (let i = 0; i < 24; i += 1) {
    for (let j = 0; j < 60; j += 15) {
      const hour = i < 10 ? `0${i}` : `${i}`;
      const minute = j < 10 ? `0${j}` : `${j}`;
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
});

const updateTime = () => {
  // 将时间字符串转换为当天的时间戳（保持完整的日期+时间）
  const [hours, minutes] = selectedTime.value.split(':').map(Number);
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  const timestamp = Math.floor(today.getTime() / 1000);
  emit('update:modelValue', timestamp);
};

watch(
  selectedTime,
  () => {
    updateTime();
  },
  {
    immediate: true,
  },
);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      selectedTime.value = getTimeFromTimestamp(newValue);
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.time-picker {
  min-width: 100px;
}
</style>
