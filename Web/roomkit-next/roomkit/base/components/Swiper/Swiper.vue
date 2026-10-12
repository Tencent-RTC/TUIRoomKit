<template>
  <div
    ref="rootRef"
    class="rk-swiper"
    :class="[
      `rk-swiper-${direction}`,
      { 'rk-swiper-disabled': disabled, 'rk-swiper-dragging': dragging, 'rk-swiper-locked': locked },
    ]"
    :style="rootStyle"
    role="region"
    aria-roledescription="carousel"
  >
    <div
      class="rk-swiper-track"
      :style="trackStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @lostpointercapture="onLostCapture"
    >
      <slot />
    </div>
    <div
      v-if="indicator && count > 1"
      class="rk-swiper-dots"
      role="tablist"
    >
      <slot name="indicator"
            :current="index"
            :count="count">
        <button
          v-for="i in count"
          :key="i"
          type="button"
          class="rk-swiper-dot"
          :class="{ 'rk-swiper-dot-active': i - 1 === index }"
          :aria-current="i - 1 === index ? 'true' : undefined"
          @click="slideTo(i - 1, 'nav')"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, useSlots, watch } from 'vue';
import { flattenVNodes } from '../List/flattenVNodes';
import SwiperItem from './SwiperItem.vue';
import { swiperKey } from './types';
import type { SwiperChangeSource, SwiperDirection } from './types';

defineOptions({ name: 'TUISwiper' });

const props = withDefaults(defineProps<{
  modelValue?: number;
  loop?: boolean;
  autoplay?: boolean;
  interval?: number;
  duration?: number;
  direction?: SwiperDirection;
  indicator?: boolean;
  height?: number | string;
  disabled?: boolean;
}>(), {
  modelValue: 0,
  loop: false,
  autoplay: false,
  interval: 5000,
  duration: 300,
  direction: 'horizontal',
  indicator: true,
});

const emit = defineEmits<{
  'update:modelValue': [index: number];
  'change': [index: number, ctx: { source: SwiperChangeSource }];
  'click': [index: number];
}>();

const slots = useSlots();
const rootRef = ref<HTMLElement | null>(null);
const index = ref(props.modelValue);
const offset = ref(0);
const dragging = ref(false);
const locked = ref(false);
const animating = ref(false);
const size = ref(0);

const count = computed(() => (
  flattenVNodes(slots.default?.() ?? []).filter(node => node.type === SwiperItem).length
));
const horizontal = computed(() => props.direction === 'horizontal');

const rootStyle = computed(() => {
  if (props.height == null) {
    return undefined;
  }
  return { height: typeof props.height === 'number' ? `${props.height}px` : props.height };
});

const trackStyle = computed(() => {
  const axisName = horizontal.value ? 'X' : 'Y';
  return {
    transform: `translate${axisName}(calc(${-index.value * 100}% + ${offset.value}px))`,
    transition: dragging.value || !animating.value
      ? 'none'
      : `transform ${props.duration}ms var(--rk-ease)`,
  };
});

let pointerId: number | null = null;
let startMain = 0;
let startCross = 0;
let startTime = 0;
let axis: 'main' | 'cross' | null = null;
let dragged = false;
let autoplayTimer: number | null = null;
let snapTimer: number | null = null;

function measure() {
  const el = rootRef.value;
  if (!el) {
    return;
  }
  size.value = horizontal.value ? el.offsetWidth : el.offsetHeight;
}

function clamp(value: number) {
  if (count.value <= 0) {
    return 0;
  }
  if (props.loop) {
    return ((value % count.value) + count.value) % count.value;
  }
  return Math.max(0, Math.min(value, count.value - 1));
}

function slideTo(targetIndex: number, source: SwiperChangeSource) {
  if (props.disabled && source !== 'nav') {
    return;
  }
  const target = clamp(targetIndex);
  if (target === index.value) {
    if (offset.value !== 0) {
      bounce();
    }
    return;
  }
  index.value = target;
  offset.value = 0;
  animating.value = true;
  emit('update:modelValue', target);
  emit('change', target, { source });
  window.clearTimeout(snapTimer ?? undefined);
  snapTimer = window.setTimeout(() => {
    animating.value = false;
  }, props.duration);
  if (source !== 'autoplay') {
    restartAutoplay();
  }
}

function bounce() {
  offset.value = 0;
  animating.value = true;
  window.clearTimeout(snapTimer ?? undefined);
  snapTimer = window.setTimeout(() => {
    animating.value = false;
  }, props.duration);
}

function prev() {
  slideTo(index.value - 1, 'nav');
}

function next() {
  slideTo(index.value + 1, 'nav');
}

function mainDelta(e: PointerEvent) {
  return horizontal.value ? e.clientX - startMain : e.clientY - startMain;
}

