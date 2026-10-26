import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';

export interface UseSliderDragOptions {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onInput: (value: number) => void;
  onChange: (value: number) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useSliderDrag(track: RefObject<HTMLElement | null>, options: UseSliderDragOptions) {
  const dragging = useRef(false);

  const span = options.max - options.min;
  const ratio = span ? (options.value - options.min) / span : 0;

  const snap = (raw: number) => {
    const stepped = options.min + Math.round((raw - options.min) / options.step) * options.step;
    return clamp(Number(stepped.toFixed(6)), options.min, options.max);
  };

  const valueFromEvent = (event: PointerEvent<HTMLElement>) => {
    const el = track.current;
    if (!el) return options.value;
    const rect = el.getBoundingClientRect();
    const ratioX = rect.width ? clamp((event.clientX - rect.left) / rect.width, 0, 1) : 0;
    return snap(options.min + ratioX * (options.max - options.min));
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (options.disabled) return;
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    options.onInput(valueFromEvent(event));
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragging.current) return;
    options.onInput(valueFromEvent(event));
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    options.onChange(valueFromEvent(event));
  };

  const onKeydown = (event: KeyboardEvent<HTMLElement>) => {
    if (options.disabled) return;
    let next = options.value;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= options.step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += options.step;
    else if (event.key === 'Home') next = options.min;
    else if (event.key === 'End') next = options.max;
    else return;
    event.preventDefault();
    const value = snap(next);
    options.onInput(value);
    options.onChange(value);
  };

  return { dragging, ratio, onPointerDown, onPointerMove, onPointerUp, onKeydown };
}
