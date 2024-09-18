<template>
  <div class="swiper" ref="swiperRef">
    <div
      class="swiper-item-container"
      :style="swiperStyle"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMoveThrottle"
      @touchend="handleTouchEnd"
    >
      <slot></slot>
    </div>
    <div v-if="swiperItemNumber > 1" class="swiper-dot-container">
      <div
        v-for="(item, index) in swiperItemNumber"
        :key="item"
        class="swiper-dots"
        :class="[isActiveDot(index) ? 'swiper-current-dots' : '']"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, computed, defineProps, defineEmits, watch } from 'vue';
import { throttle } from '../../../utils/utils';

const props = defineProps<{
  activeIndex: number;
}>();

const emits = defineEmits(['change']);

const activeSwiperIndex = ref(0);
const swiperItemNumber = ref(0);
const swiperRef = ref();
const translateX = ref(0);

watch(
  () => props.activeIndex,
  val => {
    activeSwiperIndex.value = val;
    translateX.value =
      0 - swiperRef.value.offsetWidth * activeSwiperIndex.value;
  }
);

watch(activeSwiperIndex, () => {
  emits('change', activeSwiperIndex.value);
});

provide('swiper', {
  activeSwiperIndex,
  swiperRef,
  addSwiperItem,
  removeSwiperItem,
});

const touchData = {
  x: 0,
  y: 0,
};

function isActiveDot(index: number) {
  return index === activeSwiperIndex.value;
}

function addSwiperItem() {
  swiperItemNumber.value += 1;
}

function removeSwiperItem() {
  swiperItemNumber.value -= 1;
}

const swiperStyle = computed(() => {
  return { transform: `translateX(${translateX.value}px)` };
});

function handleTouchStart(event: TouchEvent) {
  touchData.x = event.changedTouches[0].pageX;
  touchData.y = event.changedTouches[0].pageY;
}

const handleTouchMoveThrottle = throttle(handleTouchMove, 200);

function handleTouchMove(event: TouchEvent) {
  const offsetX = event.changedTouches[0].pageX - touchData.x;
  translateX.value =
    0 - swiperRef.value.offsetWidth * activeSwiperIndex.value + offsetX;
}

function handleTouchEnd(event: TouchEvent) {
  const offsetX = event.changedTouches[0].pageX - touchData.x;
  if (
    Math.abs(event.changedTouches[0].pageX - touchData.x) >
    swiperRef.value.offsetWidth / 5
  ) {
    if (offsetX < 0 && activeSwiperIndex.value < swiperItemNumber.value - 1) {
      activeSwiperIndex.value = activeSwiperIndex.value + 1;
    }
    if (offsetX > 0 && activeSwiperIndex.value >= 1) {
      activeSwiperIndex.value = activeSwiperIndex.value - 1;
    }
  }
  translateX.value = 0 - swiperRef.value.offsetWidth * activeSwiperIndex.value;
}
</script>

<style lang="scss" scoped>
.swiper {
  position: relative;
  width: 100%;
  height: 100%;

  .swiper-item-container {
    display: flex;
    transition: transform 0.3s;
  }

  .swiper-dot-container {
    position: absolute;
    bottom: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;

    .swiper-dots {
      width: 8px;
      height: 8px;
      margin: 5px;
      background: #fff;
      border-radius: 20px;
      opacity: 0.6;
    }

    .swiper-current-dots {
      width: 8px;
      height: 8px;
      margin: 5px;
      background: #fff;
      border-radius: 20px;
      opacity: 1;
    }
  }
}
</style>
