import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
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
  containerRef: Ref<HTMLElement | undefined>,
  dockRef: Ref<HTMLElement | undefined>,
  options: DockPositionOptions = {},
) {
  const position = ref<CaptionDockPosition | null>(null);
  const bottomGap = ref(DOCK_PADDING);
  let originX = 0;
  let originY = 0;

  const { isDragging } = useDrag(dockRef, {
    handle: event => Boolean(containerRef.value) && (options.handle?.(event) ?? true),
    onStart: () => {
      const container = containerRef.value;
      const dock = dockRef.value;
      if (!container || !dock) {
        return;
      }
      const origin = position.value ?? measureOffset(container, dock);
      originX = origin.x;
      originY = origin.y;
    },
    onDrag: ({ dx, dy }) => {
      const container = containerRef.value;
      const dock = dockRef.value;
      if (!container || !dock) {
        return;
      }
      position.value = applyClamp(container, dock, originX + dx, originY + dy, 'drag');
    },
    onEnd: (moved) => {
      const container = containerRef.value;
      const dock = dockRef.value;
      if (!moved || !position.value || !container || !dock) {
        return;
      }
      position.value = applyClamp(container, dock, position.value.x, position.value.y, 'drag');
    },
  });

  const dockStyle = computed(() => {
    if (!position.value) {
      return undefined;
    }
    if (position.value.pinnedToBottom && !isDragging.value) {
      return {
        left: `${position.value.x}px`,
        top: 'auto',
        bottom: `${position.value.bottomOffset ?? DOCK_PADDING}px`,
      };
    }
    return {
      left: `${position.value.x}px`,
      top: `${position.value.y}px`,
      bottom: 'auto',
    };
  });

  function measureGaps(container: HTMLElement): { top: number; bottom: number } {
    const bottom = DOCK_PADDING + toolbarInset(container);
    bottomGap.value = Math.max(bottomGap.value, bottom);
    return {
      top: DOCK_PADDING,
      bottom,
    };
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
    const pinnedToBottom = source === 'drag'
      ? reachedBottom
      : Boolean(position.value?.pinnedToBottom) || reachedBottom;
    if (!pinnedToBottom) {
      return { x: clamped.x, y: clamped.y, pinnedToBottom: false };
    }
    const bottomOffset = source === 'drag'
      ? bottom
      : Math.max(position.value?.bottomOffset ?? bottom, bottom);
    return {
      x: clamped.x,
      y: Math.max(top, container.clientHeight - dock.offsetHeight - bottomOffset),
      pinnedToBottom: true,
      bottomOffset,
    };
  }

  function syncPosition() {
    const container = containerRef.value;
    const dock = dockRef.value;
    if (!container || !dock) {
      return;
    }
    measureGaps(container);
    if (!position.value) {
      return;
    }
    const next = applyClamp(container, dock, position.value.x, position.value.y, 'sync');
    if (!samePosition(position.value, next)) {
      position.value = next;
    }
  }

  watch(
    [containerRef, dockRef],
    ([container, dock], _previous, onCleanup) => {
      if (!container || !dock) {
        return;
      }
      bottomGap.value = DOCK_PADDING;

      const handleWorldChange = () => {
        if (isDragging.value || options.beforeSync?.() === false) {
          return;
        }
        syncPosition();
      };

      const resizeObserver = new ResizeObserver(handleWorldChange);
      resizeObserver.observe(dock);
      resizeObserver.observe(container);
      const toolbar = container.querySelector<HTMLElement>('.conference-toolbar');
      if (toolbar) {
        resizeObserver.observe(toolbar);
      }

      onCleanup(() => {
        resizeObserver.disconnect();
      });
    },
    { flush: 'post' },
  );

  return {
    dockStyle,
    isDragging,
    position,
    bottomGap,
    syncPosition,
  };
}
