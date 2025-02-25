<template>
  <div class="tui-checkbox">
    <input
      v-model="checked"
      type="checkbox"
      :disabled="props.disabled"
      @change="handleValueChange"
    />
    <span class="tui-checkbox-slot-container" @click="handleCheckBoxClick">
      <slot></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch, withDefaults, defineProps, defineEmits } from 'vue';
interface Props {
  modelValue: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  slotCustomStyle: () => ({}),
});
const checked: Ref<boolean> = ref(props.modelValue);
const emit = defineEmits(['input']);

watch(
  () => props.modelValue,
  value => {
    checked.value = props.disabled ? true : value;
  },
  { immediate: true }
);

function handleCheckBoxClick() {
  checked.value = !checked.value;
  emit('input', checked.value);
}

function handleValueChange(event: any) {
  checked.value = event.target.checked;
  emit('input', event.target.checked);
}
</script>

<style lang="scss" scoped>
.tui-checkbox {
  position: relative;
  display: flex;
  align-items: center;
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
  cursor: not-allowed;
  background-color: var(--bg-color-function);
}
</style>
