<template>
  <div class="rk-list-item">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TUIListItem' });
</script>

<style scoped lang="scss">
.rk-list-item {
  display: flex;
  flex: 1;
  align-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 var(--rk-space-3);
  gap: var(--rk-space-2);
}
</style>
