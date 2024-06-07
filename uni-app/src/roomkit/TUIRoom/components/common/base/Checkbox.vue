<template>
  <div class="tui-checkbox">
    <input
      v-model="checked"
      type="checkbox"
      @change="handleValueChange"
    />
    <span @click="handleCheckBoxClick">
      <slot></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
interface Props {
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const checked: Ref<boolean> = ref(props.modelValue);

function handleCheckBoxClick() {
  checked.value = !checked.value;
}

const emit = defineEmits(['update:modelValue']);

function handleValueChange(event: any) {
  checked.value = event.target.checked;
  emit('update:modelValue', event.target.checked);
}
</script>

<style lang="scss" scoped>
.tui-checkbox {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

input {
  color: #0F1014;
  border: 1px solid #E4EAF7;
  border-radius: 4px;
  cursor: pointer;
}

input:focus {
  border-color: #1C66E5;
  outline: 0;
}

input:disabled {
  background-color: #F7F9FC;
}
</style>
