<template>
  <label
    class="rk-checkbox"
    :class="{ 'is-checked': modelValue, 'is-disabled': disabled }"
  >
    <input
      class="rk-checkbox-input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="toggle"
    >
    <span
      class="rk-checkbox-box"
      aria-hidden="true"
    />
    <span
      v-if="$slots.default"
      class="rk-checkbox-label"
    >
      <slot />
    </span>
  </label>
</template>

<script setup lang="ts">
defineOptions({ name: 'TUICheckbox' });

const props = withDefaults(defineProps<{
  modelValue?: boolean;
  disabled?: boolean;
}>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'change': [value: boolean];
}>();

function toggle() {
  if (props.disabled) return;
  const next = !props.modelValue;
  emit('update:modelValue', next);
  emit('change', next);
}
</script>

<style scoped lang="scss">
.rk-checkbox {
  position: relative;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: var(--rk-fs-md);
  line-height: 22px;
  color: inherit;
  cursor: pointer;
}

.rk-checkbox.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.rk-checkbox-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  opacity: 0;
}

.rk-checkbox-box {
  display: grid;
  flex: none;
  place-items: center;
  width: 16px;
  height: 16px;
  background: var(--rk-bg-surface);
  border: 1.5px solid var(--rk-border-strong);
  border-radius: 4px;
  transition:
    background-color var(--rk-duration) var(--rk-ease),
    border-color var(--rk-duration) var(--rk-ease);
}

.rk-checkbox-input:focus-visible + .rk-checkbox-box {
  outline: 2px solid var(--rk-brand);
  outline-offset: 2px;
}

.rk-checkbox.is-checked .rk-checkbox-box {
  background: var(--rk-brand);
  border-color: var(--rk-brand);
}

.rk-checkbox.is-checked .rk-checkbox-box::after {
  width: 8px;
  height: 4px;
  margin-top: -1px;
  content: '';
  border: 1.6px solid var(--rk-on-accent);
  border-top: 0;
  border-right: 0;
  transform: rotate(-45deg);
}
</style>
