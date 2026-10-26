import { getPlatform } from '@tencentcloud/universal-api';
import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { TUIToast, t } from '../../base';
import { DEFAULT_CAPTION_FONT_SIZE } from './constants';
import type { CaptionFontSize } from './constants';

export interface CaptionDockPosition {
  x: number;
  y: number;
  /** Restored after remount so a bottom-pinned dock keeps growing upward. */
  pinnedToBottom?: boolean;
  /** Sticky gap from the stage bottom; not reduced when the toolbar hides. */
  bottomOffset?: number;
}

interface UseSubtitleViewStateReturn {
  capViewOpen: Ref<boolean>;
  emptyDismissed: Ref<boolean>;
  showTrans: Ref<boolean>;
  fontSize: Ref<CaptionFontSize>;
  dockPosition: Ref<CaptionDockPosition | null>;
  /** User-chosen overlay width in px; `null` keeps the CSS 50% default. */
  dockWidth: Ref<number | null>;
  isIdle: Ref<boolean>;
  enableHintVisible: Ref<boolean>;
  hasCaptionMessages: Ref<boolean>;
  presentCaptionHint: () => void;
  hideCaptionOverlay: () => void;
  resetCaptionForNewSession: () => void;
}

/**
 * Local, per-participant view state for AI captions.
 *
 * The owner controls whether transcription runs. Each participant independently
 * controls what they see. Refs live at module level so a toolbar overflow
 * remount does not drop an open overlay.
 */
const capViewOpen = ref(false);
const emptyDismissed = ref(false);
/** Local bilingual overlay; off by default so captions start as source-only. */
const showTrans = ref(false);
const fontSize = ref<CaptionFontSize>(DEFAULT_CAPTION_FONT_SIZE);
const dockPosition = ref<CaptionDockPosition | null>(null);
const dockWidth = ref<number | null>(null);
const isIdle = ref(false);
/** One-shot "captions are on" hint, shown only when the user opens the overlay. */
const enableHintVisible = ref(false);
/** True while at least one speaker line is still on the overlay. */
const hasCaptionMessages = ref(false);

const resetSubtitleViewState = () => {
  capViewOpen.value = false;
  emptyDismissed.value = false;
  showTrans.value = false;
  fontSize.value = DEFAULT_CAPTION_FONT_SIZE;
  dockPosition.value = null;
  dockWidth.value = null;
  isIdle.value = false;
  enableHintVisible.value = false;
  hasCaptionMessages.value = false;
};

const { currentRoom } = useRoomState();
const isPC = getPlatform() === 'pc';

/**
 * Show the one-shot "captions are on" intro. Used both when the overlay first
 * opens and when the user clicks to show it again after it has faded idle.
 */
const presentCaptionHint = () => {
  isIdle.value = false;
  enableHintVisible.value = true;
  capViewOpen.value = true;
  if (isPC) {
    TUIToast.info({ message: t('ASRTools.CaptionVisibleOnlyToSelf') });
  }
};

const hideCaptionOverlay = () => {
  if (!capViewOpen.value) {
    return;
  }
  capViewOpen.value = false;
  if (isPC) {
    TUIToast.info({ message: t('ASRTools.CaptionClosed') });
  }
};

/**
 * Close the caption window without any user-visible side effects (no toast).
 * Called when the owner starts a NEW transcription session after a real stop:
 * the previous session's opt-in must not carry over, the member re-opens the
 * window manually. Personal preferences (font size, bilingual) are kept.
 */
const resetCaptionForNewSession = () => {
  capViewOpen.value = false;
};

watch(capViewOpen, (open) => {
  if (!open) {
    enableHintVisible.value = false;
    hasCaptionMessages.value = false;
    isIdle.value = false;
  }
}, { flush: 'sync' });

watch(
  () => currentRoom.value?.roomId,
  (roomId, previousRoomId) => {
    if (roomId !== previousRoomId) {
      resetSubtitleViewState();
    }
  },
);

export function useSubtitleViewState(): UseSubtitleViewStateReturn {
  return {
    capViewOpen,
    emptyDismissed,
    showTrans,
    fontSize,
    dockPosition,
    dockWidth,
    isIdle,
    enableHintVisible,
    hasCaptionMessages,
    presentCaptionHint,
    hideCaptionOverlay,
    resetCaptionForNewSession,
  };
}
