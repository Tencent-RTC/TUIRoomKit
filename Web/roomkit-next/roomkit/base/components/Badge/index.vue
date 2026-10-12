<template>
  <span class="rk-badge" :class="{ 'rk-badge-standalone': !$slots.default }">
    <slot />
    <sup
      v-if="!hidden && (dot || displayValue)"
      class="rk-badge-mark"
      :class="[`rk-badge-mark-${variant}`, { 'rk-badge-mark-dot': dot }]"
    >
      <template v-if="!dot">{{ displayValue }}</template>
    </sup>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'TUIBadge' });

const props = withDefaults(defineProps<{
  value?: string | number;
  max?: number;
  dot?: boolean;
  hidden?: boolean;
  variant?: 'danger' | 'info' | 'success';
}>(), {
  max: 99,
  variant: 'danger',
});

const displayValue = computed(() => {
  if (props.value == null || props.value === '') return '';
  if (typeof props.value === 'number' && props.value > props.max) {
    return `${props.max}+`;
  }
  return String(props.value);
});
</script>

<style scoped lang="scss">
.rk-badge {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.rk-badge-standalone {
  min-width: 8px;
  min-height: 8px;
}

.rk-badge-mark {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  color: var(--rk-on-accent);
  text-align: center;
  pointer-events: none;
  border-radius: var(--rk-radius-pill);
  transform: translate(50%, -50%);
}

.rk-badge-mark-dot {
  width: 8px;
  min-width: 8px;
  height: 8px;
  padding: 0;
}

.rk-badge-mark-danger { background: var(--rk-danger); }
.rk-badge-mark-info { background: var(--rk-info); }
.rk-badge-mark-success { background: var(--rk-green-500); }

.rk-badge-standalone .rk-badge-mark {
  position: relative;
  top: auto;
  right: auto;
  transform: none;
}
</style>
