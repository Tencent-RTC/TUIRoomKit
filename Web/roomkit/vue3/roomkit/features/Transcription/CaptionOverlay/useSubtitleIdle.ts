import { onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import { RealtimeTranscriberEvent, useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import { SUBTITLE_IDLE_MS } from '../constants';
import { useSubtitleViewState } from '../useSubtitleViewState';

/** Shared across dock remounts so a leftover timer cannot kill the next intro. */
let idleTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Dims the caption dock while nobody is speaking, and wakes it on the next
 * transcript or user interaction. Idling only changes opacity.
 */
export function useSubtitleIdle(enabled: Ref<boolean>, hasVisibleContent: Ref<boolean>) {
  const { isIdle, enableHintVisible } = useSubtitleViewState();
  const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();

  const clearIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const wake = () => {
    isIdle.value = false;
    clearIdleTimer();
    if (enabled.value) {
      idleTimer = setTimeout(() => {
        idleTimer = null;
        isIdle.value = true;
        enableHintVisible.value = false;
      }, SUBTITLE_IDLE_MS);
    }
  };

  const syncIdleState = () => {
    if (enableHintVisible.value) {
      wake();
      return;
    }
    if (!hasVisibleContent.value) {
      clearIdleTimer();
      isIdle.value = true;
      return;
    }
    if (!isIdle.value && !idleTimer) {
      wake();
    }
  };

  watch(
    enabled,
    (on) => {
      if (on) {
        subscribeEvent(
          RealtimeTranscriberEvent.onReceiveTranscriberMessage,
          wake,
        );
        syncIdleState();
        return;
      }
      unsubscribeEvent(
        RealtimeTranscriberEvent.onReceiveTranscriberMessage,
        wake,
      );
      clearIdleTimer();
      isIdle.value = false;
    },
    { immediate: true },
  );

  watch(hasVisibleContent, (visible, wasVisible) => {
    if (!enabled.value) {
      return;
    }
    if (!visible) {
      clearIdleTimer();
      isIdle.value = true;
      return;
    }
    if (!wasVisible) {
      wake();
      return;
    }
    syncIdleState();
  });

  watch(enableHintVisible, (show) => {
    if (show && enabled.value) {
      wake();
    }
  }, { flush: 'sync', immediate: true });

  onUnmounted(() => {
    unsubscribeEvent(
      RealtimeTranscriberEvent.onReceiveTranscriberMessage,
      wake,
    );
    clearIdleTimer();
  });

  return { isIdle, wake };
}
