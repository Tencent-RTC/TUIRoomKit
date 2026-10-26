import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { clampBox, useDrag } from '../../../base';
import { CAPTION_DOCK_EDGE_PADDING } from '../constants';
import type { CaptionDockPosition } from '../useSubtitleViewState';

const DOCK_PADDING = 16;
const PIN_BOTTOM_EPSILON = 0.5;

interface DockPositionOptions {
  handle?: (event: PointerEvent) => boolean;
  beforeSync?: () => boolean | void;
}

function toolbarInset(container: HTMLElement): number {
  const toolbar = container.querySelector<HTMLElement>('.conference-toolbar');
  if (!toolbar) {
    return 0;
  }
  const containerRect = container.getBoundingClientRect();
  const toolbarRect = toolbar.getBoundingClientRect();
  return Math.max(0, containerRect.bottom - toolbarRect.top);
}

function measureOffset(container: HTMLElement, dock: HTMLElement): { x: number; y: number } {
  const containerRect = container.getBoundingClientRect();
  const dockRect = dock.getBoundingClientRect();
  return { x: dockRect.left - containerRect.left, y: dockRect.top - containerRect.top };
}

function samePosition(a: CaptionDockPosition, b: CaptionDockPosition): boolean {
  return a.x === b.x
    && a.y === b.y
    && Boolean(a.pinnedToBottom) === Boolean(b.pinnedToBottom)
    && a.bottomOffset === b.bottomOffset;
}

/**
 * Where the caption dock sits inside the conference stage. Dragged docks stay
 * clear of the toolbar and pin to the bottom once they reach it, so later
 * caption growth moves upward.
 */
export function useCaptionDockPosition(
  containerRef: RefObject<HTMLElement | null>,
  dockRef: RefObject<HTMLElement | null>,
  options: DockPositionOptions = {},
) {
  const [position, setPosition] = useState<CaptionDockPosition | null>(null);
  const [bottomGap, setBottomGap] = useState(DOCK_PADDING);
  const positionRef = useRef(position);
  const optionsRef = useRef(options);
  const draggingRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0 });
  positionRef.current = position;
  optionsRef.current = options;

  function measureGaps(container: HTMLElement): { top: number; bottom: number } {
    const bottom = DOCK_PADDING + toolbarInset(container);
    setBottomGap(current => Math.max(current, bottom));
    return { top: DOCK_PADDING, bottom };
  }

  function applyClamp(
    container: HTMLElement,
    dock: HTMLElement,
    x: number,
    y: number,
    source: 'drag' | 'sync',
  ): CaptionDockPosition {
    const { top, bottom } = measureGaps(container);
    const bounds = {
      x: CAPTION_DOCK_EDGE_PADDING,
      y: top,
      width: Math.max(0, container.clientWidth - CAPTION_DOCK_EDGE_PADDING * 2),
      height: Math.max(0, container.clientHeight - top - bottom),
    };
    const clamped = clampBox(x, y, dock.offsetWidth, dock.offsetHeight, bounds);
    const maxY = bounds.y + Math.max(0, bounds.height - dock.offsetHeight);
    const reachedBottom = clamped.y >= maxY - PIN_BOTTOM_EPSILON;
    const { current } = positionRef;
    const pinnedToBottom = source === 'drag'
      ? reachedBottom
      : Boolean(current?.pinnedToBottom) || reachedBottom;
    if (!pinnedToBottom) {
      return { x: clamped.x, y: clamped.y, pinnedToBottom: false };
    }
    const bottomOffset = source === 'drag'
      ? bottom
      : Math.max(current?.bottomOffset ?? bottom, bottom);
    return {
      x: clamped.x,
      y: Math.max(top, container.clientHeight - dock.offsetHeight - bottomOffset),
      pinnedToBottom: true,
      bottomOffset,
    };
  }

  function syncPosition() {
    const container = containerRef.current;
    const dock = dockRef.current;
    if (!container || !dock) {
      return;
    }
    measureGaps(container);
    const { current } = positionRef;
    if (!current) {
      return;
    }
    const next = applyClamp(container, dock, current.x, current.y, 'sync');
    if (!samePosition(current, next)) {
      setPosition(next);
    }
  }

  const syncRef = useRef(syncPosition);
  syncRef.current = syncPosition;

  const { isDragging } = useDrag(dockRef, {
    handle: event => Boolean(containerRef.current) && (optionsRef.current.handle?.(event) ?? true),
    onStart: () => {
      const container = containerRef.current;
      const dock = dockRef.current;
      if (!container || !dock) {
        return;
      }
      const origin = positionRef.current ?? measureOffset(container, dock);
      originRef.current = { x: origin.x, y: origin.y };
    },
    onDrag: ({ dx, dy }) => {
      const container = containerRef.current;
      const dock = dockRef.current;
      if (!container || !dock) {
        return;
      }
      setPosition(applyClamp(
        container,
        dock,
        originRef.current.x + dx,
        originRef.current.y + dy,
        'drag',
      ));
    },
    onEnd: (moved) => {
      const container = containerRef.current;
      const dock = dockRef.current;
      const { current } = positionRef;
      if (!moved || !current || !container || !dock) {
        return;
      }
      setPosition(applyClamp(container, dock, current.x, current.y, 'drag'));
    },
  });
  draggingRef.current = isDragging;

  useEffect(() => {
    let observer: ResizeObserver | undefined;
    let cancelled = false;

    const attach = () => {
      if (cancelled) {
        return;
      }
      const container = containerRef.current;
      const dock = dockRef.current;
      if (!container || !dock) {
        return;
      }
      setBottomGap(DOCK_PADDING);
      const handleWorldChange = () => {
        if (draggingRef.current || optionsRef.current.beforeSync?.() === false) {
          return;
        }
        syncRef.current();
      };
      observer = new ResizeObserver(handleWorldChange);
      observer.observe(dock);
      observer.observe(container);
      const toolbar = container.querySelector<HTMLElement>('.conference-toolbar');
      if (toolbar) {
        observer.observe(toolbar);
      }
    };

    queueMicrotask(attach);
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [containerRef, dockRef]);

  const dockStyle = ((): CSSProperties | undefined => {
    if (!position) {
      return undefined;
    }
    if (position.pinnedToBottom && !isDragging) {
      return {
        left: `${position.x}px`,
        top: 'auto',
        bottom: `${position.bottomOffset ?? DOCK_PADDING}px`,
      };
    }
    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
      bottom: 'auto',
    };
  })();

  return {
    dockStyle,
    isDragging,
    position,
    setPosition,
    bottomGap,
    syncPosition,
  };
}
