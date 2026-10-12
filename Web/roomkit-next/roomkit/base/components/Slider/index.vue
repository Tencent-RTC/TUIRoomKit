<template>
  <div
    ref="trackRef"
    class="rk-slider"
    :class="{ 'rk-slider-disabled': disabled }"
    role="slider"
    tabindex="0"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="modelValue"
    :aria-disabled="disabled"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @keydown="onKeydown"
  >
    <div class="rk-slider-rail" />
    <div class="rk-slider-fill" :style="{ width: `${ratio * 100}%` }" />
    <div class="rk-slider-thumb" :style="{ left: `${ratio * 100}%` }" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useSliderDrag } from './useSliderDrag';

defineOptions({ name: 'TUISlider' });

const props = withDefaults(defineProps<{
  modelValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  'change': [value: number];
}>();

const trackRef = ref<HTMLElement | null>(null);
const current = computed(() => props.modelValue ?? 0);

const { ratio, onPointerDown, onPointerMove, onPointerUp, onKeydown } = useSliderDrag(trackRef, {
  value: current,
  min: toRef(props, 'min'),
  max: toRef(props, 'max'),
  step: toRef(props, 'step'),
  disabled: toRef(props, 'disabled'),
  onInput: value => emit('update:modelValue', value),
  onChange: value => emit('change', value),
});
</script>

<style scoped lang="scss">
.rk-slider {
  position: relative;
  display: flex;
  align-items: center;
  height: 20px;
  cursor: pointer;
  outline: none;
}

.rk-slider-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.rk-slider-rail,
.rk-slider-fill {
  position: absolute;
  right: 0;
  left: 0;
  height: 4px;
  border-radius: var(--rk-radius-pill);
}

.rk-slider-rail {
  width: 100%;
  background: var(--rk-track);
}

.rk-slider-fill {
  background: var(--rk-brand);
}

.rk-slider-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: var(--rk-knob);
  border: 2px solid var(--rk-brand);
  border-radius: 50%;
  box-shadow: 0 1px 4px color-mix(in srgb, black 16%, transparent);
  transform: translate(-50%, -50%);
}
</style>
