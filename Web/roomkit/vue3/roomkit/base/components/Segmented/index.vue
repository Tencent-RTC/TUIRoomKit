<template>
  <div class="rk-segmented" :class="`rk-segmented-${size}`" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      class="rk-segmented-item"
      :class="{ 'is-active': option.value === modelValue }"
      :aria-selected="option.value === modelValue"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TUISegmented' });

const props = withDefaults(defineProps<{
  modelValue: string;
  options: { value: string; label: string }[];
  size?: 'sm' | 'md';
}>(), {
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function select(value: string) {
  if (value !== props.modelValue) emit('update:modelValue', value);
}
</script>

<style scoped lang="scss">
.rk-segmented {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--rk-bg-muted);
  border-radius: 10px;
}

.rk-segmented-item {
  padding: 0 14px;
  margin: 0;
  font: inherit;
  font-weight: 500;
  color: var(--rk-text-secondary);
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition: background-color var(--rk-duration) var(--rk-ease), color var(--rk-duration) var(--rk-ease);

  &:hover:not(.is-active) {
    color: var(--rk-text-primary);
  }

  &.is-active {
    font-weight: 600;
    color: var(--rk-text-primary);
    background: var(--rk-bg-raised);
    box-shadow: 0 1px 2px rgb(0 0 0 / 24%);
  }
}

.rk-segmented-sm .rk-segmented-item {
  height: 28px;
  font-size: 13px;
}

.rk-segmented-md .rk-segmented-item {
  height: 30px;
  font-size: var(--rk-fs-md);
}
</style>
