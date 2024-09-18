<template>
  <div class="swiper-item" :style="swiperItemStyle">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, inject, onUnmounted } from 'vue';

const swiperData: any = inject('swiper');
const swiperItemStyle = ref();

swiperData.addSwiperItem();

onMounted(() => {
  swiperItemStyle.value = {
    width: `${swiperData.swiperRef.value.offsetWidth}px`,
    height: `${swiperData.swiperRef.value.offsetHeight}px`,
  };
});

onUnmounted(() => {
  swiperData.removeSwiperItem();
});
</script>

<style lang="scss" scoped>
.swiper-item {
  flex-shrink: 0;
}
</style>
