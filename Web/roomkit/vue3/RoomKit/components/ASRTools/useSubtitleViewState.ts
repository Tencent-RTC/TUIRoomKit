import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { DEFAULT_CAPTION_FONT_SIZE, type CaptionFontSize } from './constants';

export interface CaptionDockPosition {
  x: number;
  y: number;
  /** Restored after remount so a bottom-pinned dock keeps growing upward. */
  pinnedToBottom?: boolean;
  /** Sticky gap from the container bottom; not reduced when the toolbar hides. */
  bottomOffset?: number;
}

export interface CaptionDockFrozenBox {
  /** Visual center X in `.room-container` coordinates; paired with translateX(-50%). */
  centerX: number;
  width: number;
}

interface UseSubtitleViewStateReturn {
  capViewOpen: Ref<boolean>;
  recViewOpen: Ref<boolean>;
  emptyDismissed: Ref<boolean>;
  showTrans: Ref<boolean>;
  fontSize: Ref<CaptionFontSize>;
  dockPosition: Ref<CaptionDockPosition | null>;
  /** User-chosen PC overlay width in px; `null` keeps the CSS 50% default. */
  dockWidth: Ref<number | null>;
  dockFrozenBox: Ref<CaptionDockFrozenBox | null>;
  isIdle: Ref<boolean>;
  enableHintVisible: Ref<boolean>;
  hasCaptionMessages: Ref<boolean>;
  presentCaptionHint: () => void;
  hideCaptionOverlay: () => void;
}

/**
 * Local, per-participant view state for AI captions.
 *
 * Everything here is deliberately separate from the room-wide transcription
 * state in `useASRToolsState`: the owner controls whether transcription runs,
 * while each participant independently controls what they see.
 *
 * The refs live at module level so that they survive the component re-creation
 * caused by the overflow recalculation in CustomWidgetRenderer (visible <->
 * overflow transitions destroy and re-mount the ASR entry button).
 */
const capViewOpen = ref(false);
/** H5 records sheet. PC derives the same flag from the side-panel widget id. */
const recViewOpen = ref(false);
const emptyDismissed = ref(false);
/** Local bilingual overlay; off by default so captions start as source-only. */
const showTrans = ref(false);
const fontSize = ref<CaptionFontSize>(DEFAULT_CAPTION_FONT_SIZE);
const dockPosition = ref<CaptionDockPosition | null>(null);
const dockWidth = ref<number | null>(null);
/**
 * Pixel center/width captured before the records panel shrinks `.room-container`.
 * Lives at module level so a toolbar-overflow remount does not lose it and
 * re-center the dock under the cursor.
 */
const dockFrozenBox = ref<CaptionDockFrozenBox | null>(null);
const isIdle = ref(false);
/** One-shot "captions are on" hint, shown only when the user opens the overlay. */
const enableHintVisible = ref(false);
/** True while at least one speaker line is still on the overlay. */
const hasCaptionMessages = ref(false);

const resetSubtitleViewState = () => {
  capViewOpen.value = false;
  recViewOpen.value = false;
  emptyDismissed.value = false;
  showTrans.value = false;
  fontSize.value = DEFAULT_CAPTION_FONT_SIZE;
  dockPosition.value = null;
  dockWidth.value = null;
  dockFrozenBox.value = null;
  isIdle.value = false;
  enableHintVisible.value = false;
  hasCaptionMessages.value = false;
};

const { t } = useUIKit();
const { currentRoom } = useRoomState();

/**
 * Show the one-shot "captions are on" intro. Used both when the overlay first
 * opens and when the user clicks to show it again after it has faded idle.
 */
const presentCaptionHint = () => {
  // Drop leftover idle from a previous start/stop cycle before the dock
  // mounts, otherwise the intro is either invisible or killed by a stale timer.
  isIdle.value = false;
  enableHintVisible.value = true;
  capViewOpen.value = true;
  TUIToast.info({ message: t('ASRTools.CaptionVisibleOnlyToSelf') });
};

const hideCaptionOverlay = () => {
  if (!capViewOpen.value) {
    return;
  }
  capViewOpen.value = false;
  TUIToast.info({ message: t('ASRTools.CaptionClosed') });
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
    recViewOpen,
    emptyDismissed,
    showTrans,
    fontSize,
    dockPosition,
    dockWidth,
    dockFrozenBox,
    isIdle,
    enableHintVisible,
    hasCaptionMessages,
    presentCaptionHint,
    hideCaptionOverlay,
  };
}
