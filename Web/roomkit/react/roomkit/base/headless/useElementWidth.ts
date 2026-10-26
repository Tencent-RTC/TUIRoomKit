import { useEffect, useState } from 'react';
import type { ElementRef } from './types';

/** Observes the border-box width of one element; 0 until it mounts. */
export function useElementWidth(target: ElementRef) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    if (target.current) {
      observer.observe(target.current);
      setWidth(target.current.clientWidth);
    }
    return () => observer.disconnect();
  }, [target]);

  return { width };
}
