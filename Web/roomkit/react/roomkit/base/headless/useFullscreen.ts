import { useCallback, useEffect, useState } from 'react';
import type { ElementRef } from './types';

/** Tracks and toggles the Fullscreen API for one element. */
export function useFullscreen(target: ElementRef) {
  const [fullscreen, setFullscreen] = useState(false);

  const toggle = useCallback(async () => {
    if (document.fullscreenElement === target.current) {
      await document.exitFullscreen?.();
      return;
    }
    await target.current?.requestFullscreen?.();
  }, [target]);

  useEffect(() => {
    function sync() {
      setFullscreen(document.fullscreenElement === target.current);
    }
    document.addEventListener('fullscreenchange', sync);
    sync();
    return () => {
      document.removeEventListener('fullscreenchange', sync);
    };
  }, [target]);

  return {
    fullscreen,
    toggle,
  };
}
