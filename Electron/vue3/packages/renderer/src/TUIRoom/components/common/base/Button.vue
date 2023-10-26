<template>
  <button
    :class="buttonClassList"
    @click="handleClick"
  >
    <span v-if="$slots.icon" class="button-icon">
      <slot name="icon"></slot>
    </span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'large' | 'default';
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text';
  customClass?: string;
  loading?: boolean;
  disabled?: boolean;
  round?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: undefined,
  type: undefined,
  customClass: '',
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
  'button',
  `button-${props.type}`,
  `button-${props.size}`,
  { 'button-round': props.round },
  { 'button-loading': props.loading },
  { 'button-disabled': props.disabled },
]);
</script>

<style lang="scss" scoped>
.tui-theme-white .button-primary{
  --shadow-color: rgba(213, 224, 242, 0.60);
}

.tui-theme-black .button-primary {
  --shadow-color: rgba(28, 102, 229, 0.20);
}
.button {
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
.button-primary {
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

.button-large {
  padding: 19px 48px;
  font-size: 20px;
}
.button-default {
  padding: 5px 30px;
  font-size: 14px;
}
.button-round {
  border-radius: 999999px;
}

.button-disable {
  cursor: not-allowed;
  opacity: 0.3;
}

.button-icon {
  margin-right: 5px;
  display: flex;
}
</style>
