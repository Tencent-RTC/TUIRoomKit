import { useEffect, useRef, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { CAPTION_DOCK_EDGE_PADDING, MIN_CAPTION_DOCK_WIDTH } from '../constants';
import type { CaptionDockPosition } from '../useSubtitleViewState';

const RESIZE_THRESHOLD = 4;

export type CaptionDockResizeEdge = 'left' | 'right';

export function clampCaptionDockWidth(
  width: number,
  containerWidth: number,
  maxWidth = Number.POSITIVE_INFINITY,
): number {
  const containerMax = Math.max(0, containerWidth - CAPTION_DOCK_EDGE_PADDING * 2);
  const max = Math.max(0, Math.min(containerMax, maxWidth));
  const min = Math.min(MIN_CAPTION_DOCK_WIDTH, max);
  return Math.min(Math.max(width, min), max);
}

/**
 * Caption-dock width resize. A centered dock grows from the middle; a dragged
 * dock keeps the opposite edge pinned.
 */
export function useCaptionDockResize(options: {
  containerRef: RefObject<HTMLElement | null>;
  dockRef: RefObject<HTMLElement | null>;
  dockWidth: number | null;
  setDockWidth: (width: number | null) => void;
  position: CaptionDockPosition | null;
  setPosition: Dispatch<SetStateAction<CaptionDockPosition | null>>;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const resizingRef = useRef(false);
  const resize = useRef({
    pointerId: -1,
    edge: 'right' as CaptionDockResizeEdge,
    startClientX: 0,
    startWidth: 0,
    startX: 0,
    moved: false,
  });
  const handlersRef = useRef<{
    onPointerMove: (event: PointerEvent) => void;
    onPointerUp: (event: PointerEvent) => void;
  }>({
        onPointerMove: () => undefined,
        onPointerUp: () => undefined,
      });
  const listenersRef = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
  } | null>(null);
  if (!listenersRef.current) {
    listenersRef.current = {
      move: event => handlersRef.current.onPointerMove(event),
      up: event => handlersRef.current.onPointerUp(event),
    };
  }

  function commitWidth(nextWidth: number, nextX?: number) {
    const { setDockWidth, setPosition, position } = optionsRef.current;
    setDockWidth(nextWidth);
    if (nextX !== undefined && position) {
      setPosition({
        ...position,
        x: nextX,
      });
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!resizingRef.current || event.pointerId !== resize.current.pointerId) {
      return;
    }
    const container = optionsRef.current.containerRef.current;
    if (!container) {
      return;
    }
    const deltaX = event.clientX - resize.current.startClientX;
    resize.current.moved ||= Math.abs(deltaX) >= RESIZE_THRESHOLD;
    if (!resize.current.moved) {
      return;
    }
    event.preventDefault();
    const boxWidth = container.clientWidth;
    const { position } = optionsRef.current;

    if (!position) {
      const signed = resize.current.edge === 'right' ? deltaX : -deltaX;
      commitWidth(clampCaptionDockWidth(resize.current.startWidth + signed * 2, boxWidth));
      return;
    }

    if (resize.current.edge === 'right') {
      const maxWidth = boxWidth - CAPTION_DOCK_EDGE_PADDING - resize.current.startX;
      commitWidth(clampCaptionDockWidth(resize.current.startWidth + deltaX, boxWidth, maxWidth));
      return;
    }

    const right = resize.current.startX + resize.current.startWidth;
    const maxWidth = right - CAPTION_DOCK_EDGE_PADDING;
    const nextWidth = clampCaptionDockWidth(resize.current.startWidth - deltaX, boxWidth, maxWidth);
    commitWidth(nextWidth, right - nextWidth);
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== resize.current.pointerId) {
      return;
    }
    resizingRef.current = false;
    setIsResizing(false);
    const { pointerId } = resize.current;
    resize.current.pointerId = -1;
    try {
      optionsRef.current.dockRef.current?.releasePointerCapture?.(pointerId);
    } catch {
      // Pointer already released on cancel.
    }
    window.removeEventListener('pointermove', listenersRef.current?.move ?? onPointerMove);
    window.removeEventListener('pointerup', listenersRef.current?.up ?? onPointerUp);
    window.removeEventListener('pointercancel', listenersRef.current?.up ?? onPointerUp);
    optionsRef.current.onResizeEnd?.();
  }

  handlersRef.current = { onPointerMove, onPointerUp };

  function startResize(event: PointerEvent, edge: CaptionDockResizeEdge) {
    const container = optionsRef.current.containerRef.current;
    const dock = optionsRef.current.dockRef.current;
    if (event.button !== 0 || !container || !dock) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    optionsRef.current.onResizeStart?.();
    const containerRect = container.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    resize.current = {
      pointerId: event.pointerId,
      edge,
      startClientX: event.clientX,
      startWidth: dock.offsetWidth,
      startX: dockRect.left - containerRect.left,
      moved: false,
    };
    resizingRef.current = true;
    setIsResizing(true);
    dock.setPointerCapture?.(event.pointerId);
    const listeners = listenersRef.current;
    if (!listeners) {
      return;
    }
    window.addEventListener('pointermove', listeners.move, { passive: false });
    window.addEventListener('pointerup', listeners.up);
    window.addEventListener('pointercancel', listeners.up);
  }

  useEffect(() => () => {
    const listeners = listenersRef.current;
    if (!listeners) {
      return;
    }
    window.removeEventListener('pointermove', listeners.move);
    window.removeEventListener('pointerup', listeners.up);
    window.removeEventListener('pointercancel', listeners.up);
  }, []);

  return {
    isResizing,
    startResize,
  };
}
