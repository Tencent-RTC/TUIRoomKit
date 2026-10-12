<template>
  <div class="rk-select" :class="[`rk-select-${size}`, { 'rk-select-disabled': disabled, 'rk-select-open': isOpen }]">
    <div
      ref="referenceRef"
      class="rk-select-trigger"
      role="combobox"
      :tabindex="disabled ? -1 : 0"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-disabled="disabled"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span v-if="$slots.prefix" class="rk-select-prefix">
        <slot name="prefix" />
      </span>
      <span class="rk-select-value" :class="{ 'is-placeholder': !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
      <button
        v-if="clearable && modelValue != null && !disabled"
        class="rk-select-clear"
        type="button"
        tabindex="-1"
        aria-label="Clear"
        @click.stop="clear"
      >
        <IconClear />
      </button>
      <IconChevron class="rk-select-chevron" />
    </div>
    <Teleport v-if="host && isOpen" :to="host">
      <div
        ref="floatingRef"
        class="rk-float rk-select-panel"
        role="listbox"
        :style="{ left: `${x}px`, top: `${y}px`, zIndex, width: `${triggerWidth}px` }"
        @keydown="onKeydown"
      >
        <slot />
        <div v-if="!slotOptions.length" class="rk-select-empty">
          <slot name="empty">
            {{ emptyText }}
          </slot>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, provide, ref, useSlots, watch } from 'vue';
import { useFloating } from '../../headless/useFloating';
import { useOverlay } from '../../headless/useOverlay';
import { useRovingFocus } from '../../headless/useRovingFocus';
import { IconChevron, IconClear } from '../../icons';
import { SELECT_CONTEXT_KEY } from '../../tokens';
import type { SelectOptionRecord } from '../../tokens';
import { collectSelectOptions } from './collectOptions';

defineOptions({ name: 'TUISelect' });

const props = withDefaults(defineProps<{
  modelValue?: string | number | null;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  emptyText?: string;
}>(), {
  placeholder: 'Select',
  size: 'md',
  emptyText: 'No data',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
  'change': [value: string | number | null];
}>();

const slots = useSlots();
const referenceRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const options = ref<SelectOptionRecord[]>([]);
const triggerWidth = ref(0);
const modelValue = computed(() => props.modelValue ?? null);
const slotOptions = computed(() => collectSelectOptions(slots.default?.() ?? []));
const { highlighted, onKeydown } = useRovingFocus(options);

const selectedLabel = computed(() => {
  const { value } = modelValue;
  const live = options.value.find(item => item.value === value)?.label;
  if (live) return live;
  return slotOptions.value.find(item => item.value === value)?.label || '';
});

const { host, zIndex } = useOverlay({
  lane: 'dropdown',
  open: isOpen,
  closeOnOutside: true,
  closeOnEsc: true,
  onClose: () => {
    isOpen.value = false;
  },
}, [referenceRef, floatingRef]);

const { x, y, update } = useFloating({
  reference: referenceRef,
  floating: floatingRef,
  placement: 'bottom-start',
  offset: 6,
  enabled: isOpen,
});

function setValue(value: string | number | null) {
  emit('update:modelValue', value);
  emit('change', value);
}

provide(SELECT_CONTEXT_KEY, {
  modelValue,
  register: (option) => {
    const next = options.value.filter(item => item.value !== option.value);
    next.push(option);
    options.value = next;
  },
  unregister: (value) => {
    options.value = options.value.filter(item => item.value !== value);
  },
  select: (value) => {
    setValue(value);
    isOpen.value = false;
  },
  highlighted,
});

watch(isOpen, async (open) => {
  if (!open) return;
  // The panel matches the trigger exactly, so a long option cannot widen it; options
  // ellipsize the way the trigger's own value does.
  triggerWidth.value = referenceRef.value?.offsetWidth ?? 0;
  await nextTick();
  update();
  highlighted.value = modelValue.value ?? options.value.find(item => !item.disabled)?.value ?? null;
});

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function clear() {
  setValue(null);
  referenceRef.value?.focus();
}

function selectHighlighted() {
  const current = options.value.find(item => item.value === highlighted.value && !item.disabled);
  if (!current) return;
  setValue(current.value);
  isOpen.value = false;
  referenceRef.value?.blur();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) return;

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!isOpen.value) {
      isOpen.value = true;
      return;
    }
    onKeydown(event);
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (isOpen.value) selectHighlighted();
    return;
  }

  if ((event.key === 'Backspace' || event.key === 'Delete') && props.clearable && modelValue.value != null) {
    event.preventDefault();
    clear();
    return;
  }

  if (!isOpen.value) return;
  if (event.key === 'Home' || event.key === 'End' || event.key.length === 1) {
    onKeydown(event);
  }
}
</script>

<style scoped lang="scss">
.rk-select {
  display: inline-flex;
  width: 100%;
}

.rk-select-trigger {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 0 10px;
  font: inherit;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: var(--rk-bg-raised);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-md);
  outline: none;
  box-shadow: none;
  -webkit-tap-highlight-color: transparent;

  &:focus,
  &:focus-visible,
  &:active {
    border-color: var(--rk-border);
    outline: none;
    box-shadow: none;
  }
}

.rk-select-sm .rk-select-trigger {
  height: var(--rk-control-sm);
  font-size: 12px;
}

.rk-select-md .rk-select-trigger {
  height: var(--rk-control-md);
  font-size: 13px;
}

.rk-select-lg .rk-select-trigger {
  height: var(--rk-control-lg);
  font-size: 13px;
}

.rk-select-disabled .rk-select-trigger {
  color: var(--rk-text-disabled);
  cursor: not-allowed;
  background: var(--rk-bg-muted);
}

.rk-select-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rk-select-value.is-placeholder {
  color: var(--rk-text-tertiary);
}

.rk-select-clear,
.rk-select-prefix,
.rk-select-chevron {
  display: inline-flex;
  color: var(--rk-text-tertiary);
}

.rk-select-clear {
  padding: 0;
  margin: 0;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.rk-select-open .rk-select-chevron {
  transform: rotate(180deg);
}

.rk-select-panel {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  padding: 6px;
  overflow: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.rk-select-empty {
  padding: 12px;
  font-size: 13px;
  color: var(--rk-text-secondary);
  text-align: center;
}
</style>
