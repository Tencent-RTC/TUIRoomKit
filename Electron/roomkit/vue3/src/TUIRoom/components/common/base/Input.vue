<template>
  <div class="tui-input">
    <input
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      maxlength="80"
      :type="type"
      @input="updateValue"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string;
  placeholder: string;
  disabled?: boolean;
  type?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  type: 'text',
});

const emit = defineEmits(['update:modelValue']);

function updateValue(event: any) {
  emit('update:modelValue', event.target.value);
}
</script>

<style lang="scss" scoped>
.tui-input {
  position: relative;
  display: inline-block;
}

input {
  width: 100%;
  padding: 10px 0px 10px 16px;
  font-size: 14px;
  color: var(--title-color);
  background-color: #f9fafc;
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
