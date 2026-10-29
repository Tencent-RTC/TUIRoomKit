import { useEffect, useSyncExternalStore } from 'react';
import { getPlatform } from '@tencentcloud/universal-api';
import { useRoomState } from 'tuikit-atomicx-react/room';
import { TUIToast } from '../../base';
import { t } from '../../i18n';
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

interface SubtitleViewState {
  capViewOpen: boolean;
  emptyDismissed: boolean;
  showTrans: boolean;
  fontSize: CaptionFontSize;
  dockPosition: CaptionDockPosition | null;
  dockWidth: number | null;
  isIdle: boolean;
  enableHintVisible: boolean;
  hasCaptionMessages: boolean;
}

const initialState = (): SubtitleViewState => ({
  capViewOpen: false,
  emptyDismissed: false,
  showTrans: false,
  fontSize: DEFAULT_CAPTION_FONT_SIZE,
  dockPosition: null,
  dockWidth: null,
  isIdle: false,
  enableHintVisible: false,
  hasCaptionMessages: false,
});

let state = initialState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(listener => listener());
}

function patch(partial: Partial<SubtitleViewState>) {
  state = { ...state, ...partial };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function setCapViewOpen(open: boolean) {
  const wasOpen = state.capViewOpen;
  if (wasOpen === open) {
    return;
  }
  state = {
    ...state,
    capViewOpen: open,
    ...(open
      ? {}
      : {
        enableHintVisible: false,
        hasCaptionMessages: false,
        isIdle: false,
      }),
  };
  emit();
}

export function setEmptyDismissed(emptyDismissed: boolean) {
  patch({ emptyDismissed });
}

export function setShowTrans(showTrans: boolean) {
  patch({ showTrans });
}

export function setFontSize(fontSize: CaptionFontSize) {
  patch({ fontSize });
}

export function setDockPosition(dockPosition: CaptionDockPosition | null) {
  patch({ dockPosition });
}

export function setDockWidth(dockWidth: number | null) {
  patch({ dockWidth });
}

export function setIsIdle(isIdle: boolean) {
  patch({ isIdle });
}

export function setEnableHintVisible(enableHintVisible: boolean) {
  patch({ enableHintVisible });
}

export function setHasCaptionMessages(hasCaptionMessages: boolean) {
  patch({ hasCaptionMessages });
}

export function resetSubtitleViewState() {
  state = initialState();
  emit();
}

const isPC = getPlatform() === 'pc';

/**
 * Show the one-shot "captions are on" intro. Used both when the overlay first
 * opens and when the user clicks to show it again after it has faded idle.
 */
export function presentCaptionHint() {
  state = {
    ...state,
    isIdle: false,
    enableHintVisible: true,
    capViewOpen: true,
  };
  emit();
  if (isPC) {
    TUIToast.info({ message: t('ASRTools.CaptionVisibleOnlyToSelf') });
  }
}

export function hideCaptionOverlay() {
  if (!state.capViewOpen) {
    return;
  }
  setCapViewOpen(false);
  if (isPC) {
    TUIToast.info({ message: t('ASRTools.CaptionClosed') });
  }
}

/**
 * Close the caption window without any user-visible side effects (no toast).
 * Called when the owner starts a NEW transcription session after a real stop:
 * the previous session's opt-in must not carry over, the member re-opens the
 * window manually. Personal preferences (font size, bilingual) are kept.
 */
export function resetCaptionForNewSession() {
  setCapViewOpen(false);
}

let subtitleRoomSeen = false;
let subtitleRoomId: string | undefined;

function syncSubtitleRoom(roomId: string | undefined) {
  if (!subtitleRoomSeen) {
    subtitleRoomSeen = true;
    subtitleRoomId = roomId;
    return;
  }
  if (roomId !== subtitleRoomId) {
    subtitleRoomId = roomId;
    resetSubtitleViewState();
  }
}

/**
 * Local, per-participant view state for AI captions.
 *
 * The owner controls whether transcription runs. Each participant independently
 * controls what they see. State lives at module level so a toolbar overflow
 * remount does not drop an open overlay.
 */
export function useSubtitleViewState() {
  const { currentRoom } = useRoomState();
  const roomId = currentRoom?.roomId;
  useEffect(() => {
    syncSubtitleRoom(roomId);
  }, [roomId]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    ...snapshot,
    setCapViewOpen,
    setEmptyDismissed,
    setShowTrans,
    setFontSize,
    setDockPosition,
    setDockWidth,
    setIsIdle,
    setEnableHintVisible,
    setHasCaptionMessages,
    presentCaptionHint,
    hideCaptionOverlay,
    resetCaptionForNewSession,
  };
}
