<template>
  <div class="container">
    <TuiSelect
      v-model="selectedTime"
      theme="white"
      :teleported="false"
      :custom-select-content-style="{ 'font-weight': 400 }"
      :value="selectedTime"
      @input="selectedTime = $event"
    >
      <TuiOption
        v-for="time in timeOptions"
        :key="time.value"
        theme="white"
        :value="time.value"
        :label="time.label"
        :custom-option-content-style="{ 'font-weight': 400 }"
      />
    </TuiSelect>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue';
import TuiSelect from '../common/base/Select';
import TuiOption from '../common/base/Option';
import { useI18n } from '../../locales';

const { t } = useI18n();
interface Props {
  modelValue: number;
}
const props = defineProps<Props>();
const emit = defineEmits(['input']);
const selectedTime = ref(props.modelValue);

const timeOptions = computed(() => {
  const options = [];
  // Add options for 15, 30, and 45 minutes
  for (let i = 15; i < 60; i += 15) {
    options.push({ value: i * 60, label: `${i} ${t('minutes')}` });
  }
  // Add options for 1 to 24 hours
  for (let i = 1; i < 24; i++) {
    options.push({ value: i * 60 * 60, label: `${i} ${t('hours')}` });
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
