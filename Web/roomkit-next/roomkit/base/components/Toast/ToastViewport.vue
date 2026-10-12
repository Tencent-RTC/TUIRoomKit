<template>
  <div
    v-if="items.length"
    class="rk-toast-viewport"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="rk-toast"
      :data-type="item.type"
      role="status"
    >
      <component
        :is="iconOf(item.type)"
        v-if="item.showIcon"
        class="rk-toast-icon"
        :size="18"
      />
      <span class="rk-toast-text">{{ item.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { IconError, IconInfo, IconSuccess, IconWarning } from '../../icons';
import { OVERLAY_CONTEXT_KEY } from '../../tokens';
import { getToastStore } from './store';
import type { ToastType } from './store';

const ctx = inject(OVERLAY_CONTEXT_KEY, null);
const store = ctx ? getToastStore(ctx) : null;
const items = computed(() => store?.items.value ?? []);

function iconOf(type: ToastType) {
  if (type === 'success') return IconSuccess;
  if (type === 'warning') return IconWarning;
  if (type === 'error') return IconError;
  return IconInfo;
}
</script>

<style scoped lang="scss">
.rk-toast-viewport {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  max-width: min(420px, calc(100% - 32px));
  pointer-events: none;
}

.rk-toast {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  padding: 16px 28px;
  font-weight: 500;
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 14px;
  box-shadow: var(--rk-shadow-pop);
}

.rk-toast[data-type='success'] .rk-toast-icon { color: var(--rk-green-500); }
.rk-toast[data-type='warning'] .rk-toast-icon { color: var(--rk-warning); }
.rk-toast[data-type='error'] .rk-toast-icon { color: var(--rk-danger); }
.rk-toast[data-type='info'] .rk-toast-icon { color: var(--rk-info); }

.rk-toast-text {
  font-size: 14px;
  line-height: 1.4;
}
</style>
