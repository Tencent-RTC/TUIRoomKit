<template>
  <div
    ref="elRef"
    class="rk-option"
    role="option"
    :aria-selected="selected"
    :aria-disabled="disabled"
    :data-highlighted="highlighted"
    @click="onClick"
  >
    <!-- The panel is as wide as the trigger, so a long label is cut; the title keeps
         the full text reachable. Slot content has no title: it may not be plain text. -->
    <span class="rk-option-label" :title="label">
      <slot>{{ labelText }}</slot>
    </span>
    <IconCheck v-if="selected" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';
import { IconCheck } from '../../icons';
import { SELECT_CONTEXT_KEY } from '../../tokens';

defineOptions({ name: 'TUIOption' });

const props = defineProps<{
  value: string | number;
  label?: string;
  disabled?: boolean;
}>();

const slots = useSlots();
const ctx = inject(SELECT_CONTEXT_KEY);
const elRef = ref<HTMLElement | null>(null);
const labelText = computed(() => props.label ?? String(props.value));
const selected = computed(() => ctx?.modelValue.value === props.value);
const highlighted = computed(() => ctx?.highlighted.value === props.value);

function readLabel() {
  return props.label || elRef.value?.textContent?.trim() || String(props.value);
}

function sync() {
  ctx?.register({
    value: props.value,
    label: readLabel(),
    disabled: !!props.disabled,
    el: elRef.value,
  });
}

onMounted(sync);

watch(highlighted, (on) => {
  if (on) elRef.value?.scrollIntoView({ block: 'nearest' });
});

watch(
  () => [props.value, props.label, props.disabled, slots.default?.()] as const,
  (curr, prev) => {
    if (prev && prev[0] !== curr[0]) ctx?.unregister(prev[0]);
    sync();
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  ctx?.unregister(props.value);
});

function onClick() {
  if (props.disabled) return;
  ctx?.select(props.value);
}
</script>

<style scoped lang="scss">
.rk-option {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 0 12px;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-primary);
  cursor: pointer;
  background: transparent;
  border-radius: var(--rk-radius-md);

  &:hover:not([aria-selected='true']),
  &[data-highlighted='true']:not([aria-selected='true']) {
    background: var(--rk-option-hover);
  }

  &[aria-selected='true'] {
    color: var(--rk-brand);
    background: var(--rk-brand-soft);
  }

  &[aria-disabled='true'] {
    color: var(--rk-text-disabled);
    cursor: not-allowed;
  }
}

.rk-option-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
