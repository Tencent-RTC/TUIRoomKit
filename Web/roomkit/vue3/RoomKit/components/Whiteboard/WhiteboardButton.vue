<template>
  <button
    class="whiteboard-button"
    :title="t('Whiteboard.Annotation')"
    :disabled="disabled"
    @pointerdown="emit('pointerdown', $event)"
    @click="emit('click', $event)"
  >
    <component :is="IconPen" :size="20" />
  </button>
</template>

<script setup lang="ts">
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { IconPen } from './constants';

defineProps<{
  disabled?: boolean;
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
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background-color: var(--bg-color-operate, #2a2c33);
  box-shadow: 0 4px 16px rgb(0 0 0 / 24%);
  color: var(--text-color-primary, #fff);
  cursor: grab;
  transition: background 0.15s ease;

  &:hover {
    background: var(--button-color-secondary-hover, rgb(255 255 255 / 12%));
  }

  &:active {
    cursor: grabbing;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
}
</style>
