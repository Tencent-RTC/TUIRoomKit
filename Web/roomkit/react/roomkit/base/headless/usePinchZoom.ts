import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

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
  enabled: boolean;
  maxScale?: number;
}

export interface UsePinchZoomResult {
  /** True while the element is zoomed past 1; read `.current` at event time. */
  isZoomed: RefObject<boolean>;
  /** True while a two-finger pinch is running; read `.current` at event time. */
  isGesturing: RefObject<boolean>;
  reset: () => void;
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
export function usePinchZoom(
  target: RefObject<HTMLElement | null | undefined>,
  options: UsePinchZoomOptions,
): UsePinchZoomResult {
  const maxScale = options.maxScale ?? DEFAULT_MAX_SCALE;
  const isZoomed = useRef(false);
  const isGesturing = useRef(false);

  const latest = useRef({ enabled: options.enabled, maxScale });
  latest.current = { enabled: options.enabled, maxScale };

  const local = useRef({
    element: null as HTMLElement | null,
    current: { ...IDENTITY_TRANSFORM } as ZoomTransform,
    pointers: new Map<number, Point>(),
    pinchStart: null as { transform: ZoomTransform; origin: Point; distance: number; center: Point } | null,
    panStart: null as { transform: ZoomTransform; point: Point } | null,
    listening: false,
  }).current;

  function apply(next: ZoomTransform) {
    local.current = next;
    isZoomed.current = next.scale > 1;
    if (!local.element) {
      return;
    }
    local.element.style.transform = next.scale > 1
      ? `translate(${next.x}px, ${next.y}px) scale(${next.scale})`
      : '';
  }

  /** Where the untransformed element's top-left sits on screen. */
  function untransformedOrigin(el: HTMLElement): Point {
    const rect = el.getBoundingClientRect();
    return { x: rect.left - local.current.x, y: rect.top - local.current.y };
  }

  function beginPinch() {
    if (!local.element) {
      return;
    }
    const [a, b] = [...local.pointers.values()];
    const origin = untransformedOrigin(local.element);
    const center = midpoint(a, b);
    local.pinchStart = {
      transform: { ...local.current },
      origin,
      distance: distanceBetween(a, b),
      center: { x: center.x - origin.x, y: center.y - origin.y },
    };
    local.panStart = null;
    isGesturing.current = true;
  }

  function beginPan(point: Point) {
    local.pinchStart = null;
    local.panStart = { transform: { ...local.current }, point: { ...point } };
    isGesturing.current = false;
  }

  function onMove(event: PointerEvent) {
    if (!local.element || !local.pointers.has(event.pointerId)) {
      return;
    }
    local.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (local.pinchStart && local.pointers.size >= 2) {
      const [a, b] = [...local.pointers.values()];
      const center = midpoint(a, b);
      apply(computePinch({
        start: local.pinchStart.transform,
        startDistance: local.pinchStart.distance,
        startCenter: local.pinchStart.center,
        distance: distanceBetween(a, b),
        center: { x: center.x - local.pinchStart.origin.x, y: center.y - local.pinchStart.origin.y },
        width: local.element.offsetWidth,
        height: local.element.offsetHeight,
        maxScale: latest.current.maxScale,
      }));
      event.preventDefault();
      return;
    }
    if (local.panStart && local.panStart.transform.scale > 1) {
      apply(computePan(
        local.panStart.transform,
        event.clientX - local.panStart.point.x,
        event.clientY - local.panStart.point.y,
        local.element.offsetWidth,
        local.element.offsetHeight,
      ));
      event.preventDefault();
    }
  }

  function onUp(event: PointerEvent) {
    if (!local.pointers.delete(event.pointerId)) {
      return;
    }
    if (local.pointers.size === 1) {
      const [rest] = [...local.pointers.values()];
      beginPan(rest);
      return;
    }
    if (local.pointers.size === 0) {
      endGesture();
    }
  }

  function listenWindow(on: boolean) {
    if (local.listening === on) {
      return;
    }
    local.listening = on;
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
    local.pointers.clear();
    local.pinchStart = null;
    local.panStart = null;
    isGesturing.current = false;
  }

  function onDown(event: PointerEvent) {
    if (!latest.current.enabled || local.pointers.size >= 2) {
      return;
    }
    if (event.pointerType === 'mouse') {
      return;
    }
    listenWindow(true);
    local.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (local.pointers.size === 2) {
      beginPinch();
    } else {
      beginPan({ x: event.clientX, y: event.clientY });
    }
  }

  function reset() {
    endGesture();
    apply({ ...IDENTITY_TRANSFORM });
  }

  // The ref value is read during render so the effect re-runs when the target
  // element swaps, matching the Vue `watch(target)` behaviour.
  const node = target.current;

  useEffect(() => {
    if (!node) {
      return undefined;
    }
    const el = node;
    local.element = el;
    el.style.transformOrigin = '0 0';
    el.addEventListener('pointerdown', onDown);
    return () => {
      reset();
      el.removeEventListener('pointerdown', onDown);
      el.style.transformOrigin = '';
      if (local.element === el) {
        local.element = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);

  const enabledFirstRun = useRef(true);
  useEffect(() => {
    if (enabledFirstRun.current) {
      enabledFirstRun.current = false;
      return;
    }
    if (!options.enabled) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.enabled]);

  return {
    isZoomed,
    isGesturing,
    reset,
  };
}
