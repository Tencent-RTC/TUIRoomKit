import { computed, ref } from 'vue';
import type { Ref } from 'vue';

export interface UseSliderDragOptions {
  value: Ref<number>;
  min: Ref<number>;
  max: Ref<number>;
  step: Ref<number>;
  disabled: Ref<boolean>;
  onInput: (value: number) => void;
  onChange: (value: number) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useSliderDrag(track: Ref<HTMLElement | null>, options: UseSliderDragOptions) {
  const dragging = ref(false);

  const ratio = computed(() => {
    const span = options.max.value - options.min.value;
    if (!span) return 0;
    return (options.value.value - options.min.value) / span;
  });

  const snap = (raw: number) => {
    const stepped = options.min.value + Math.round((raw - options.min.value) / options.step.value) * options.step.value;
    return clamp(Number(stepped.toFixed(6)), options.min.value, options.max.value);
  };

  const valueFromEvent = (event: PointerEvent) => {
    const el = track.value;
    if (!el) return options.value.value;
    const rect = el.getBoundingClientRect();
    const ratioX = rect.width ? clamp((event.clientX - rect.left) / rect.width, 0, 1) : 0;
    return snap(options.min.value + ratioX * (options.max.value - options.min.value));
  };

  const onPointerDown = (event: PointerEvent) => {
    if (options.disabled.value) return;
    dragging.value = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    options.onInput(valueFromEvent(event));
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging.value) return;
    options.onInput(valueFromEvent(event));
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging.value) return;
    dragging.value = false;
    options.onChange(valueFromEvent(event));
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (options.disabled.value) return;
    let next = options.value.value;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= options.step.value;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += options.step.value;
    else if (event.key === 'Home') next = options.min.value;
    else if (event.key === 'End') next = options.max.value;
    else return;
    event.preventDefault();
    const value = snap(next);
    options.onInput(value);
    options.onChange(value);
  };

  return { dragging, ratio, onPointerDown, onPointerMove, onPointerUp, onKeydown };
}
