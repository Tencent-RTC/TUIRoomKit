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
.tui-theme-white .button-primary {
  --shadow-color: rgba(213, 224, 242, 0.6);
}

.tui-theme-black .button-primary {
  --shadow-color: rgba(28, 102, 229, 0.2);
}

.tui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
  line-height: 22px;
  color: var(--font-color-7);
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  background-color: var(--active-color-1);
  border: 1px solid var(--active-color-1);
  outline: none;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: #144fb6;
    border: 1px solid #144fb6;
    outline: none;
  }
}

.tui-button-plain.tui-button-primary {
  color: #0961f7;
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.tui-button-plain.tui-button-primary:hover {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}

.tui-button-plain.tui-button-info {
  color: #909399;
  background: #f4f4f5;
  border-color: #d3d4d6;
}

.tui-button-plain.tui-button-info:hover {
  color: #fff;
  background: #909399;
  border-color: #909399;
}

.tui-button-plain.tui-button-danger {
  font-weight: 500;
  color: #f56c6c;
  background: #fef0f0;
  border-color: #fbc4c4;
}

.tui-button-plain.tui-button-danger:hover {
  color: #fff;
  background: #f56c6c;
  border-color: #f56c6c;
}

.tui-button-primary {
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  color: var(--active-color-2);
  background-color: transparent;
  border: 1px solid var(--active-color-2);

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

.tui-button-disabled {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.4;
}

.tui-button-icon {
  display: flex;
  margin-right: 5px;
}

.tui-button-text {
  color: var(--font-color-4);
  background-color: transparent;
  border: 0 solid transparent;

  &:hover {
    color: var(--font-color-4);
    background-color: transparent;
    border: 0 solid transparent;
  }

  &::after {
    border: none;
  }
}
</style>
