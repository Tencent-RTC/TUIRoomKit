<script setup lang="ts">
import { computed } from 'vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    block: false,
  }
);

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
  props.block ? 'w-full' : '',
  {
    sm: 'h-8 rounded-lg px-3 text-sm',
    md: 'h-11 rounded-xl px-5 text-sm',
    lg: 'h-12 rounded-xl px-6 text-base',
    icon: 'h-10 w-10 rounded-xl p-0',
  }[props.size],
  {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    secondary: 'bg-accent text-accent-foreground hover:bg-muted',
    outline:
      'border border-border bg-card text-foreground hover:border-primary hover:text-primary',
    danger: 'bg-destructive text-destructive-foreground hover:bg-red-600',
    ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
  }[props.variant],
]);
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="buttonClasses">
    <LoadingSpinner v-if="loading" />
    <slot></slot>
  </button>
</template>
