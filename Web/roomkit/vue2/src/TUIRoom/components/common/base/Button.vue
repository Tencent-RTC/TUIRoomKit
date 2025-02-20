<template>
  <button :class="buttonClassList" :style="customStyle" @click="handleClick">
    <span v-if="$slots.icon" class="button-icon">
      <slot name="icon"></slot>
    </span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import {
  computed,
  StyleValue,
  withDefaults,
  defineProps,
  defineEmits,
} from 'vue';

interface Props {
  size?: 'large' | 'default';
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text';
  customStyle?: StyleValue;
  loading?: boolean;
  disabled?: boolean;
  round?: boolean;
  plain?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: undefined,
  type: undefined,
  customStyle: () => ({}),
  loading: false,
  disabled: false,
  round: true,
  plain: false,
});

const emit = defineEmits(['click']);

function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event);
  }
}

const buttonClassList = computed(() => [
  'tui-button',
  `tui-button-${props.type}`,
  `tui-button-${props.size}`,
  { 'tui-button-round': props.round },
  { 'tui-button-loading': props.loading },
  { 'tui-button-disabled': props.disabled },
  { 'tui-button-plain': props.plain },
]);
</script>

<style lang="scss" scoped>
.tui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
  line-height: 22px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  background-color: var(--button-color-primary-default);
  border: 1px solid var(--button-color-primary-default);
  color: var(--text-color-button);
  outline: none;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    border-color: var(--text-color-link);
    border: 1px solid var(--text-color-link);
    outline: none;
  }
}

.tui-button-plain.tui-button-primary {
  background: var(--uikit-color-white-2);
  border-color: var(--text-color-link);
  color: var(--text-color-link);
}

.tui-button-plain.tui-button-primary:hover {
  color: var(--uikit-color-white-1);
  background: var(--uikit-color-theme-5);
  border-color: var(--uikit-color-theme-5);
}

.tui-button-plain.tui-button-info {
  color: var(--uikit-color-gray-7);
  background: var(--uikit-color-white-1);
  border-color: var(--uikit-color-white-2);
}

.tui-button-plain.tui-button-info:hover {
  color: var(--uikit-color-white-1);
  background: var(--uikit-color-gray-7);
  border-color: var(--uikit-color-gray-7);
}

.tui-button-plain.tui-button-danger {
  font-weight: 500;
  color: var(--uikit-color-red-6);
  background: var(--uikit-color-white-1);
  border-color: var(--uikit-color-red-6);
}

.tui-button-plain.tui-button-danger:hover {
  color: var(--uikit-color-white-1);
  background: var(--uikit-color-red-6);
  border-color: var(--uikit-color-red-6);
}

.tui-button-primary {
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  background-color: transparent;
  border: 1px solid var(--text-color-link);
  color: var(--text-color-link);

  &:hover {
    background-color: var(--uikit-color-black-8);
  }
}

.tui-button-large {
  padding: 19px 48px;
  font-size: 20px;
}

.tui-button-default {
  padding: 5px 30px;
  font-size: 14px;
}

.tui-button-round {
  border-radius: 999999px;
}

.tui-button-disabled {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.4;
}

.tui-button-icon {
  display: flex;
  margin-right: 5px;
}
</style>
