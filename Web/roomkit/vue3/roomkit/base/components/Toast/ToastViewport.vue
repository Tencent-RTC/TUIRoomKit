<template>
  <div
    v-if="items.length"
    class="rk-toast-viewport"
    :class="{ 'is-h5': !isPC }"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="rk-toast"
      :class="{ 'is-h5': !isPC }"
      :data-type="item.type"
      role="status"
    >
      <component
        :is="iconOf(item.type)"
        v-if="isPC && item.showIcon"
        class="rk-toast-icon"
        :size="18"
      />
      <span class="rk-toast-text">{{ item.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPlatform } from '@tencentcloud/universal-api';
import { computed, inject } from 'vue';
import { IconError, IconInfo, IconSuccess, IconWarning } from '../../icons';
import { OVERLAY_CONTEXT_KEY } from '../../tokens';
import { getToastStore } from './store';
import type { ToastType } from './store';

// Anything other than the PC web shell uses the H5 toast.
const isPC = getPlatform() === 'pc';

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
  padding: 10px 20px;
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
  font-size: var(--rk-fs-md);
  line-height: 1.4;
}

.rk-toast-viewport.is-h5 {
  gap: 6px;
  width: max-content;
  min-width: 0;
  max-width: calc(100% - 48px);
}

.rk-toast.is-h5 {
  box-sizing: border-box;
  min-width: 0;

  /* 260px of text plus the 16px padding on each side. */
  max-width: min(292px, 100%);
  padding: 6px 16px;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  line-height: 1.45;
  color: #fff;
  text-align: center;
  background: rgba(0, 0, 0, 0.75);
  border: none;
  border-radius: 8px;
  box-shadow: none;
  transform-origin: center center;
  animation: rk-toast-h5-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.rk-toast.is-h5 .rk-toast-text {
  display: -webkit-box;
  min-width: 0;
  max-width: min(260px, 100%);
  overflow: hidden;
  font-size: var(--rk-fs-md);
  line-height: 1.45;
  text-align: center;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  word-break: break-word;
  white-space: pre-wrap;
}

@keyframes rk-toast-h5-in {
  from { transform: scale(0.94); }
  to { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .rk-toast.is-h5 {
    animation: none;
  }
}
</style>