function crossDelta(e: PointerEvent) {
  return horizontal.value ? e.clientY - startCross : e.clientX - startCross;
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled || count.value <= 1) {
    return;
  }
  if (e.pointerType === 'mouse' && e.button !== 0) {
    return;
  }
  if (!e.isPrimary) {
    return;
  }
  const el = e.currentTarget as HTMLElement;
  el.setPointerCapture(e.pointerId);
  pointerId = e.pointerId;
  measure();
  dragging.value = true;
  locked.value = false;
  animating.value = false;
  dragged = false;
  axis = null;
  startTime = Date.now();
  startMain = horizontal.value ? e.clientX : e.clientY;
  startCross = horizontal.value ? e.clientY : e.clientX;
  offset.value = 0;
  stopAutoplay();
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) {
    return;
  }
  const main = mainDelta(e);
  const cross = crossDelta(e);
  if (!axis) {
    if (Math.abs(main) < 8 && Math.abs(cross) < 8) {
      return;
    }
    axis = Math.abs(main) >= Math.abs(cross) ? 'main' : 'cross';
    locked.value = axis === 'main';
    if (axis === 'cross') {
      release(e);
      return;
    }
  }
  if (axis !== 'main') {
    return;
  }
  if (Math.abs(main) > 8) {
    dragged = true;
  }
  e.preventDefault();
  if (!props.loop) {
    const atStart = index.value === 0 && main > 0;
    const atEnd = index.value === count.value - 1 && main < 0;
    if (atStart || atEnd) {
      const max = size.value * 0.12;
      const resisted = max * (1 - Math.exp(-Math.abs(main) / (max * 2.5)));
      offset.value = main > 0 ? resisted : -resisted;
      return;
    }
  }
  offset.value = main;
}

function onPointerUp(e: PointerEvent) {
  if (e.pointerId !== pointerId) {
    return;
  }
  if (!dragging.value) {
    return;
  }
  const fromMain = axis === 'main';
  const main = fromMain ? mainDelta(e) : 0;
  const quick = fromMain && Date.now() - startTime < 300 && Math.abs(main) > 50;
  release(e);
  const threshold = size.value * 0.25;
  if (fromMain && (Math.abs(main) > threshold || quick)) {
    slideTo(index.value + (main < 0 ? 1 : -1), 'touch');
  } else {
    bounce();
    restartAutoplay();
  }
}

function onLostCapture(e: PointerEvent) {
  if (e.pointerId !== pointerId || !dragging.value) {
    return;
  }
  release(e);
  bounce();
  restartAutoplay();
}

function release(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement | null;
  const id = pointerId;
  pointerId = null;
  dragging.value = false;
  locked.value = false;
  axis = null;
  if (el && id != null && el.hasPointerCapture?.(id)) {
    el.releasePointerCapture(id);
  }
}

function startAutoplay() {
  stopAutoplay();
  if (!props.autoplay || props.disabled || count.value <= 1) {
    return;
  }
  autoplayTimer = window.setInterval(() => {
    slideTo(index.value + 1, 'autoplay');
  }, props.interval);
}

function stopAutoplay() {
  if (autoplayTimer != null) {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function restartAutoplay() {
  if (props.autoplay) {
    startAutoplay();
  }
}

provide(swiperKey, {
  wasDragged: () => dragged,
  reportClick: (el) => {
    const track = rootRef.value?.querySelector('.rk-swiper-track');
    if (!track) {
      return;
    }
    const items = [...track.querySelectorAll(':scope > .rk-swiper-item')];
    const i = items.indexOf(el);
    if (i >= 0) {
      emit('click', i);
    }
  },
});

watch(() => props.modelValue, (value) => {
  if (value === index.value) {
    return;
  }
  index.value = clamp(value);
  offset.value = 0;
});

watch(count, (n) => {
  if (n > 0 && index.value > n - 1) {
    slideTo(n - 1, 'nav');
  }
  restartAutoplay();
});

watch(() => [props.autoplay, props.interval, props.disabled] as const, () => {
  restartAutoplay();
});

watch(horizontal, () => {
  measure();
});

let ro: ResizeObserver | null = null;

onMounted(() => {
  measure();
  restartAutoplay();
  if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
    ro = new ResizeObserver(measure);
    ro.observe(rootRef.value);
  }
});

onBeforeUnmount(() => {
  stopAutoplay();
  ro?.disconnect();
  window.clearTimeout(snapTimer ?? undefined);
});

defineExpose({
  slideTo: (targetIndex: number) => slideTo(targetIndex, 'nav'),
  prev,
  next,
});
</script>

<style scoped lang="scss">
.rk-swiper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
}

.rk-swiper-vertical {
  touch-action: pan-x;
}

.rk-swiper-disabled {
  pointer-events: none;
}

.rk-swiper-dragging {
  cursor: grabbing;
}

.rk-swiper-locked {
  touch-action: none;
}

.rk-swiper-track {
  display: flex;
  width: 100%;
  height: 100%;
  will-change: transform;
}

.rk-swiper-vertical .rk-swiper-track {
  flex-direction: column;
}

.rk-swiper-dots {
  position: absolute;
  bottom: var(--rk-swiper-dot-inset, 16px);
  left: 50%;
  z-index: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  transform: translateX(-50%);
}

.rk-swiper-vertical .rk-swiper-dots {
  top: 50%;
  right: var(--rk-swiper-dot-inset, 16px);
  bottom: auto;
  left: auto;
  flex-direction: column;
  transform: translateY(-50%);
}

.rk-swiper-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  cursor: pointer;
  background: color-mix(in srgb, white 40%, transparent);
  border: 0;
  border-radius: 50%;
}

.rk-swiper-dot-active {
  background: var(--rk-white);
}
</style>
