import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';

const DOCK_PADDING = 16;
const DRAG_THRESHOLD = 4;
const PIN_BOTTOM_EPSILON = 0.5;

export interface DraggableDockOptions {
  /**
   * Overlay chrome (e.g. `.header`) whose visible overlap with the
   * container is reserved at the top while dragging.
   */
  topChromeSelector?: string;
  /**
   * Overlay chrome (e.g. `.control-bar`) whose visible overlap with the
   * container is reserved at the bottom while dragging.
   */
  bottomChromeSelector?: string;
}

export interface DraggableDockPosition {
  x: number;
  y: number;
  /** When true, CSS uses `bottom` so height grows up, away from the chrome. */
  pinnedToBottom?: boolean;
  /**
   * Gap from the container bottom while pinned. Raised to clear visible chrome,
   * but never lowered when the toolbar auto-hides.
   */
  bottomOffset?: number;
}

export interface DockClampInput {
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
  dockWidth: number;
  dockHeight: number;
  topInset?: number;
  bottomInset: number;
  padding?: number;
}

export interface DockClampResult {
  x: number;
  y: number;
  pinnedToBottom: boolean;
  bottomOffset: number;
}

export function clampDockBox(input: DockClampInput): DockClampResult {
  const padding = input.padding ?? DOCK_PADDING;
  const topOffset = padding + Math.max(0, input.topInset ?? 0);
  const bottomOffset = padding + Math.max(0, input.bottomInset);
  const maxX = Math.max(padding, input.containerWidth - input.dockWidth - padding);
  const maxY = Math.max(topOffset, input.containerHeight - input.dockHeight - bottomOffset);
  const x = Math.min(Math.max(padding, input.x), maxX);
  const y = Math.min(Math.max(topOffset, input.y), maxY);
  return {
    x,
    y,
    pinnedToBottom: y >= maxY - PIN_BOTTOM_EPSILON,
    bottomOffset,
  };
}

/** Drag tracks live chrome; sync may raise the gap but never follows a hide. */
export function resolveStickyBottomOffset(
  requiredOffset: number,
  storedOffset: number | undefined,
  source: 'drag' | 'sync',
): number {
  if (source === 'drag') {
    return requiredOffset;
  }
  return Math.max(storedOffset ?? requiredOffset, requiredOffset);
}

function getChromeInset(
  container: HTMLElement,
  selector: string | undefined,
): number {
  if (!selector) {
    return 0;
  }
  const chrome = container
    .closest('.room-page')
    ?.querySelector<HTMLElement>(selector);
  if (!chrome || chrome.classList.contains('toolbar-hidden')) {
    return 0;
  }
  const containerRect = container.getBoundingClientRect();
  const chromeRect = chrome.getBoundingClientRect();
  const overlapsHorizontally = containerRect.left < chromeRect.right
    && containerRect.right > chromeRect.left;
  const overlapsVertically = containerRect.top < chromeRect.bottom
    && containerRect.bottom > chromeRect.top;
  if (!overlapsHorizontally || !overlapsVertically) {
    return 0;
  }
  return Math.max(
    0,
    Math.min(containerRect.bottom, chromeRect.bottom)
    - Math.max(containerRect.top, chromeRect.top),
  );
}

function sameDockPosition(
  a: DraggableDockPosition,
  b: DraggableDockPosition,
): boolean {
  return a.x === b.x
    && a.y === b.y
    && Boolean(a.pinnedToBottom) === Boolean(b.pinnedToBottom)
    && a.bottomOffset === b.bottomOffset;
}

