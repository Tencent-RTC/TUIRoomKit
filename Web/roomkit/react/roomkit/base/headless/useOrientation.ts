import { useEffect, useState } from 'react';
import type { ElementRef } from './types';

export type Orientation = 'portrait' | 'landscape';

/** Reads the RoomKit box, not the screen: the kit may be embedded in a part of the page. */
export function resolveOrientation(width: number, height: number, previous: Orientation = 'portrait'): Orientation {
  if (width <= 0 || height <= 0) {
    return previous;
  }
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Layout follows the unrotated box. A phone rotation changes the layout only
 * after the browser viewport itself changes size.
 */
export function useOrientation(target: ElementRef) {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    const el = target.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    let lastWidth = 0;
    const measure = () => {
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
      setOrientation(previous => resolveOrientation(width, height, previous));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [target]);

  return { orientation };
}
