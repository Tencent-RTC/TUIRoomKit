import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { conference as conferenceImpl } from '../adapter/conference';
import type { IConference } from '../adapter/type';

// The concrete `Conference` class is being ported from Vue piece-by-piece; cast
// it through `IConference` so this hook can rely on the full public surface
// (`getFeatureConfig`, etc.) once the adapter migration finishes.
const conference = conferenceImpl as unknown as IConference;

const DEFAULT_AUTO_HIDE_DELAY = 5000;

export function useRoomToolbar(
  containerRef: RefObject<HTMLElement | null>,
  mouseMoveThrottle = 1000,
) {
  // `conference.getFeatureConfig` is not (yet) reactive, but we mirror Vue's
  // `computed()` calls with `useMemo` so future-readers see the same intent and
  // we get cheap memoisation if the config helper ever stabilises its result.
  const toolbarConfig = useMemo(() => conference.getFeatureConfig('toolbar'), []);
  const alwaysShow = useMemo(() => toolbarConfig?.alwaysShow === true, [toolbarConfig]);
  const autoHideDelay = useMemo(
    () => toolbarConfig?.autoHideDelay ?? DEFAULT_AUTO_HIDE_DELAY,
    [toolbarConfig],
  );

  const [showToolbar, setShowToolbar] = useState(true);

  // Timer / throttle bookkeeping lives in refs so updates don't trigger
  // re-renders. `setTimeout` returns `number` in browsers.
  const hideTimerRef = useRef<number | null>(null);
  const throttleTimerRef = useRef<number | null>(null);
  const isThrottledRef = useRef(false);

  // Keep latest values for handlers attached to the DOM (handlers are bound
  // once per `containerRef` instance in the effect below).
  const alwaysShowRef = useRef(alwaysShow);
  alwaysShowRef.current = alwaysShow;
  const autoHideDelayRef = useRef(autoHideDelay);
  autoHideDelayRef.current = autoHideDelay;
  const mouseMoveThrottleRef = useRef(mouseMoveThrottle);
  mouseMoveThrottleRef.current = mouseMoveThrottle;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const clearThrottleTimer = useCallback(() => {
    if (throttleTimerRef.current !== null) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
  }, []);

  const setHideTimer = useCallback(() => {
    if (alwaysShowRef.current) {
      return;
    }
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setShowToolbar(false);
    }, autoHideDelayRef.current);
  }, [clearHideTimer]);

  // React to alwaysShow toggling: when switching to always-show, clear timers
  // and show the toolbar; otherwise (re)start the auto-hide timer. Mirrors
  // Vue's `watch(alwaysShow, ...)`.
  useEffect(() => {
    if (alwaysShow) {
      clearHideTimer();
      clearThrottleTimer();
      setShowToolbar(true);
    } else {
      setHideTimer();
    }
  }, [alwaysShow, clearHideTimer, clearThrottleTimer, setHideTimer]);

  // Bind mouse listeners on mount; rebind whenever the container ref points to
  // a different element. Cleanup detaches listeners and clears all timers.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const handleMouseEnter = () => {
      setShowToolbar(true);
      setHideTimer();
    };

    const handleMouseMoveThrottled = () => {
      if (isThrottledRef.current) {
        return;
      }

      setShowToolbar(true);
      setHideTimer();

      isThrottledRef.current = true;
      throttleTimerRef.current = window.setTimeout(() => {
        isThrottledRef.current = false;
      }, mouseMoveThrottleRef.current);
    };

    const handleMouseLeave = () => {
      if (alwaysShowRef.current) {
        return;
      }

      clearHideTimer();
      clearThrottleTimer();
      isThrottledRef.current = false;
      setShowToolbar(false);
    };

    const handleClick = () => {
      if (alwaysShowRef.current) {
        return;
      }
      setShowToolbar(true);
      setHideTimer();
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mousemove', handleMouseMoveThrottled);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    if (!alwaysShowRef.current) {
      setHideTimer();
    }

    return () => {
      clearHideTimer();
      clearThrottleTimer();
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mousemove', handleMouseMoveThrottled);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleClick);
    };
  }, [
    containerRef,
    clearHideTimer,
    clearThrottleTimer,
    setHideTimer,
  ]);

  return {
    showToolbar,
  };
}
