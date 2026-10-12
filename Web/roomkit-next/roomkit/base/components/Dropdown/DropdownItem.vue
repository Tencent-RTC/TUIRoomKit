<template>
  <button
    ref="elRef"
    class="rk-dropdown-item"
    type="button"
    :disabled="disabled"
    :data-highlighted="highlighted"
    :data-danger="danger"
    @mouseenter="onEnter"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { DROPDOWN_CONTEXT_KEY } from '../../tokens';

defineOptions({ name: 'TUIDropdownItem' });

let itemSeed = 0;

const props = defineProps<{
  command?: string | number;
  disabled?: boolean;
  danger?: boolean;
}>();

const ctx = inject(DROPDOWN_CONTEXT_KEY);
const elRef = ref<HTMLElement | null>(null);
const fallbackId = `item-${++itemSeed}`;
const value = computed(() => props.command ?? fallbackId);
const highlighted = computed(() => ctx?.highlighted.value === value.value);

onMounted(() => {
  ctx?.register({ value: value.value, disabled: props.disabled, el: elRef.value });
});

onBeforeUnmount(() => {
  ctx?.unregister(value.value);
});

function onEnter() {
  if (props.disabled || !ctx) return;
  ctx.highlighted.value = value.value;
}

function onClick() {
  if (props.disabled) return;
  ctx?.onCommand(value.value);
}
</script>

<style scoped lang="scss">
.rk-dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: var(--rk-text-primary);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;

  &:hover,
  &[data-highlighted='true'] {
    background: var(--rk-option-hover);
  }

  &[data-danger='true'] {
    color: var(--rk-danger);
  }

  &:disabled {
    color: var(--rk-text-disabled);
    cursor: not-allowed;
  }
}
</style>
