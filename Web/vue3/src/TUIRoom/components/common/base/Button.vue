<template>
  <button
    :class="buttonClassList"
    :style="customStyle"
    @click="handleClick"
  >
    <span v-if="$slots.icon" class="button-icon">
      <slot name="icon"></slot>
    </span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed, StyleValue } from 'vue';

interface Props {
  size?: 'large' | 'default';
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text';
  customStyle?: StyleValue;
  loading?: boolean;
  disabled?: boolean;
  round?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: undefined,
  type: undefined,
  customStyle: () => ({}),
  loading: false,
  disabled: false,
  round: true,
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
]);
</script>

<style lang="scss" scoped>
.tui-theme-white .button-primary{
  --shadow-color: rgba(213, 224, 242, 0.60);
}

.tui-theme-black .button-primary {
  --shadow-color: rgba(28, 102, 229, 0.20);
}
.tui-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  border: 1px solid var(--active-color-1);
  font-weight: 400;
  line-height: 22px;
  white-space: nowrap;
  background-color: var(--active-color-1);
  outline: none;
  color: var(--font-color-7);
  &:hover {
    background: #144FB6;
    border: 1px solid #144FB6;
    outline: none;
  }
}
.tui-button-primary {
  background-color: transparent;
  border: 1px solid var(--active-color-2);
  color: var(--active-color-2);
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  &:hover {
    background-color: var(--shadow-color);
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

.tui-button-disable {
  cursor: not-allowed;
  opacity: 0.3;
}

.tui-button-icon {
  margin-right: 5px;
  display: flex;
}

.tui-button-text {
  border: 0 solid transparent;
  background-color: transparent;
  color: var(--font-color-4);
  &:hover {
    border: 0 solid transparent;
    background-color: transparent;
    color: var(--font-color-4);
  }
  &::after {
    border: none;
  }
}
</style>
