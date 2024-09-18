<template>
  <div>
    <tui-select :value="currentValue" @input="currentValue = $event">
      <tui-option
        v-for="item in list"
        :key="item.value"
        :value="item.value"
        :label="item.label"
      />
    </tui-select>
  </div>
</template>
<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue';
import TuiSelect from '../Select';
import TuiOption from '../Option';

const props = defineProps<{
  value: string;
}>();
const emit = defineEmits(['input']);

const currentValue = ref();
watch(
  () => props.value,
  val => {
    if (!val) return;
    currentValue.value = val;
  },
  { immediate: true }
);
watch(currentValue, val => emit('input', val), { immediate: true });

const getTimeList = () => {
  const options: string[] = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const hour = i < 10 ? `0${i}` : `${i}`;
      const minute = j < 10 ? `0${j}` : `${j}`;
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};
const timeOptions = getTimeList();

const list = timeOptions.map(item => ({
  label: item,
  value: item,
}));
</script>
<style scoped lang="scss"></style>