export function useDraggableDock(
  containerRef: Ref<HTMLElement | undefined>,
  dockRef: Ref<HTMLElement | undefined>,
  options?: DraggableDockOptions,
) {
  const isDragging = ref(false);
  const position = ref<DraggableDockPosition | null>(null);
  const bottomInset = ref(0);
  let suppressNextClick = false;
  const drag = {
    pointerId: -1,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    suppressClickOnDrag: false,
    committed: false,
  };

  const style = computed(() => {
    if (!position.value) {
      return undefined;
    }
    if (position.value.pinnedToBottom && !isDragging.value) {
      return {
        left: `${position.value.x}px`,
        top: 'auto',
        bottom: `${position.value.bottomOffset ?? (DOCK_PADDING + bottomInset.value)}px`,
      };
    }
    return {
      left: `${position.value.x}px`,
      top: `${position.value.y}px`,
      bottom: 'auto',
    };
  });

  function applyClamp(
    x: number,
    y: number,
    source: 'drag' | 'sync',
  ): DraggableDockPosition {
    const container = containerRef.value;
    const dock = dockRef.value;
    if (!container || !dock) {
      return {
        x,
        y,
        pinnedToBottom: source === 'sync' ? position.value?.pinnedToBottom : false,
        bottomOffset: source === 'sync' ? position.value?.bottomOffset : undefined,
      };
    }
    const topInset = getChromeInset(container, options?.topChromeSelector);
    const inset = getChromeInset(container, options?.bottomChromeSelector);
    bottomInset.value = inset;
    const input: DockClampInput = {
      x,
      y,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
      dockWidth: dock.offsetWidth,
      dockHeight: dock.offsetHeight,
      topInset,
      bottomInset: inset,
    };
    const result = clampDockBox(input);
    const pinnedToBottom = source === 'drag'
      ? result.pinnedToBottom
      : Boolean(position.value?.pinnedToBottom) || result.pinnedToBottom;
    if (!pinnedToBottom) {
      return {
        x: result.x,
        y: result.y,
        pinnedToBottom: false,
      };
    }
    const bottomOffset = resolveStickyBottomOffset(
      result.bottomOffset,
      position.value?.bottomOffset,
      source,
    );
    const minY = DOCK_PADDING + Math.max(0, topInset);
    const nextY = Math.max(
      minY,
      input.containerHeight - input.dockHeight - bottomOffset,
    );
    return {
      x: result.x,
      y: nextY,
      pinnedToBottom: true,
      bottomOffset,
    };
  }

  function syncPosition() {
    if (!position.value) {
      return;
    }
    const next = applyClamp(position.value.x, position.value.y, 'sync');
    if (!sameDockPosition(position.value, next)) {
      position.value = next;
    }
  }

  function commitDrag(event: PointerEvent) {
    if (drag.committed) {
      return;
    }
    drag.committed = true;
    // Lock CSS-centered docks (`left: 50%` + translateX) to pixels before the
    // first move. Otherwise dropping the translate animates and the bar jumps.
    if (!position.value) {
      position.value = applyClamp(drag.startX, drag.startY, 'drag');
    }
    // Capture so touchmove keeps reporting after the finger leaves the dock.
    dockRef.value?.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging.value || event.pointerId !== drag.pointerId) {
      return;
    }
    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;
    drag.moved ||= Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD;
    if (drag.moved) {
      event.preventDefault();
      commitDrag(event);
      position.value = applyClamp(drag.startX + deltaX, drag.startY + deltaY, 'drag');
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== drag.pointerId) {
      return;
    }
    suppressNextClick = drag.moved && drag.suppressClickOnDrag;
    isDragging.value = false;
    drag.pointerId = -1;
    try {
      dockRef.value?.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer already released on cancel.
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    if (position.value) {
      position.value = applyClamp(position.value.x, position.value.y, 'drag');
    }
  }

  function startDragging(event: PointerEvent, suppressClickOnDrag = false) {
    const container = containerRef.value;
    const dock = dockRef.value;
    if (event.button !== 0 || !container || !dock) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    Object.assign(drag, {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: dockRect.left - containerRect.left,
      startY: dockRect.top - containerRect.top,
      moved: false,
      suppressClickOnDrag,
      committed: false,
    });
    isDragging.value = true;
    // Clickable docks pass suppressClickOnDrag: capture/lock on pointerdown
    // retargets pointerup, so the child button never receives click.
    if (!suppressClickOnDrag) {
      commitDrag(event);
    }
    // Not passive: touch dragging must be able to preventDefault and stop scroll.
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  function consumeSuppressedClick() {
    const suppressed = suppressNextClick;
    suppressNextClick = false;
    return suppressed;
  }

  watch(
    [containerRef, dockRef],
    ([container, dock], _prev, onCleanup) => {
      if (!container || !dock || typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => {
        if (isDragging.value) {
          return;
        }
        syncPosition();
      });
      observer.observe(dock);
      onCleanup(() => observer.disconnect());
    },
    { flush: 'post' },
  );

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  });

  return {
    dockStyle: style,
    isDragging,
    position,
    startDragging,
    syncPosition,
    consumeSuppressedClick,
  };
}
