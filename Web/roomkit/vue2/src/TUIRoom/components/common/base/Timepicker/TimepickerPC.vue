<template>
  <div class="container">
    <TuiSelect
      v-model="selectedTime"
      theme="white"
      class="timepicker-select"
      :teleported="false"
      :custom-select-content-style="{ 'font-weight': 400 }"
    >
      <TuiOption
        v-for="time in timeOptions"
        :key="time"
        theme="white"
        :value="time"
        :label="time"
        :custom-option-content-style="{ 'font-weight': 400 }"
      />
    </TuiSelect>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue';
import TuiSelect from '../Select';
import TuiOption from '../Option';
interface Props {
  modelValue: string;
}
const props = defineProps<Props>();
const emit = defineEmits(['input']);
const selectedTime = ref(props.modelValue);

const timeOptions = computed(() => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const hour = i < 10 ? `0${i}` : `${i}`;
      const minute = j < 10 ? `0${j}` : `${j}`;
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
});

const updateTime = () => {
  emit('input', selectedTime.value);
};

watch(
  selectedTime,
  () => {
    updateTime();
  },
  {
    immediate: true,
  }
);
watch(
  () => props.modelValue,
  newValue => {
    selectedTime.value = newValue;
  },
  { immediate: true }
);
</script>
