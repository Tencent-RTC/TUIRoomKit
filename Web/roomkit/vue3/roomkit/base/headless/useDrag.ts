import { ref, watch } from 'vue';
import type { Ref } from 'vue';

const DRAG_THRESHOLD = 4;

/** The region a box is allowed to occupy, in its own coordinate space. */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clampOffset(offset: number, size: number, range: number): number {
  const lower = Math.min(0, range - size);
  const upper = Math.max(0, range - size);
  return Math.min(Math.max(offset, lower), upper);
}

/** Move a box as close to (x, y) as `bounds` allows. */
export function clampBox(
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: Bounds,
): { x: number; y: number } {
  return {
    x: bounds.x + clampOffset(x - bounds.x, width, bounds.width),
    y: bounds.y + clampOffset(y - bounds.y, height, bounds.height),
  };
}

export interface DragDelta {
  dx: number;
  dy: number;
}

export interface UseDragOptions {
  /** Decides whether a pointerdown starts a drag. Without it, anything does. */
  handle?: (event: PointerEvent) => boolean;
  /** Fires once the gesture passes the threshold, before the first `onDrag`. */
  onStart?: () => void;
  /** Movement since the pointer went down, in pixels. */
  onDrag: (delta: DragDelta) => void;
  onEnd?: (moved: boolean) => void;
}

/**
 * Turns pointer movement on `target` into drag deltas. It never writes a position, so
 * coordinates, bounds and persistence stay with the caller.
 */
export function useDrag(
  target: Ref<HTMLElement | null | undefined>,
  options: UseDragOptions,
) {
  const isDragging = ref(false);

  watch(target, (element, _previous, onCleanup) => {
    if (!element) {
      return;
    }
    onCleanup(attachDrag(element));
  }, { immediate: true });

  function attachDrag(el: HTMLElement): () => void {
    const element = el;
    let pointerId: number | undefined;
    let startX = 0;
    let startY = 0;
    let moved = false;

    const swallowClick = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
    };

    const stop = () => {
      if (pointerId === undefined) {
        return;
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (element.hasPointerCapture(pointerId)) {
        element.releasePointerCapture(pointerId);
      }
      pointerId = undefined;
      element.style.userSelect = '';
      if (moved) {
        element.addEventListener('click', swallowClick, { capture: true, once: true });
        window.setTimeout(() => element.removeEventListener('click', swallowClick, { capture: true }));
      }
      isDragging.value = false;
      options.onEnd?.(moved);
      moved = false;
    };

    function onMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return;
      }
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
          return;
        }
        moved = true;
        element.setPointerCapture(event.pointerId);
        element.style.userSelect = 'none';
        options.onStart?.();
        isDragging.value = true;
      }
      event.preventDefault();
      options.onDrag({ dx, dy });
    }

    function onUp(event: PointerEvent) {
      if (event.pointerId === pointerId) {
        stop();
      }
    }

    const onDown = (event: PointerEvent) => {
      if (pointerId !== undefined || event.button !== 0) {
        return;
      }
      if (options.handle && !options.handle(event)) {
        return;
      }
      startX = event.clientX;
      startY = event.clientY;
      moved = false;
      pointerId = event.pointerId;
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };

    element.addEventListener('pointerdown', onDown);

    return () => {
      stop();
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('click', swallowClick, { capture: true });
    };
  }

  return { isDragging };
}
