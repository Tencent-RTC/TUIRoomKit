import { inject, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue';
import { OVERLAY_CONTEXT_KEY } from '../tokens';
import type { Placement } from '../tokens';
import type { UseFloatingOptions } from './types';
import { getVisibleArea, subscribeScrollParents } from './visibleArea';

interface Point { x: number; y: number }

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

export function useFloating(options: UseFloatingOptions) {
  const ctx = inject(OVERLAY_CONTEXT_KEY, null);
  const x = ref(0);
  const y = ref(0);
  const placement = ref<Placement>(unref(options.placement) || 'bottom');
  const maxHeight = ref<number | null>(null);
  const arrowX = ref(0);
  const arrowY = ref(0);
  let ro: ResizeObserver | null = null;
  let unsubScroll: (() => void) | null = null;
  let frame = 0;
  let resizeWindow: Window | null = null;

  const isEnabled = () => options.enabled?.value ?? true;

  const getBoundary = () => (
    options.boundary?.value
    || ctx?.host.value
    || ctx?.root.value
    || options.reference.value?.closest('.rk-root') as HTMLElement | null
  );

  const getBoundaryWindow = (boundary = getBoundary()) => (
    boundary?.ownerDocument.defaultView ?? window
  );

  const update = () => {
    if (!isEnabled()) return;
    const reference = options.reference.value;
    const floating = options.floating.value;
    const boundary = getBoundary();
    if (!reference || !floating || !boundary) return;

    const gap = unref(options.offset) ?? 4;
    const hostRect = boundary.getBoundingClientRect();
    const refRect = reference.getBoundingClientRect();
    const floatW = floating.offsetWidth;
    let floatH = floating.offsetHeight;
    if (!floatW || !floatH) return;

    let { side, align } = splitPlacement(unref(options.placement) || 'bottom');

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
      } else {
        if (align === 'start') nextY = refRect.top - hostRect.top;
        else if (align === 'end') nextY = refRect.bottom - hostRect.top - floatH;
        else nextY = refRect.top - hostRect.top + (refRect.height - floatH) / 2;
      }
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
    if (options.flip !== false) {
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
    if (options.constrainHeight) {
      const room = Math.floor(roomFor(side));
      maxHeight.value = room > 0 ? room : null;
      if (room > 0 && floatH > room) {
        floatH = room;
        point = place(side);
      }
    }

    if (options.shift !== false) {
      const minX = area.x + EDGE_MARGIN;
      const minY = area.y + EDGE_MARGIN;
      const maxX = area.x + area.width - floatW - EDGE_MARGIN;
      const maxY = area.y + area.height - floatH - EDGE_MARGIN;
      point.x = Math.min(Math.max(minX, point.x), Math.max(minX, maxX));
      point.y = Math.min(Math.max(minY, point.y), Math.max(minY, maxY));
    }

    x.value = Math.round(point.x);
    y.value = Math.round(point.y);
    placement.value = (align === 'center' ? side : `${side}-${align}`) as Placement;

    if (options.arrow?.value) {
      if (side === 'top' || side === 'bottom') {
        arrowX.value = Math.round(refRect.left - hostRect.left + refRect.width / 2 - point.x);
        arrowY.value = 0;
      } else {
        arrowX.value = 0;
        arrowY.value = Math.round(refRect.top - hostRect.top + refRect.height / 2 - point.y);
      }
    }
  };

  const scheduleUpdate = () => {
    if (!isEnabled() || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };

  const observe = () => {
    ro?.disconnect();
    ro = null;
    if (!isEnabled()) return;
    ro = new ResizeObserver(scheduleUpdate);
    if (options.reference.value instanceof Element) ro.observe(options.reference.value);
    if (options.floating.value) ro.observe(options.floating.value);
    const boundary = getBoundary();
    if (boundary) ro.observe(boundary);
  };

  const bindScroll = () => {
    unsubScroll?.();
    unsubScroll = null;
    if (!isEnabled()) return;
    unsubScroll = subscribeScrollParents(
      [options.reference.value, getBoundary()],
      scheduleUpdate,
    );
  };

  const bindResize = () => {
    const nextWindow = getBoundaryWindow();
    if (resizeWindow === nextWindow) {
      return;
    }
    resizeWindow?.removeEventListener('resize', scheduleUpdate);
    resizeWindow = nextWindow;
    resizeWindow.addEventListener('resize', scheduleUpdate);
  };

  onMounted(() => {
    bindResize();
    observe();
    bindScroll();
    update();
  });

  watch(
    [
      options.reference,
      options.floating,
      () => options.boundary?.value,
      () => unref(options.placement),
      () => unref(options.offset),
      () => options.enabled?.value ?? true,
    ],
    () => {
      bindResize();
      observe();
      bindScroll();
      update();
    },
  );

  onBeforeUnmount(() => {
    ro?.disconnect();
    unsubScroll?.();
    resizeWindow?.removeEventListener('resize', scheduleUpdate);
    if (frame) cancelAnimationFrame(frame);
  });

  return { x, y, placement, maxHeight, arrowX, arrowY, update };
}
