import { computed, watch } from 'vue';
import type { Ref } from 'vue';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import { useSubtitleIdle } from './useSubtitleIdle';

/** Shared overlay chrome: stopped hint, action visibility, and the idle fade. */
export function useCaptionDockChrome(isOverlayHeld: Ref<boolean>) {
  const {
    capViewOpen,
    emptyDismissed,
    enableHintVisible,
    hasCaptionMessages,
  } = useSubtitleViewState();
  const { asrOn, isMemberStopped } = useASRState();

  const isStoppedHint = computed(
    () => !asrOn.value && isMemberStopped.value,
  );
  const hasVisibleContent = computed(
    () => enableHintVisible.value || hasCaptionMessages.value || isOverlayHeld.value || isStoppedHint.value,
  );
  const showDockActions = computed(
    () => asrOn.value && !enableHintVisible.value,
  );

  const { isIdle, wake } = useSubtitleIdle(
    computed(() => (asrOn.value || isStoppedHint.value) && capViewOpen.value && !isOverlayHeld.value),
    hasVisibleContent,
  );

  watch(isStoppedHint, (stopped) => {
    if (stopped) {
      wake();
    }
  });

  watch(isIdle, (idle) => {
    if (!idle || !isStoppedHint.value) {
      return;
    }
    window.setTimeout(() => {
      if (isIdle.value && isStoppedHint.value) {
        emptyDismissed.value = true;
      }
    }, 200);
  });

  return {
    isStoppedHint,
    showDockActions,
    isIdle,
    wake,
  };
}
