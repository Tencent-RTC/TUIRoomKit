<template>
  <div class="overflow-menu-sub">
    <button
      ref="backRef"
      class="overflow-menu-back"
      type="button"
      @click="emit('back')"
    >
      <IconChevron class="overflow-menu-back-icon" :size="12" />
      <span>{{ submenu.title }}</span>
    </button>
    <div class="overflow-menu-sub-split" />
    <div
      v-if="submenu.note"
      class="overflow-menu-sub-note"
      role="note"
    >
      <IconInfo :size="14" />
      <span>{{ submenu.note }}</span>
    </div>
    <template v-for="(item, index) in submenu.items" :key="item.command ?? `split-${index}`">
      <div v-if="item.divider" class="overflow-menu-sub-split" />
      <button
        v-else
        class="overflow-menu-sub-item"
        :class="{ 'is-checked': item.checked }"
        type="button"
        :disabled="item.disabled"
        @click="run(item.command)"
      >
        <component :is="item.icon" v-if="item.icon" :size="14" />
        <span>{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IconChevron, IconInfo } from '../../base';
import type { OverflowSubmenu } from './overflowItem';

const props = defineProps<{
  submenu: OverflowSubmenu;
}>();

const emit = defineEmits<{
  back: [];
  close: [];
}>();

const backRef = ref<HTMLButtonElement | null>(null);

// Keyboard focus follows the drill so Escape and Tab stay inside the menu.
onMounted(() => backRef.value?.focus());

function run(command?: string) {
  if (command && props.submenu.run(command)) {
    emit('close');
  }
}
</script>

<style scoped lang="scss">
.overflow-menu-sub {
  display: flex;
  flex-direction: column;
}

.overflow-menu-back {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  font: inherit;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  color: var(--rk-text-primary);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
}

.overflow-menu-back:hover {
  background: color-mix(in srgb, var(--rk-text-primary) 5%, transparent);
}

.overflow-menu-back-icon {
  flex: none;
  transform: rotate(90deg);
}

.overflow-menu-sub-split {
  height: 1px;
  margin: 4px 2px;
  background: var(--rk-border);
}

.overflow-menu-sub-note {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  font-size: var(--rk-fs-sm);
  line-height: 1.4;
  color: var(--rk-text-secondary);
  white-space: nowrap;
}

.overflow-menu-sub-note :deep(svg) {
  flex: none;
  color: var(--rk-brand);
}

.overflow-menu-sub-item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  font: inherit;
  font-size: var(--rk-fs-md);
  line-height: 20px;
  color: var(--rk-text-primary);
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
}

.overflow-menu-sub-item:hover {
  background: color-mix(in srgb, var(--rk-text-primary) 5%, transparent);
}

.overflow-menu-sub-item.is-checked,
.overflow-menu-sub-item.is-checked :deep(svg) {
  color: var(--rk-brand);
}

.overflow-menu-sub-item:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.overflow-menu-sub-item:disabled:hover {
  background: transparent;
}
</style>

<style lang="scss">
.rk-dropdown:has(.overflow-menu-sub) {
  box-sizing: border-box;
  width: max-content;
  min-width: 0;
}
</style>
