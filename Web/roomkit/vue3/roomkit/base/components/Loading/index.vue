<template>
  <div
    class="rk-loading"
    :class="[
      `rk-loading-${size}`,
      `rk-loading-${variant}`,
      {
        'rk-loading-wrap': hasContent,
        'rk-loading-spinning': showIndicator,
      },
    ]"
  >
    <div v-if="hasContent" class="rk-loading-content">
      <slot />
    </div>
    <div
      v-if="showIndicator"
      class="rk-loading-indicator"
      role="status"
      :aria-label="tip || '加载中'"
    >
      <div class="rk-loading-panel">
        <slot name="icon">
          <span v-if="variant === 'card'" class="rk-loading-ring" />
          <IconLoading v-else spin :size="iconSize" />
        </slot>
        <span v-if="tip || $slots.tip" class="rk-loading-tip">
          <slot name="tip">{{ tip }}</slot>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { IconLoading } from '../../icons';

defineOptions({ name: 'TUILoading' });

const props = withDefaults(defineProps<{
  spinning?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tip?: string;
  variant?: 'default' | 'card';
}>(), {
  spinning: true,
  size: 'md',
  variant: 'default',
});

const slots = useSlots();
const hasContent = computed(() => !!slots.default);
const showIndicator = computed(() => props.spinning);
const iconSize = computed(() => ({
  sm: 16,
  md: 24,
  lg: 36,
}[props.size]));
</script>

<style scoped lang="scss">
.rk-loading {
  display: inline-flex;
  color: var(--rk-brand);
}

.rk-loading-wrap {
  position: relative;
  display: block;
  align-self: stretch;
  width: 100%;
  min-height: 80px;
}

.rk-loading-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rk-loading-wrap .rk-loading-indicator {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
}

.rk-loading-wrap.rk-loading-default .rk-loading-indicator {
  background: color-mix(in srgb, var(--rk-bg-surface) 72%, transparent);
}

.rk-loading-panel {
  display: inline-flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.rk-loading-card .rk-loading-panel {
  gap: 16px;
  min-width: 200px;
  padding: 28px 40px 24px;
  background: var(--rk-bg-surface);
  border-radius: 24px;
  box-shadow: var(--rk-shadow-dialog);
}

.rk-loading-ring {
  width: 36px;
  height: 36px;
  border: 3px solid var(--rk-gray-200);
  border-top-color: var(--rk-brand);
  border-radius: 50%;
  animation: rk-spin 0.8s linear infinite;
}

.rk-loading-sm .rk-loading-ring {
  width: 28px;
  height: 28px;
  border-width: 2.5px;
}

.rk-loading-lg .rk-loading-ring {
  width: 44px;
  height: 44px;
}

.rk-loading-tip {
  font-size: var(--rk-fs-md);
  line-height: 1.4;
  color: var(--rk-text-secondary);
  white-space: nowrap;
}

.rk-loading-card .rk-loading-tip {
  font-size: var(--rk-fs-md);
  color: var(--rk-text-primary);
}

.rk-loading-sm .rk-loading-tip {
  font-size: var(--rk-fs-sm);
}

.rk-loading-lg .rk-loading-tip {
  font-size: var(--rk-fs-md);
}

.rk-loading-content {
  width: 100%;
  min-height: inherit;
}
</style>
