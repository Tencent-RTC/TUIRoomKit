<template>
  <div class="tui-checkbox">
    <input v-model="checked" type="checkbox" @change="handleValueChange" />
    <span class="tui-checkbox-slot-container" @click="handleCheckBoxClick">
      <slot></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
interface Props {
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  slotCustomStyle: () => ({}),
});
const checked: Ref<boolean> = ref(props.modelValue);
const emit = defineEmits(['input']);


watch(() => props.modelValue, (value) => {
  checked.value = value;
});


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
  .tui-checkbox-slot-container {
    flex: 1;
  }
}

input {
  color: var(--title-color);
  border: 1px solid var(--stroke-color);
  border-radius: 4px;
}

input:focus {
  border-color: var(--active-color-1);
  outline: 0;
}

input:disabled {
  background-color: var(--background-color-9);
}
</style>
