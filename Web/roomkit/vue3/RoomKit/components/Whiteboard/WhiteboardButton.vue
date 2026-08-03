<template>
  <button
    :class="['whiteboard-button', { 'with-label': Boolean(label) }]"
    :title="label || t('Whiteboard.Annotation')"
    :disabled="disabled"
    @pointerdown="emit('pointerdown', $event)"
    @click="emit('click', $event)"
  >
    <component :is="IconPen" :size="label ? 24 : 20" />
    <span v-if="label" class="button-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { IconPen } from './constants';

defineProps<{
  disabled?: boolean;
  // Rendered as a pill next to the icon. Omit it to keep the icon-only button.
  label?: string;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
  pointerdown: [event: PointerEvent];
}>();

const { t } = useUIKit();
</script>

<style lang="scss" scoped>
.whiteboard-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background-color: var(--bg-color-operate, #2a2c33);
  box-shadow: 0 4px 16px rgb(0 0 0 / 24%);
  color: var(--text-color-primary, #fff);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background-color: var(--button-color-secondary-hover, rgb(255 255 255 / 12%));
  }

  &:active:not(:disabled) {
    background-color: var(--button-color-secondary-active, rgb(255 255 255 / 20%));
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &.with-label {
    gap: 8px;
    width: auto;
    height: 48px;
    padding: 0 16px 0 12px;
    border: 1px solid var(--stroke-color-module, rgb(255 255 255 / 16%));
    border-radius: 26px;
    color: var(--text-color-link, #4c8dff);
  }

  .button-label {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
  }
}
</style>
