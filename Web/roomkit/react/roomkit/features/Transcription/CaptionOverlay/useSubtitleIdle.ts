import { useEffect, useRef } from 'react';
import { RealtimeTranscriberEvent, useAITranscriberState } from 'tuikit-atomicx-react/room';
import { SUBTITLE_IDLE_MS } from '../constants';
import { setEnableHintVisible, setIsIdle, useSubtitleViewState } from '../useSubtitleViewState';

/** Shared across dock remounts so a leftover timer cannot kill the next intro. */
let idleTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Dims the caption dock while nobody is speaking, and wakes it on the next
 * transcript or user interaction. Idling only changes opacity.
 */
export function useSubtitleIdle(enabled: boolean, hasVisibleContent: boolean) {
  const { isIdle, enableHintVisible } = useSubtitleViewState();
  const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();
  const enabledRef = useRef(enabled);
  const contentRef = useRef(hasVisibleContent);
  const hintRef = useRef(enableHintVisible);
  const idleRef = useRef(isIdle);
  enabledRef.current = enabled;
  contentRef.current = hasVisibleContent;
  hintRef.current = enableHintVisible;
  idleRef.current = isIdle;

  const clearIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const wake = () => {
    setIsIdle(false);
    clearIdleTimer();
    if (!enabledRef.current) {
      return;
    }
    idleTimer = setTimeout(() => {
      idleTimer = null;
      setIsIdle(true);
      setEnableHintVisible(false);
    }, SUBTITLE_IDLE_MS);
  };

  const syncIdleState = () => {
    if (!enabledRef.current) {
      return;
    }
    if (hintRef.current) {
      wake();
      return;
    }
    if (!contentRef.current) {
      clearIdleTimer();
      setIsIdle(true);
      return;
    }
    if (!idleRef.current && !idleTimer) {
      wake();
    }
  };

  const wakeRef = useRef(wake);
  const syncRef = useRef(syncIdleState);
  wakeRef.current = wake;
  syncRef.current = syncIdleState;

  const handleTranscriberMessage = () => wakeRef.current();

  useEffect(() => {
    if (!enabled) {
      unsubscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, handleTranscriberMessage);
      clearIdleTimer();
      setIsIdle(false);
      return undefined;
    }
    subscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, handleTranscriberMessage);
    syncRef.current();
    return () => {
      unsubscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, handleTranscriberMessage);
    };
  }, [enabled, subscribeEvent, unsubscribeEvent]);

  const contentSeen = useRef<boolean | null>(null);
  useEffect(() => {
    const wasVisible = contentSeen.current;
    contentSeen.current = hasVisibleContent;
    if (!enabled || wasVisible === null) {
      return;
    }
    if (!hasVisibleContent) {
      clearIdleTimer();
      setIsIdle(true);
      return;
    }
    if (!wasVisible) {
      wakeRef.current();
      return;
    }
    syncRef.current();
  }, [enabled, hasVisibleContent]);

  const hintSeen = useRef(false);
  useEffect(() => {
    if (!hintSeen.current) {
      hintSeen.current = true;
      if (enableHintVisible && enabled) {
        wakeRef.current();
      }
      return;
    }
    if (enableHintVisible && enabled) {
      wakeRef.current();
    }
  }, [enableHintVisible, enabled]);

  useEffect(() => () => {
    unsubscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, handleTranscriberMessage);
    clearIdleTimer();
  }, [subscribeEvent, unsubscribeEvent]);

  return { isIdle, wake };
}
