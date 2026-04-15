import { ref } from 'vue';
import type { Ref } from 'vue';

interface UseSubtitlesStateReturn {
  isSubtitlesVisible: Ref<boolean>;
}

/**
 * Module-level shared state for AI subtitles visibility.
 *
 * The state is kept outside the component so that it survives
 * component re-creation caused by the overflow recalculation
 * in CustomWidgetRenderer (visible ↔ overflow transitions
 * destroy and re-mount the AIToolsButton instance).
 */
const isSubtitlesVisible = ref(false);

export function useSubtitlesState(): UseSubtitlesStateReturn {
  return {
    isSubtitlesVisible,
  };
}
