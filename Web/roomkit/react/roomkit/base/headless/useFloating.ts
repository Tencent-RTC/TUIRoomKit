import { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { OVERLAY_CONTEXT_KEY } from '../tokens';
import type { Placement } from '../tokens';
import type { UseFloatingOptions } from './types';
import { getVisibleArea, subscribeScrollParents } from './visibleArea';

interface Point {
  x: number; y: number;
}

/** Gap kept between the panel and the edge of the visible area. */
const EDGE_MARGIN = 4;

function splitPlacement(placement: Placement) {
  const [side, align = 'center'] = placement.split('-') as [string, string];
  return { side, align };
}

function opposite(side: string) {
  const map: Record<string, string> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  return map[side] || side;
}

interface WatchedInputs {
  reference: HTMLElement | null;
  floating: HTMLElement | null;
  boundary: HTMLElement | null | undefined;
  placement: Placement | undefined;
  offset: number | undefined;
  enabled: boolean;
}

export function useFloating(options: UseFloatingOptions) {
  const ctx = useContext(OVERLAY_CONTEXT_KEY);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [placement, setPlacement] = useState<Placement>(options.placement || 'bottom');
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const [arrowX, setArrowX] = useState(0);
  const [arrowY, setArrowY] = useState(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const unsubScrollRef = useRef<(() => void) | null>(null);
  const frameRef = useRef(0);
  const resizeWindowRef = useRef<Window | null>(null);

  // Listeners are bound once; they read the latest inputs through these refs.
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const isEnabled = useCallback(() => optionsRef.current.enabled ?? true, []);

  const getBoundary = useCallback(() => {
    const { current } = optionsRef;
    const overlay = ctxRef.current;
    return (
      current.boundary?.current
      || overlay?.host
      || overlay?.root
      || current.reference.current?.closest('.rk-root') as HTMLElement | null
    );
  }, []);

  const getBoundaryWindow = useCallback((boundary = getBoundary()) => (
    boundary?.ownerDocument.defaultView ?? window
  ), [getBoundary]);

  const update = useCallback(() => {
    if (!isEnabled()) return;
    const { current } = optionsRef;
    const reference = current.reference.current;
    const floating = current.floating.current;
    const boundary = getBoundary();
    if (!reference || !floating || !boundary) return;

    const gap = current.offset ?? 4;
    const hostRect = boundary.getBoundingClientRect();
    const refRect = reference.getBoundingClientRect();
    const floatW = floating.offsetWidth;
    let floatH = floating.offsetHeight;
    if (!floatW || !floatH) return;

    let { side, align } = splitPlacement(current.placement || 'bottom');

    const place = (nextSide: string): Point => {
      let nextX = 0;
      let nextY = 0;
      if (nextSide === 'bottom') nextY = refRect.bottom - hostRect.top + gap;
      if (nextSide === 'top') nextY = refRect.top - hostRect.top - floatH - gap;
      if (nextSide === 'left') nextX = refRect.left - hostRect.left - floatW - gap;
      if (nextSide === 'right') nextX = refRect.right - hostRect.left + gap;

      if (nextSide === 'top' || nextSide === 'bottom') {
        if (align === 'start') nextX = refRect.left - hostRect.left;
        else if (align === 'end') nextX = refRect.right - hostRect.left - floatW;
        else nextX = refRect.left - hostRect.left + (refRect.width - floatW) / 2;
      } else if (align === 'start') nextY = refRect.top - hostRect.top;
      else if (align === 'end') nextY = refRect.bottom - hostRect.top - floatH;
      else nextY = refRect.top - hostRect.top + (refRect.height - floatH) / 2;
      return { x: nextX, y: nextY };
    };

    const area = getVisibleArea(boundary);
    /** Height a panel on this side can take without leaving the visible area. */
    const roomFor = (nextSide: string) => {
      if (nextSide === 'top') return refRect.top - hostRect.top - gap - area.y - EDGE_MARGIN;
      if (nextSide === 'bottom') return area.y + area.height - EDGE_MARGIN - (refRect.bottom - hostRect.top + gap);
      return area.height - EDGE_MARGIN * 2;
    };
    const mainOverflow = (nextSide: string, next: Point) => {
      if (nextSide === 'bottom') return Math.max(0, next.y + floatH - (area.y + area.height));
      if (nextSide === 'top') return Math.max(0, area.y - next.y);
      if (nextSide === 'right') return Math.max(0, next.x + floatW - (area.x + area.width));
      if (nextSide === 'left') return Math.max(0, area.x - next.x);
      return 0;
    };

    let point = place(side);
    if (current.flip !== false) {
      const overflow = mainOverflow(side, point);
      if (overflow > 0) {
        const nextSide = opposite(side);
        const flipped = place(nextSide);
        if (mainOverflow(nextSide, flipped) < overflow) {
          side = nextSide;
          point = flipped;
        }
      }
    }

    /* Content taller than the side it sits on is capped instead of running off screen;
       the panel scrolls what no longer fits. Re-place so the cap moves the top edge too. */
    if (current.constrainHeight) {
      const room = Math.floor(roomFor(side));
      setMaxHeight(room > 0 ? room : null);
      if (room > 0 && floatH > room) {
        floatH = room;
        point = place(side);
      }
    }

    if (current.shift !== false) {
      const minX = area.x + EDGE_MARGIN;
      const minY = area.y + EDGE_MARGIN;
      const maxX = area.x + area.width - floatW - EDGE_MARGIN;
      const maxY = area.y + area.height - floatH - EDGE_MARGIN;
      point.x = Math.min(Math.max(minX, point.x), Math.max(minX, maxX));
      point.y = Math.min(Math.max(minY, point.y), Math.max(minY, maxY));
    }

    setX(Math.round(point.x));
    setY(Math.round(point.y));
    setPlacement((align === 'center' ? side : `${side}-${align}`) as Placement);

    if (current.arrow?.current) {
      if (side === 'top' || side === 'bottom') {
        setArrowX(Math.round(refRect.left - hostRect.left + refRect.width / 2 - point.x));
        setArrowY(0);
      } else {
        setArrowX(0);
        setArrowY(Math.round(refRect.top - hostRect.top + refRect.height / 2 - point.y));
      }
    }
  }, [isEnabled, getBoundary]);

  const scheduleUpdate = useCallback(() => {
    if (!isEnabled() || frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      update();
    });
  }, [isEnabled, update]);

  const observe = useCallback(() => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (!isEnabled()) return;
    const ro = new ResizeObserver(scheduleUpdate);
    roRef.current = ro;
    const { current } = optionsRef;
    if (current.reference.current instanceof Element) ro.observe(current.reference.current);
    if (current.floating.current) ro.observe(current.floating.current);
    const boundary = getBoundary();
    if (boundary) ro.observe(boundary);
  }, [isEnabled, scheduleUpdate, getBoundary]);

  const bindScroll = useCallback(() => {
    unsubScrollRef.current?.();
    unsubScrollRef.current = null;
    if (!isEnabled()) return;
    unsubScrollRef.current = subscribeScrollParents(
      [optionsRef.current.reference.current, getBoundary()],
      scheduleUpdate,
    );
  }, [isEnabled, scheduleUpdate, getBoundary]);

  const bindResize = useCallback(() => {
    const nextWindow = getBoundaryWindow();
    if (resizeWindowRef.current === nextWindow) {
      return;
    }
    resizeWindowRef.current?.removeEventListener('resize', scheduleUpdate);
    resizeWindowRef.current = nextWindow;
    nextWindow.addEventListener('resize', scheduleUpdate);
  }, [getBoundaryWindow, scheduleUpdate]);

  const watchedRef = useRef<WatchedInputs | null>(null);

  useLayoutEffect(() => () => {
    roRef.current?.disconnect();
    roRef.current = null;
    unsubScrollRef.current?.();
    unsubScrollRef.current = null;
    resizeWindowRef.current?.removeEventListener('resize', scheduleUpdate);
    resizeWindowRef.current = null;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    watchedRef.current = null;
  }, [scheduleUpdate]);

  // Mount, then a watch on the element refs and positioning inputs: runs after every
  // commit (element refs are attached by then) and re-binds only when one changed.
  useLayoutEffect(() => {
    const next: WatchedInputs = {
      reference: options.reference.current,
      floating: options.floating.current,
      boundary: options.boundary?.current,
      placement: options.placement,
      offset: options.offset,
      enabled: options.enabled ?? true,
    };
    const prev = watchedRef.current;
    watchedRef.current = next;
    if (prev
      && prev.reference === next.reference
      && prev.floating === next.floating
      && prev.boundary === next.boundary
      && prev.placement === next.placement
      && prev.offset === next.offset
      && prev.enabled === next.enabled) {
      return;
    }
    bindResize();
    observe();
    bindScroll();
    update();
  });

  return { x, y, placement, maxHeight, arrowX, arrowY, update };
}
