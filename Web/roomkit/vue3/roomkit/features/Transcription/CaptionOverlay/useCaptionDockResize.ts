import { onBeforeUnmount, ref } from 'vue';
import type { Ref } from 'vue';
import { CAPTION_DOCK_EDGE_PADDING, MIN_CAPTION_DOCK_WIDTH } from '../constants';
import type { CaptionDockPosition } from '../useSubtitleViewState';

const RESIZE_THRESHOLD = 4;

export type CaptionDockResizeEdge = 'left' | 'right';

function clampCaptionDockWidth(
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
  containerRef: Ref<HTMLElement | undefined>;
  dockRef: Ref<HTMLElement | undefined>;
  dockWidth: Ref<number | null>;
  position: Ref<CaptionDockPosition | null>;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}) {
  const isResizing = ref(false);
  const resize = {
    pointerId: -1,
    edge: 'right' as CaptionDockResizeEdge,
    startClientX: 0,
    startWidth: 0,
    startX: 0,
    moved: false,
  };

  function commitWidth(nextWidth: number, nextX?: number) {
    const { dockWidth, position } = options;
    dockWidth.value = nextWidth;
    if (nextX !== undefined && position.value) {
      position.value = {
        ...position.value,
        x: nextX,
      };
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!isResizing.value || event.pointerId !== resize.pointerId) {
      return;
    }
    const container = options.containerRef.value;
    if (!container) {
      return;
    }
    const deltaX = event.clientX - resize.startClientX;
    resize.moved ||= Math.abs(deltaX) >= RESIZE_THRESHOLD;
    if (!resize.moved) {
      return;
    }
    event.preventDefault();
    const boxWidth = container.clientWidth;
    const position = options.position.value;

    if (!position) {
      const signed = resize.edge === 'right' ? deltaX : -deltaX;
      commitWidth(clampCaptionDockWidth(resize.startWidth + signed * 2, boxWidth));
      return;
    }

    if (resize.edge === 'right') {
      const maxWidth = boxWidth - CAPTION_DOCK_EDGE_PADDING - resize.startX;
      commitWidth(clampCaptionDockWidth(resize.startWidth + deltaX, boxWidth, maxWidth));
      return;
    }

    const right = resize.startX + resize.startWidth;
    const maxWidth = right - CAPTION_DOCK_EDGE_PADDING;
    const nextWidth = clampCaptionDockWidth(resize.startWidth - deltaX, boxWidth, maxWidth);
    commitWidth(nextWidth, right - nextWidth);
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== resize.pointerId) {
      return;
    }
    isResizing.value = false;
    resize.pointerId = -1;
    try {
      options.dockRef.value?.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer already released on cancel.
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    options.onResizeEnd?.();
  }

  function startResize(event: PointerEvent, edge: CaptionDockResizeEdge) {
    const container = options.containerRef.value;
    const dock = options.dockRef.value;
    if (event.button !== 0 || !container || !dock) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    options.onResizeStart?.();
    const containerRect = container.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    Object.assign(resize, {
      pointerId: event.pointerId,
      edge,
      startClientX: event.clientX,
      startWidth: dock.offsetWidth,
      startX: dockRect.left - containerRect.left,
      moved: false,
    });
    isResizing.value = true;
    dock.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  });

  return {
    isResizing,
    startResize,
  };
}
