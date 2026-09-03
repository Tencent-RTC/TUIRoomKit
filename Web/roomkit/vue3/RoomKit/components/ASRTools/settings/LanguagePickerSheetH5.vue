<template>
  <TUIPopup
    :visible="true"
    placement="bottom"
    height="60%"
    @close="emit('close')"
  >
    <div class="lang-picker">
      <PopUpArrowDown @click="emit('close')" />
      <div class="lang-picker__header">
        {{ title }}
      </div>
      <div class="lang-picker__list">
        <button
          v-for="option in options"
          :key="option.value || 'none'"
          class="lang-picker__item"
          type="button"
          :class="{ 'is-selected': option.value === modelValue }"
          @click="emit('select', option.value)"
        >
          <span>{{ option.label }}</span>
          <IconCheck v-if="option.value === modelValue" :size="16" />
        </button>
      </div>
    </div>
  </TUIPopup>
</template>

<script lang="ts" setup>
import { IconCheck, TUIPopup } from '@tencentcloud/uikit-base-component-vue3';
import PopUpArrowDown from '../../base/PopUpArrowDown.vue';
import type { ASRSettingsOption } from 'tuikit-atomicx-vue3/room';

defineProps<{
  title: string;
  modelValue: string;
  options: ASRSettingsOption<string>[];
}>();

const emit = defineEmits<{
  select: [value: string];
  close: [];
}>();
</script>

<style lang="scss" scoped>
.lang-picker {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color-secondary);
  -webkit-tap-highlight-color: transparent;
}

.lang-picker__header {
  padding: 4px 20px 12px;
  color: var(--text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.lang-picker__list {
  flex: 1;
  padding: 0 16px calc(16px + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--stroke-color-secondary) transparent;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--stroke-color-secondary);
    border-radius: 3px;
  }
}

.lang-picker__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 52px;
  padding: 0 4px;
  color: var(--text-color-primary);
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;

  &:not(:last-child) {
    border-bottom: 1px solid var(--stroke-color-primary);
  }

  &.is-selected {
    color: var(--text-color-link);
    font-weight: 600;
  }
}
</style>
