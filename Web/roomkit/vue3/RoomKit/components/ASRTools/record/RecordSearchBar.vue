<template>
  <div :class="['rec-search', `rec-search--${layout}`]" @mousedown="focusInput">
    <IconSearch class="rec-search__icon" :size="layout === 'h5' ? 16 : 15" />
    <input
      ref="inputRef"
      class="rec-search__input"
      type="search"
      :value="modelValue"
      :placeholder="t('AITools.SearchPlaceholder')"
      @input="handleInput"
      @keydown.escape.prevent="emit('escape')"
    >
    <button
      v-if="modelValue"
      class="rec-search__clear"
      type="button"
      :aria-label="t('AITools.Cancel')"
      @click="emit('update:modelValue', '')"
    >
      <IconClose :size="12" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { IconClose, IconSearch, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

withDefaults(defineProps<{
  modelValue: string;
  layout?: 'pc' | 'h5';
}>(), {
  layout: 'pc',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'escape': [];
}>();

const { t } = useUIKit();

const inputRef = ref<HTMLInputElement>();

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });

// The icon and padding are part of the field visually, so clicking them focuses
// the input instead of doing nothing.
function focusInput(event: MouseEvent) {
  if (event.target !== inputRef.value) {
    event.preventDefault();
    inputRef.value?.focus();
  }
}
</script>

<style lang="scss" scoped>
.rec-search {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
  height: 32px;
  padding: 0 12px;
  cursor: text;
  background: transparent;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px var(--stroke-color-primary);
}

.rec-search--h5 {
  height: 36px;
  border-radius: 10px;
}

.rec-search:focus-within {
  box-shadow: inset 0 0 0 1.5px var(--text-color-link);
}

.rec-search__icon {
  flex: none;
  color: var(--text-color-tertiary);
}

.rec-search__input {
  flex: 1;
  min-width: 0;
  color: var(--text-color-primary);
  font-size: 13px;
  background: none;
  border: none;
  outline: none;

  &::placeholder {
    color: var(--text-color-tertiary);
  }

  // Safari draws its own clear affordance for type="search".
  &::-webkit-search-cancel-button {
    appearance: none;
  }

  .rec-search--h5 & {
    font-size: 14px;
  }
}

.rec-search__clear {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  color: var(--text-color-secondary);
  cursor: pointer;
  background: var(--uikit-color-black-8);
  border: none;
  border-radius: 50%;
}
</style>
