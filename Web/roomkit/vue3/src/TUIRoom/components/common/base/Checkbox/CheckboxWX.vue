<template>
  <div class="tui-checkbox" @click="handleCheckBoxClick">
    <checkbox :checked="checked" />
    <span class="tui-checkbox-slot-container">
      <slot></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch, withDefaults, defineProps, defineEmits } from 'vue';
interface Props {
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  slotCustomStyle: () => ({}),
});
const checked: Ref<boolean> = ref(props.modelValue);
const emit = defineEmits(['input']);

watch(
  () => props.modelValue,
  value => {
    checked.value = value;
  }
);

function handleCheckBoxClick() {
  checked.value = !checked.value;
  emit('input', checked.value);
}
</script>

<style lang="scss" scoped>
.tui-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;

  .tui-checkbox-slot-container {
    flex: 1;
    overflow: auto;
  }
}

input {
  cursor: pointer;
  border-radius: 4px;
  color: var(--bg-color-secondary);
  border: 1px solid var(--stroke-color-module);
}

input:focus {
  outline: 0;
  border-color: var(--text-color-link);
}

input:disabled {
  background-color: var(--bg-color-function);
}
</style>
