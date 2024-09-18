<template>
  <div>
    <tui-select :value="currentValue" @input="currentValue = $event">
      <tui-option
        v-for="item in yearDates"
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
  value: string | Date;
}>();
const emit = defineEmits(['input']);

const currentValue = ref();
watch(
  () => props.value,
  val => {
    if (!val) return;
    currentValue.value = new Date(val).getTime();
  },
  { immediate: true }
);
watch(currentValue, val => emit('input', new Date(val)), { immediate: true });

function generateYearDates(year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const dates = [];

  const currentDate = startDate;
  while (currentDate <= endDate) {
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    dates.push(
      `${year}/${month < 10 ? `0${month}` : month}/${day < 10 ? `0${day}` : day}`
    );
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

const yearDates = generateYearDates(new Date().getFullYear()).map(item => ({
  label: item,
  value: new Date(item).getTime(),
}));
</script>
<style scoped lang="scss"></style>
