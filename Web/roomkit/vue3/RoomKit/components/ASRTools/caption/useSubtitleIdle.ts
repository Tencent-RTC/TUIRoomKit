import { onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import { RealtimeTranscriberEvent, useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import { SUBTITLE_IDLE_MS } from '../constants';
import { useSubtitleViewState } from '../useSubtitleViewState';

/**
 * Shared across dock remounts. Opening the record panel recalculates toolbar
 * overflow, which destroys and recreates the ASR button (and its teleported
 * dock). A per-instance timer would restart and flash the faded captions back.
 */
let idleTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Dims the caption dock while nobody is speaking so it stops competing with the
 * video for attention, and wakes it on the next transcript or user interaction.
 *
 * An empty overlay (no hint, no speaker lines) idles immediately. The one-shot
 * enable hint still uses the idle delay so it can be read after the user opens
 * captions. Idling only changes opacity; it never touches `capViewOpen`.
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
        // The intro has been shown; an empty overlay must not bring it back.
        enableHintVisible.value = false;
      }, SUBTITLE_IDLE_MS);
    }
  };

  const syncIdleState = () => {
    if (!enabled.value) {
      return;
    }
    if (enableHintVisible.value) {
      // A new intro must restart the idle clock even if a previous cycle left
      // the dock idle or a stale timer still running.
      wake();
      return;
    }
    if (!hasVisibleContent.value) {
      clearIdleTimer();
      isIdle.value = true;
      return;
    }
    // Remount while captions are already running: keep the current idle
    // state instead of waking. Only arm idle when nothing is in flight.
    if (!isIdle.value && !idleTimer) {
      wake();
    }
  };

  const handleTranscriberMessage = () => wake();

  watch(
    enabled,
    (on) => {
      if (on) {
        subscribeEvent(
          RealtimeTranscriberEvent.onReceiveTranscriberMessage,
          handleTranscriberMessage,
        );
        syncIdleState();
        return;
      }
      unsubscribeEvent(
        RealtimeTranscriberEvent.onReceiveTranscriberMessage,
        handleTranscriberMessage,
      );
      clearIdleTimer();
      isIdle.value = false;
    },
    { immediate: true },
  );

  // Hint or speaker lines just appeared: always bring the dock back. The remount
  // skip above must not apply here — an empty overlay idles immediately, and
  // that idle must not swallow the intro that lands a tick later.
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
      handleTranscriberMessage,
    );
    // The timer is module-level so a leftover callback would still fire after
    // this dock is gone and kill the next intro a moment after it appears.
    clearIdleTimer();
  });

  return { isIdle, wake };
}
