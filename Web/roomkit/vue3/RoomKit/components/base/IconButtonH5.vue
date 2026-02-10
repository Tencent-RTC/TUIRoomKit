<template>
  <div class="button-container-h5" :class="{ 'disabled': disabled }">
    <slot />
    <span class="title">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  disabled?: boolean;
}>();
</script>

<style lang="scss" scoped>
.button-container-h5 {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  height: 100%;
  color: var(--text-color-primary);
  font-size: 10px;
  background-color: var(--bg-color-input);
  border-radius: 12px;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  -moz-tap-highlight-color: transparent;
  &.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
  .title {
    text-align: center;
    font-size: 9px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    letter-spacing: -0.3px;
    white-space: nowrap;
  }
}
</style>
