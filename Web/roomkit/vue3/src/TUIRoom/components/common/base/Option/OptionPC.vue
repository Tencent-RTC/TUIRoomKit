<template>
  <div
    ref="optionRef"
    :class="['option-container', { active: isSelected }]"
    @click="handleChooseOption"
  >
    <template v-if="$slots.customOptionContent">
      <slot name="customOptionContent"></slot>
    </template>
    <template v-else>
      <span :style="props.customOptionContentStyle" class="option-content">{{
        label || value
      }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  inject,
  watch,
  computed,
  onBeforeUnmount,
  StyleValue,
  onMounted,
  defineProps,
} from 'vue';

interface OptionData {
  label: string;
  value: string | number | boolean | object;
  customOptionContentStyle?: StyleValue;
}

interface SelectData {
  selectedValue: string | number | boolean | object;
  optionObj: Record<any, any>;
  optionDataList: OptionData[];
  onOptionCreated: (optionData: OptionData) => void;
  onOptionDestroyed: (value: string | number | boolean | object) => void;
  onOptionSelected: (optionData: OptionData) => void;
}

const optionRef = ref(null);
const props = defineProps<OptionData>();

const select: SelectData | undefined = inject('select');

const isSelected = computed(
  () => select && select.selectedValue === props.value
);

const optionData = computed(() => ({
  label: props.label,
  value: props.value,
  ref: optionRef,
}));

onMounted(() => {
  select?.onOptionCreated(optionData.value);
});

onBeforeUnmount(() => {
  select?.onOptionDestroyed(props.value);
});

watch(
  () => [props.value, props.label],
  (val, oldVal) => {
    if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
      select?.onOptionDestroyed(oldVal);
      select?.onOptionCreated(optionData.value);
    }
  }
);

function handleChooseOption() {
  select?.onOptionSelected(optionData.value);
}
</script>

<style lang="scss" scoped>
.option-container {
  padding: 6px 15px;
  overflow: hidden;
  color: #000;
  white-space: nowrap;
  cursor: pointer;

  &.active {
    color: var(--active-color-2);
  }

  &:hover {
    background-color: var(--hover-background-color);
  }

  .option-content {
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
  }
}

.tui-theme-white .option-container {
  --hover-background-color: rgba(213, 224, 242, 0.5);
}

.tui-theme-black .option-container {
  --hover-background-color: rgba(213, 224, 242, 0.5);
}
</style>
