<script setup lang="ts">
import { computed } from 'vue';
import { AlertCircle, CheckCircle2 } from '@/shared/icons';

const props = withDefaults(
  defineProps<{
    variant?: 'warning' | 'error' | 'info' | 'success';
  }>(),
  {
    variant: 'info',
  }
);

const alertClasses = computed(() => [
  'flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm leading-6 backdrop-blur-md',
  {
    warning: 'border-amber-300/40 bg-amber-500/15 text-amber-50',
    error: 'border-red-300/40 bg-red-500/15 text-red-50',
    info: 'border-primary/30 bg-primary/10 text-primary',
    success: 'border-emerald-300/40 bg-emerald-500/15 text-emerald-50',
  }[props.variant],
]);

const iconComponent = computed(() =>
  props.variant === 'success' ? CheckCircle2 : AlertCircle
);
</script>

<template>
  <div :class="alertClasses">
    <component :is="iconComponent" :size="18" class="mt-0.5 shrink-0" />
    <span><slot /></span>
  </div>
</template>
