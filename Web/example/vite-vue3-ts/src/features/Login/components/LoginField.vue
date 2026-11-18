<template>
  <label class="login-field">
    <span class="login-field-label">{{ label }}</span>
    <slot />
    <span v-if="error" class="login-field-error">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  error?: string;
}>();
</script>

<style lang="scss" scoped>
.login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--rk-fs-md);

  :deep(.rk-input-field) {
    -webkit-font-smoothing: antialiased;
  }
}

.login-field-label,
.login-field-error {
  font-size: var(--rk-fs-sm);
  line-height: 18px;
  color: var(--rk-text-secondary);
}

.login-field-error {
  color: var(--rk-danger);
}
</style>
