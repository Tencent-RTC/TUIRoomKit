import { computed, onBeforeUnmount, ref, type Ref } from 'vue';

const DOCK_PADDING = 16;
const DRAG_THRESHOLD = 4;

export function useDraggableDock(
  containerRef: Ref<HTMLElement | undefined>,
  dockRef: Ref<HTMLElement | undefined>,
) {
  const isDragging = ref(false);
  const position = ref<{ x: number; y: number } | null>(null);
  let suppressNextClick = false;
  const drag = {
    pointerId: -1,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    suppressClickOnDrag: false,
  };

  const style = computed(() => position.value
    ? {
        left: `${position.value.x}px`,
        top: `${position.value.y}px`,
        bottom: 'auto',
      }
    : undefined);

  function clamp(x: number, y: number) {
    const container = containerRef.value;
    const dock = dockRef.value;
    if (!container || !dock) {
      return { x, y };
    }
    return {
      x: Math.min(
        Math.max(DOCK_PADDING, x),
        Math.max(DOCK_PADDING, container.clientWidth - dock.offsetWidth - DOCK_PADDING),
      ),
      y: Math.min(
        Math.max(DOCK_PADDING, y),
        Math.max(DOCK_PADDING, container.clientHeight - dock.offsetHeight - DOCK_PADDING),
      ),
    };
  }

  function syncPosition() {
    if (position.value) {
      position.value = clamp(position.value.x, position.value.y);
    }
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
      position.value = clamp(drag.startX + deltaX, drag.startY + deltaY);
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== drag.pointerId) {
      return;
    }
    suppressNextClick = drag.moved && drag.suppressClickOnDrag;
    isDragging.value = false;
    drag.pointerId = -1;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
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
    });
    isDragging.value = true;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  function consumeSuppressedClick() {
    const suppressed = suppressNextClick;
    suppressNextClick = false;
    return suppressed;
  }

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
