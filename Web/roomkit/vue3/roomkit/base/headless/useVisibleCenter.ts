import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
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
  host: Ref<HTMLElement | null | undefined>,
  panel: Ref<HTMLElement | null>,
  open: Ref<boolean>,
) {
  const x = ref(0);
  const y = ref(0);
  let observer: ResizeObserver | null = null;
  let unsubScroll: (() => void) | null = null;
  let frame = 0;

  const update = () => {
    const hostEl = host.value;
    const panelEl = panel.value;
    if (!hostEl || !panelEl || !open.value) return;
    const panelW = panelEl.offsetWidth;
    const panelH = panelEl.offsetHeight;
    if (!panelW || !panelH) return;

    const area = getVisibleArea(hostEl);
    x.value = Math.round(centerAxis(area.x, area.width, area.hostWidth, panelW));
    y.value = Math.round(centerAxis(area.y, area.height, area.hostHeight, panelH));
  };

  const scheduleUpdate = () => {
    if (!open.value || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };

  const observe = (el: HTMLElement | null) => {
    observer?.disconnect();
    observer = null;
    if (!el || !open.value) return;
    observer = new ResizeObserver(scheduleUpdate);
    observer.observe(el);
  };

  const bindScroll = () => {
    unsubScroll?.();
    unsubScroll = null;
    if (!open.value) return;
    unsubScroll = subscribeScrollParents([host.value], scheduleUpdate);
  };

  watch(panel, (el) => observe(el), { immediate: true });

  watch(open, async (value) => {
    if (!value) {
      observer?.disconnect();
      observer = null;
      unsubScroll?.();
      unsubScroll = null;
      return;
    }
    await nextTick();
    observe(panel.value);
    bindScroll();
    update();
  });

  watch(host, () => {
    if (open.value) bindScroll();
  });

  onMounted(() => {
    window.addEventListener('resize', scheduleUpdate);
    if (open.value) {
      observe(panel.value);
      bindScroll();
      update();
    }
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    unsubScroll?.();
    window.removeEventListener('resize', scheduleUpdate);
    if (frame) cancelAnimationFrame(frame);
  });

  return { x, y, update };
}
