<template>
  <div ref="rootRef" class="rk-swiper-item" @click="onClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { swiperKey } from './types';

defineOptions({ name: 'TUISwiperItem' });

const rootRef = ref<HTMLElement | null>(null);
const ctx = inject(swiperKey, null);

function onClick() {
  if (ctx?.wasDragged()) return;
  if (rootRef.value) ctx?.reportClick(rootRef.value);
}
</script>

<style scoped lang="scss">
.rk-swiper-item {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
