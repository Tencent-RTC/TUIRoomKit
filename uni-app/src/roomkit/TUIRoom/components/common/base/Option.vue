<template>
  <div :class="['option-container', { 'active': isSelected }]" @click="handleChooseOption">
    <span class="option-content">{{ label || value }}</span>
  </div>
</template>

<script setup lang="ts">
import { inject, watch, computed, onBeforeUnmount } from 'vue';

interface OptionData {
  label: string,
  value: string | number | boolean | object,
}

interface SelectData {
  selectedValue: string | number | boolean | object,
  optionObj: Record<any, any>,
  optionDataList: OptionData[],
  onOptionCreated: (optionData: OptionData) => void,
  onOptionDestroyed: (value: string | number | boolean | object) => void,
  onOptionSelected: (optionData: OptionData) => void,
}

const props = defineProps<OptionData>();

const select: SelectData | undefined = inject('select');

const isSelected = computed(() => select && select.selectedValue === props.value);

const optionData = computed(() => ({
  label: props.label,
  value: props.value,
}));

select?.onOptionCreated(optionData.value);

onBeforeUnmount(() => {
  select?.onOptionDestroyed(props.value);
});

watch(() => [props.value, props.label], (val, oldVal) => {
  if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
    select?.onOptionDestroyed(oldVal);
    select?.onOptionCreated(optionData.value);
  }
});

function handleChooseOption() {
  select?.onOptionSelected(optionData.value);
}

</script>

<style lang="scss" scoped>

// .tui-theme-white .option-container {
//   --hover-background-color: rgba(213, 224, 242, 0.5);
// }

// .tui-theme-black .option-container {
//   --hover-background-color: rgba(213, 224, 242, 0.5);
// }

.option-container {
  padding: 6px 15px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  color: #000;
  &.active {
    color: #1C66E5;
  }
  &:hover {
    background-color: rgba(213, 224, 242, 0.5);
  }
  .option-content {
    font-size: 14px;
    line-height: 22px;
    font-weight: 500;
  }
}
</style>
