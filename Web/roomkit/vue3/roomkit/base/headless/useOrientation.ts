import { onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';

/** Layout of the RoomKit box. Values stay the CSS `data-orient` tokens. */
export enum Orientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

/** Reads the RoomKit box, not the screen: the kit may be embedded in a part of the page. */
export function resolveOrientation(
  width: number,
  height: number,
  previous: Orientation = Orientation.Portrait,
): Orientation {
  if (width <= 0 || height <= 0) {
    return previous;
  }
  return width > height ? Orientation.Landscape : Orientation.Portrait;
}

/**
 * Layout follows the unrotated box. A phone rotation changes the layout only
 * after the browser viewport itself changes size.
 */
export function useOrientation(target: Ref<HTMLElement | null>) {
  const orientation = ref<Orientation>(Orientation.Portrait);
  let observer: ResizeObserver | null = null;
  let lastWidth = 0;

  function measure(el: HTMLElement) {
    const width = el.clientWidth;
    const height = el.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }
    /* A keyboard only eats height; a rotation always swaps the width. While
       an editable element owns focus, ignore height-only changes (the iOS
       keyboard shrinking the box would read landscape on a portrait phone,
       and the landscape CSS would hide the focused field, blurring it and
       dismissing the keyboard mid-open), but let width changes through so a
       real rotation still switches the layout mid-typing. */
    const rotated = lastWidth > 0 && Math.abs(width - lastWidth) > Math.max(32, lastWidth * 0.2);
    lastWidth = width;
    const active = document.activeElement;
    const editing = active instanceof HTMLElement
      && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (editing && !rotated) {
      return;
    }
    orientation.value = resolveOrientation(width, height, orientation.value);
  }

  function observe(el: HTMLElement | null) {
    observer?.disconnect();
    observer = null;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    observer = new ResizeObserver(() => measure(el));
    observer.observe(el);
    measure(el);
  }

  watch(target, observe, { immediate: true });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  return { orientation };
}
