<template>
  <div class="slider" ref="slider" @mousedown="handleMousedown">
    <div
      class="slider-track"
      ref="track"
      :style="{ width: valuePercentage + '%' }"
    ></div>
    <div
      class="slider-thumb"
      ref="thumb"
      :style="thumbStyle"
      :class="{ 'slider-thumb-disabled': disabled }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  watch,
  onMounted,
  onUnmounted,
  computed,
  defineProps,
  defineEmits,
} from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  step: {
    type: Number,
    default: 1,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const value = ref(props.modelValue);
const thumb = ref<HTMLElement | null>(null);
const slider = ref<HTMLElement | null>(null);
const track = ref(null);

watch(value, newValue => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  newValue => {
    value.value = newValue;
  }
);

const valuePercentage = computed(() => {
  return ((value.value - props.min) / (props.max - props.min)) * 100;
});

const thumbStyle = computed(() => {
  return {
    left: `${valuePercentage.value}%`,
  };
});

function handleMousedown(event: MouseEvent) {
  if (props.disabled) return;
  thumb.value?.classList.add('slider-thumb-active');
  handleMousemove(event);
}

function handleMousemove(event: MouseEvent) {
  if (props.disabled || !thumb.value?.classList.contains('slider-thumb-active'))
    return;
  const sliderRect = slider.value?.getBoundingClientRect();
  if (sliderRect) {
    const newValue =
      ((event.clientX - sliderRect.left) / sliderRect.width) *
        (props.max - props.min) +
      props.min;
    const steppedValue = Math.round(newValue / props.step) * props.step;
    const clampedValue = Math.min(Math.max(steppedValue, props.min), props.max);
    value.value = clampedValue;
  }
}

function handleMouseup() {
  if (props.disabled) return;
  thumb.value?.classList.remove('slider-thumb-active');
}

onMounted(() => {
  document.addEventListener('mousemove', handleMousemove);
  document.addEventListener('mouseup', handleMouseup);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMousemove);
  document.removeEventListener('mouseup', handleMouseup);
});
</script>

<style scoped lang="scss">
.slider {
  position: relative;
  width: 160px;
  height: 3px;
  background-color: var(--uikit-color-white-2);
  cursor: pointer;
}

.slider-track {
  position: absolute;
  height: 100%;
  background-color: var(--text-color-link);
}

.slider-thumb {
  position: absolute;
  top: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: box-shadow 0.2s;
  cursor: pointer;
  background-color: var(--uikit-color-white-1);
}

.slider-thumb-active {
  box-shadow: 0 4px 8px var(--uikit-color-black-5);
}

.slider-thumb-disabled {
  background-color: var(--uikit-color-gray-light-5);
  cursor: not-allowed;
}
</style>
