import { computed, watch } from 'vue';
import type { Ref } from 'vue';
import { useASRToolsState } from '../useASRToolsState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import { useSubtitleIdle } from './useSubtitleIdle';

/**
 * Shared overlay chrome for the PC and H5 caption docks: stopped hint,
 * action visibility, and the idle fade that dismisses the status line.
 */
export function useCaptionDockChrome(isOverlayHeld: Ref<boolean>) {
  const {
    capViewOpen,
    emptyDismissed,
    enableHintVisible,
    hasCaptionMessages,
  } = useSubtitleViewState();
  const { asrOn, asrEmptyVariant } = useASRToolsState();

  const isStoppedHint = computed(
    () => !asrOn.value && asrEmptyVariant.value === 'member-stopped',
  );
  const showTranscriptAction = computed(
    () => asrOn.value && !enableHintVisible.value,
  );
  const showHideAction = computed(
    () => asrOn.value && !enableHintVisible.value && !isStoppedHint.value,
  );
  const hasVisibleContent = computed(
    () => enableHintVisible.value || hasCaptionMessages.value || isOverlayHeld.value || isStoppedHint.value,
  );
  const showDockActions = computed(
    () => asrOn.value && !enableHintVisible.value && !isStoppedHint.value,
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
    showTranscriptAction,
    showHideAction,
    showDockActions,
    isIdle,
    wake,
  };
}
