<template>
  <div
    class="rk-input"
    :class="[`rk-input-${size}`, `rk-input-${status}`, `rk-input-align-${textAlign}`, {
      'rk-input-disabled': disabled,
      'rk-input-textarea': isTextarea,
      'rk-input-password': type === 'password' && !isTextarea,
    }]"
  >
    <span v-if="$slots.prefix && !isTextarea" class="rk-input-addon">
      <slot name="prefix" />
    </span>
    <textarea
      v-if="isTextarea"
      ref="inputRef"
      class="rk-input-field"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :inputmode="inputmode"
      :rows="rows"
      @input="onInput"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter="onEnter"
      @compositionstart="onCompositionStart"
      @compositionend="e => onCompositionEnd(e, commit)"
    />
    <input
      v-else
      ref="inputRef"
      class="rk-input-field"
      :type="inputType"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :inputmode="inputmode"
      @input="onInput"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter="onEnter"
      @compositionstart="onCompositionStart"
      @compositionend="e => onCompositionEnd(e, commit)"
    >
    <button
      v-if="clearable && !disabled && String(modelValue ?? '')"
      class="rk-input-action"
      type="button"
      @click="clear"
    >
      <IconClear />
    </button>
    <button
      v-if="showPassword && type === 'password' && !isTextarea"
      class="rk-input-action rk-input-password-toggle"
      type="button"
      @click="visible = !visible"
    >
      <component :is="visible ? IconEye : IconEyeOff" />
    </button>
    <span v-if="$slots.suffix && !isTextarea" class="rk-input-addon">
      <slot name="suffix" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { IconClear, IconEye, IconEyeOff } from '../../icons';
import { useComposition } from './useComposition';

defineOptions({ name: 'TUIInput' });

const props = withDefaults(defineProps<{
  modelValue?: string | number | null;
  type?: 'text' | 'password' | 'number' | 'textarea';
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  showPassword?: boolean;
  maxlength?: number;
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  rows?: number;
  size?: 'sm' | 'md' | 'lg';
  status?: 'default' | 'error';
  textAlign?: 'left' | 'center';
  autoFocus?: boolean;
}>(), {
  modelValue: '',
  type: 'text',
  rows: 3,
  size: 'md',
  status: 'default',
  textAlign: 'left',
  autoFocus: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
  'input': [value: string | number | null];
  'change': [value: string | number | null];
  'focus': [e: FocusEvent];
  'blur': [e: FocusEvent];
  'enter': [e: KeyboardEvent];
}>();

const visible = ref(false);
const focused = ref(false);
const draft = ref('');
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const { composing, onCompositionStart, onCompositionEnd } = useComposition();
const isTextarea = computed(() => props.type === 'textarea');
const isNumberType = computed(() => props.type === 'number');
const inputType = computed(() => {
  if (props.type === 'password') return visible.value ? 'text' : 'password';
  return props.type;
});

const displayValue = computed(() => {
  if (isNumberType.value && focused.value) return draft.value;
  if (props.modelValue == null) return '';
  return String(props.modelValue);
});

function exceedsMaxLength(value: string) {
  return props.maxlength != null && value.length > props.maxlength;
}

function emitValue(value: string | number | null) {
  emit('update:modelValue', value);
  emit('input', value);
}

function parseNumberInput(el: HTMLInputElement): number | null | undefined {
  if (el.value === '') return null;
  if (Number.isFinite(el.valueAsNumber)) return el.valueAsNumber;
  return undefined;
}

function commit(value: string) {
  if (isNumberType.value && exceedsMaxLength(value)) return;
  if (!isNumberType.value) {
    emitValue(value);
    return;
  }
  draft.value = value;
  if (value === '') {
    emitValue(null);
    return;
  }
  const n = Number(value);
  if (Number.isFinite(n)) emitValue(n);
}

function clear() {
  draft.value = '';
  emitValue(isNumberType.value ? null : '');
}

function onInput(event: Event) {
  if (composing.value) return;
  const el = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (isNumberType.value && exceedsMaxLength(el.value)) {
    el.value = draft.value;
    return;
  }
  if (!isNumberType.value) {
    emitValue(el.value);
    return;
  }
  draft.value = el.value;
  const parsed = parseNumberInput(el as HTMLInputElement);
  if (parsed !== undefined) emitValue(parsed);
}

function onChange(event: Event) {
  const el = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (!isNumberType.value) {
    emit('change', el.value);
    return;
  }
  const parsed = parseNumberInput(el as HTMLInputElement);
  if (parsed !== undefined) emit('change', parsed);
}

function onFocus(event: FocusEvent) {
  focused.value = true;
  if (isNumberType.value) {
    draft.value = props.modelValue == null ? '' : String(props.modelValue);
  }
  emit('focus', event);
}

function onBlur(event: FocusEvent) {
  focused.value = false;
  if (isNumberType.value) {
    const parsed = parseNumberInput(event.target as HTMLInputElement);
    if (parsed === undefined) {
      draft.value = props.modelValue == null ? '' : String(props.modelValue);
    } else if (parsed !== props.modelValue) {
      emitValue(parsed);
    }
  }
  emit('blur', event);
}

function onEnter(event: KeyboardEvent) {
  if (composing.value) return;
  emit('enter', event);
}

function focusInput() {
  nextTick(() => requestAnimationFrame(() => inputRef.value?.focus()));
}

onMounted(() => {
  if (props.autoFocus) {
    focusInput();
  }
});

watch(() => props.autoFocus, (on) => {
  if (on) {
    focusInput();
  }
});
</script>

<style scoped lang="scss">
.rk-input {
  display: inline-flex;
  align-items: center;
  width: 100%;
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border-strong);
  border-radius: var(--rk-radius-md);
  transition: border-color var(--rk-duration) var(--rk-ease);

  &:focus-within {
    border-color: var(--rk-brand);
  }
}

.rk-input-sm { min-height: var(--rk-control-sm); }
.rk-input-md { min-height: var(--rk-control-md); }
.rk-input-lg { min-height: var(--rk-control-lg); }

.rk-input-error {
  border-color: var(--rk-danger);
}

.rk-input-disabled {
  color: var(--rk-text-disabled);
  background: var(--rk-bg-muted);
}

.rk-input-textarea {
  align-items: stretch;
  padding: 8px 10px;
}

.rk-input-field {
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 10px;
  font: inherit;
  color: inherit;
  resize: vertical;
  background: transparent;
  border: 0;
  outline: none;

  &::placeholder {
    color: var(--rk-text-tertiary);
  }
}

/* The prefix addon already insets the left edge. */
.rk-input-addon + .rk-input-field {
  padding-left: 0;
}

.rk-input-textarea .rk-input-field {
  min-height: 72px;
  padding: 0;
}

.rk-input-field[type='number'] {
  appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    margin: 0;
    appearance: none;
  }
}

.rk-input-align-left .rk-input-field {
  text-align: left;
}

.rk-input-align-center .rk-input-field {
  text-align: center;
}

.rk-input-password.rk-input-align-center .rk-input-field {
  padding-left: 50px;
}

.rk-input-addon,
.rk-input-action {
  display: inline-flex;
  align-items: center;
  color: var(--rk-text-secondary);
}

.rk-input-addon {
  padding: 0 8px;
}

.rk-input-action {
  padding: 0 6px;
  margin: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.rk-input-password-toggle {
  flex: none;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  margin-right: 8px;
  color: var(--rk-text-tertiary);
  border-radius: var(--rk-radius-sm);

  &:hover {
    color: var(--rk-text-primary);
    background: var(--rk-bg-hover);
  }
}
</style>
