<template>
  <button
    class="rk-btn"
    :class="[
      `rk-btn-${variant}`,
      `rk-btn-${size}`,
      { 'rk-btn-block': block, 'rk-btn-loading': loading },
    ]"
    :disabled="disabled || loading"
    :type="nativeType"
    @click="onClick"
  >
    <span v-if="loading" class="rk-btn-loading">
      <slot name="loading">
        <IconLoading spin />
      </slot>
    </span>
    <span v-else-if="iconPosition === 'start' && (icon || $slots.icon)" class="rk-btn-icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </span>
    <span class="rk-btn-text">
      <slot />
    </span>
    <span v-if="!loading && iconPosition === 'end' && (icon || $slots.icon)" class="rk-btn-icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { IconLoading } from '../../icons';

defineOptions({ name: 'TUIButton' });

withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  nativeType?: 'button' | 'submit' | 'reset';
  icon?: Component;
  iconPosition?: 'start' | 'end';
}>(), {
  variant: 'secondary',
  size: 'md',
  nativeType: 'button',
  iconPosition: 'start',
});

const emit = defineEmits<{
  click: [e: MouseEvent];
}>();

function onClick(e: MouseEvent) {
  emit('click', e);
}
</script>

<style scoped lang="scss">
.rk-btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-family: inherit;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: var(--rk-radius-md);
  transition: background-color var(--rk-duration) var(--rk-ease),
    border-color var(--rk-duration) var(--rk-ease),
    color var(--rk-duration) var(--rk-ease),
    opacity var(--rk-duration) var(--rk-ease);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus {
    outline: none;
  }
}

.rk-btn-sm {
  height: var(--rk-control-sm);
  padding: 0 12px;
  font-size: 12px;
}

.rk-btn-md {
  height: var(--rk-control-md);
  padding: 0 20px;
  font-size: 13px;
}

.rk-btn-lg {
  height: var(--rk-control-lg);
  padding: 0 20px;
  font-size: 13px;
}

.rk-btn-block {
  width: 100%;
}

.rk-btn-primary {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
  border-color: var(--rk-brand);

  &:hover:not(:disabled) {
    background: var(--rk-brand-hover);
    border-color: var(--rk-brand-hover);
  }
}

.rk-btn-secondary {
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  border-color: var(--rk-border);

  &:hover:not(:disabled) {
    background: var(--rk-bg-hover);
  }
}

.rk-btn-ghost {
  color: var(--rk-text-primary);
  background: transparent;

  &:hover:not(:disabled) {
    background: var(--rk-bg-hover);
  }
}

.rk-btn-danger {
  color: var(--rk-on-accent);
  background: var(--rk-danger);
  border-color: var(--rk-danger);

  &:hover:not(:disabled) {
    background: var(--rk-danger-hover);
    border-color: var(--rk-danger-hover);
  }
}

.rk-btn-icon,
.rk-btn-loading {
  display: inline-flex;
}
</style>
