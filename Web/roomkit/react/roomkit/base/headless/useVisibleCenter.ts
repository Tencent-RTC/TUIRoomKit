import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ElementRef } from './types';
import { getVisibleArea, subscribeScrollParents } from './visibleArea';

/** Kept clear of the host edges when the panel is small enough to allow it. */
const EDGE_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Centre the panel in the visible slice, then pull it back inside the host edges.
 * A panel wide enough to leave less than a margin on each side cannot satisfy both,
 * so it splits the leftover evenly rather than sitting against one edge.
 */
function centerAxis(areaStart: number, areaSize: number, hostSize: number, panelSize: number) {
  const leftover = hostSize - panelSize;
  if (leftover < EDGE_MARGIN * 2) {
    return Math.max(0, leftover / 2);
  }
  return clamp(areaStart + (areaSize - panelSize) / 2, EDGE_MARGIN, leftover - EDGE_MARGIN);
}

export function useVisibleCenter(
  host: HTMLElement | null | undefined,
  panel: ElementRef,
  open: boolean,
) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const unsubScrollRef = useRef<(() => void) | null>(null);
  const frameRef = useRef(0);
  // Listeners are bound once; they read the latest inputs through these refs.
  const hostRef = useRef(host);
  hostRef.current = host;
  const openRef = useRef(open);
  openRef.current = open;

  const update = useCallback(() => {
    const hostEl = hostRef.current;
    const panelEl = panel.current;
    if (!hostEl || !panelEl || !openRef.current) return;
    const panelW = panelEl.offsetWidth;
    const panelH = panelEl.offsetHeight;
    if (!panelW || !panelH) return;

    const area = getVisibleArea(hostEl);
    setX(Math.round(centerAxis(area.x, area.width, area.hostWidth, panelW)));
    setY(Math.round(centerAxis(area.y, area.height, area.hostHeight, panelH)));
  }, [panel]);

  const scheduleUpdate = useCallback(() => {
    if (!openRef.current || frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      update();
    });
  }, [update]);

  const observe = useCallback((el: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el || !openRef.current) return;
    observerRef.current = new ResizeObserver(scheduleUpdate);
    observerRef.current.observe(el);
  }, [scheduleUpdate]);

  const bindScroll = useCallback(() => {
    unsubScrollRef.current?.();
    unsubScrollRef.current = null;
    if (!openRef.current) return;
    unsubScrollRef.current = subscribeScrollParents([hostRef.current], scheduleUpdate);
  }, [scheduleUpdate]);

  // Mirrors an immediate watch on the panel element: re-observe whenever it changes.
  const observedPanelRef = useRef<HTMLElement | null | undefined>(undefined);
  useLayoutEffect(() => {
    const el = panel.current;
    if (observedPanelRef.current === el) return;
    observedPanelRef.current = el;
    observe(el);
  });

  useLayoutEffect(() => {
    if (!open) {
      observerRef.current?.disconnect();
      observerRef.current = null;
      unsubScrollRef.current?.();
      unsubScrollRef.current = null;
      return;
    }
    observe(panel.current);
    bindScroll();
    update();
  }, [open, panel, observe, bindScroll, update]);

  const hostMountedRef = useRef(false);
  useEffect(() => {
    if (!hostMountedRef.current) {
      hostMountedRef.current = true;
      return;
    }
    if (openRef.current) bindScroll();
  }, [host, bindScroll]);

  useEffect(() => {
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      observerRef.current?.disconnect();
      unsubScrollRef.current?.();
      window.removeEventListener('resize', scheduleUpdate);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [scheduleUpdate]);

  return { x, y, update };
}
