import { useEffect, useRef } from 'react';
import { useASRState } from '../useASRState';
import { setEmptyDismissed, useSubtitleViewState } from '../useSubtitleViewState';
import { useSubtitleIdle } from './useSubtitleIdle';

/** Shared overlay chrome: stopped hint, action visibility, and the idle fade. */
export function useCaptionDockChrome(isOverlayHeld: boolean) {
  const {
    capViewOpen,
    enableHintVisible,
    hasCaptionMessages,
  } = useSubtitleViewState();
  const { asrOn, isMemberStopped } = useASRState();

  const isStoppedHint = !asrOn && isMemberStopped;
  const hasVisibleContent = enableHintVisible || hasCaptionMessages || isOverlayHeld || isStoppedHint;
  const showDockActions = asrOn && !enableHintVisible;

  const enabled = (asrOn || isStoppedHint) && capViewOpen && !isOverlayHeld;
  const { isIdle, wake } = useSubtitleIdle(enabled, hasVisibleContent);

  const wakeRef = useRef(wake);
  wakeRef.current = wake;
  const stoppedSeen = useRef(false);
  useEffect(() => {
    if (!stoppedSeen.current) {
      stoppedSeen.current = true;
      return;
    }
    if (isStoppedHint) {
      wakeRef.current();
    }
  }, [isStoppedHint]);

  useEffect(() => {
    if (!isIdle || !isStoppedHint) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      if (isIdle && isStoppedHint) {
        setEmptyDismissed(true);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [isIdle, isStoppedHint]);

  return {
    isStoppedHint,
    showDockActions,
    isIdle,
    wake,
  };
}
