<template>
  <button
    class="rk-switch"
    :class="[`rk-switch-${size}`, { 'rk-switch-on': modelValue, 'rk-switch-loading': loading }]"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled || loading"
    @click="toggle"
  >
    <span class="rk-switch-thumb">
      <IconLoading v-if="loading" spin />
    </span>
  </button>
</template>

<script setup lang="ts">
import { IconLoading } from '../../icons';

defineOptions({ name: 'TUISwitch' });

const props = withDefaults(defineProps<{
  modelValue?: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}>(), {
  modelValue: false,
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'change': [value: boolean];
}>();

function toggle() {
  if (props.disabled || props.loading) return;
  const next = !props.modelValue;
  emit('update:modelValue', next);
  emit('change', next);
}
</script>

<style scoped lang="scss">
.rk-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 2px;
  margin: 0;
  cursor: pointer;
  background: var(--rk-toggle-off);
  border: 0;
  border-radius: var(--rk-radius-pill);
  transition: background-color var(--rk-duration) var(--rk-ease);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.rk-switch-sm {
  width: 32px;
  height: 18px;
}

.rk-switch-md {
  width: 40px;
  height: 22px;
}

.rk-switch-lg {
  width: 48px;
  height: 26px;
}

.rk-switch-on {
  background: var(--rk-brand);
}

.rk-switch-thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: var(--rk-knob);
  border-radius: 50%;
  box-shadow: 0 1px 3px color-mix(in srgb, black 20%, transparent);
  transition: transform var(--rk-duration) var(--rk-ease);
}

.rk-switch-sm .rk-switch-thumb {
  width: 14px;
  height: 14px;
}

.rk-switch-md .rk-switch-thumb {
  width: 18px;
  height: 18px;
}

.rk-switch-lg .rk-switch-thumb {
  width: 22px;
  height: 22px;
}

.rk-switch-on.rk-switch-sm .rk-switch-thumb { transform: translateX(14px); }
.rk-switch-on.rk-switch-md .rk-switch-thumb { transform: translateX(18px); }
.rk-switch-on.rk-switch-lg .rk-switch-thumb { transform: translateX(22px); }
</style>
