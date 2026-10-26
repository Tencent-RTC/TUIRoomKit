import { readonly, ref, watch } from 'vue';
import type { Ref } from 'vue';

/** A zoom state for an element transformed with `translate(x, y) scale(scale)` from `0 0`. */
export interface ZoomTransform {
  scale: number;
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PinchInput {
  /** Transform when the two fingers went down. */
  start: ZoomTransform;
  /** Finger distance and midpoint when the gesture started, in the element's untransformed frame. */
  startDistance: number;
  startCenter: Point;
  distance: number;
  center: Point;
  width: number;
  height: number;
  maxScale: number;
}

/** Scales this close to 1 snap back to 1, so a gesture that barely zoomed leaves no drift. */
const SNAP_EPSILON = 0.02;

const IDENTITY_TRANSFORM: ZoomTransform = { scale: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Keep the scaled element covering its own box: no gap may open on any edge. */
export function clampTranslate(x: number, y: number, scale: number, width: number, height: number): Point {
  return {
    x: clamp(x, -(scale - 1) * width, 0),
    y: clamp(y, -(scale - 1) * height, 0),
  };
}

/** Scale around the finger midpoint, so the content under the fingers stays under them. */
export function computePinch(input: PinchInput): ZoomTransform {
  const { start, startDistance, startCenter, distance, center, width, height, maxScale } = input;
  if (startDistance <= 0) {
    return { ...start };
  }
  const scale = clamp(start.scale * (distance / startDistance), 1, maxScale);
  if (scale - 1 < SNAP_EPSILON) {
    return { ...IDENTITY_TRANSFORM };
  }
  const ratio = scale / start.scale;
  const translate = clampTranslate(
    center.x - ratio * (startCenter.x - start.x),
    center.y - ratio * (startCenter.y - start.y),
    scale,
    width,
    height,
  );
  return { scale, ...translate };
}

/** Move a zoomed element by a finger delta. At scale 1 there is nothing to move. */
export function computePan(start: ZoomTransform, dx: number, dy: number, width: number, height: number): ZoomTransform {
  if (start.scale <= 1) {
    return { ...IDENTITY_TRANSFORM };
  }
  return { scale: start.scale, ...clampTranslate(start.x + dx, start.y + dy, start.scale, width, height) };
}

export interface UsePinchZoomOptions {
  enabled: Ref<boolean>;
  maxScale?: number;
}

const DEFAULT_MAX_SCALE = 4;

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Two-finger zoom and, once zoomed, one-finger pan on `target`. The transform is
 * written straight to the element so a gesture never re-renders the component.
 * Finger moves are read from `window`, since a parent may capture the pointer.
 */
export function usePinchZoom(target: Ref<HTMLElement | null | undefined>, options: UsePinchZoomOptions) {
  const maxScale = options.maxScale ?? DEFAULT_MAX_SCALE;
  const isZoomed = ref(false);
  const isGesturing = ref(false);

  let element: HTMLElement | null = null;
  let current: ZoomTransform = { ...IDENTITY_TRANSFORM };
  const pointers = new Map<number, Point>();

  let pinchStart: { transform: ZoomTransform; origin: Point; distance: number; center: Point } | null = null;
  let panStart: { transform: ZoomTransform; point: Point } | null = null;

  function apply(next: ZoomTransform) {
    current = next;
    isZoomed.value = next.scale > 1;
    if (!element) {
      return;
    }
    element.style.transform = next.scale > 1
      ? `translate(${next.x}px, ${next.y}px) scale(${next.scale})`
      : '';
  }

  /** Where the untransformed element's top-left sits on screen. */
  function untransformedOrigin(el: HTMLElement): Point {
    const rect = el.getBoundingClientRect();
    return { x: rect.left - current.x, y: rect.top - current.y };
  }

  function beginPinch() {
    if (!element) {
      return;
    }
    const [a, b] = [...pointers.values()];
    const origin = untransformedOrigin(element);
    const center = midpoint(a, b);
    pinchStart = {
      transform: { ...current },
      origin,
      distance: distanceBetween(a, b),
      center: { x: center.x - origin.x, y: center.y - origin.y },
    };
    panStart = null;
    isGesturing.value = true;
  }

  function beginPan(point: Point) {
    pinchStart = null;
    panStart = { transform: { ...current }, point: { ...point } };
    isGesturing.value = false;
  }

  function onMove(event: PointerEvent) {
    if (!element || !pointers.has(event.pointerId)) {
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchStart && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const center = midpoint(a, b);
      apply(computePinch({
        start: pinchStart.transform,
        startDistance: pinchStart.distance,
        startCenter: pinchStart.center,
        distance: distanceBetween(a, b),
        center: { x: center.x - pinchStart.origin.x, y: center.y - pinchStart.origin.y },
        width: element.offsetWidth,
        height: element.offsetHeight,
        maxScale,
      }));
      event.preventDefault();
      return;
    }
    if (panStart && panStart.transform.scale > 1) {
      apply(computePan(
        panStart.transform,
        event.clientX - panStart.point.x,
        event.clientY - panStart.point.y,
        element.offsetWidth,
        element.offsetHeight,
      ));
      event.preventDefault();
    }
  }

  function onUp(event: PointerEvent) {
    if (!pointers.delete(event.pointerId)) {
      return;
    }
    if (pointers.size === 1) {
      const [rest] = [...pointers.values()];
      beginPan(rest);
      return;
    }
    if (pointers.size === 0) {
      endGesture();
    }
  }

  let listening = false;

  function listenWindow(on: boolean) {
    if (listening === on) {
      return;
    }
    listening = on;
    if (on) {
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    } else {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    }
  }

  function endGesture() {
    listenWindow(false);
    pointers.clear();
    pinchStart = null;
    panStart = null;
    isGesturing.value = false;
  }

  function onDown(event: PointerEvent) {
    if (!options.enabled.value || pointers.size >= 2) {
      return;
    }
    if (event.pointerType === 'mouse') {
      return;
    }
    listenWindow(true);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      beginPinch();
    } else {
      beginPan({ x: event.clientX, y: event.clientY });
    }
  }

  function reset() {
    endGesture();
    apply({ ...IDENTITY_TRANSFORM });
  }

  watch(target, (el, _previous, onCleanup) => {
    if (!el) {
      return;
    }
    const node = el;
    element = node;
    node.style.transformOrigin = '0 0';
    node.addEventListener('pointerdown', onDown);
    onCleanup(() => {
      reset();
      node.removeEventListener('pointerdown', onDown);
      node.style.transformOrigin = '';
      if (element === node) {
        element = null;
      }
    });
  }, { immediate: true });

  watch(options.enabled, (enabled) => {
    if (!enabled) {
      reset();
    }
  });

  return {
    isZoomed: readonly(isZoomed),
    isGesturing: readonly(isGesturing),
    reset,
  };
}
