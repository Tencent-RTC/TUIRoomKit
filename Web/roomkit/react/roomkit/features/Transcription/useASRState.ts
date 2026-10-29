import { useEffect, useRef, useSyncExternalStore } from 'react';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  RealtimeTranscriberEvent,
  useAITranscriberState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { TUIMessageBox, TUIToast } from '../../base';
import { t } from '../../i18n';
import { DEFAULT_SOURCE_LANGUAGE, DEFAULT_TARGET_LANGUAGE } from './constants';
import {
  presentCaptionHint,
  resetCaptionForNewSession,
  setCapViewOpen,
  setEmptyDismissed,
  useSubtitleViewState,
} from './useSubtitleViewState';

/**
 * Transcription messages already in flight when the owner stops transcription
 * must not flip the state back on. Within this window after an authoritative
 * "off" signal, message-based inference is ignored.
 */
const MESSAGE_INFERENCE_GRACE_MS = 3000;

interface ASRState {
  sourceLanguage: string;
  targetLanguage: string;
  asrOn: boolean;
  asrEverOn: boolean;
  isRestarting: boolean;
  isStoppingASR: boolean;
  startConfirmVisible: boolean;
  stopConfirmVisible: boolean;
  showCaptionsOnStart: boolean;
}

const initialASRState = (): ASRState => ({
  sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
  targetLanguage: DEFAULT_TARGET_LANGUAGE,
  asrOn: false,
  asrEverOn: false,
  isRestarting: false,
  isStoppingASR: false,
  startConfirmVisible: false,
  stopConfirmVisible: false,
  showCaptionsOnStart: true,
});

let asr = initialASRState();
let lastAuthoritativeOffAt = 0;
/** Mirrors the hook's owner check so module-level event handlers can read it. */
let canManageASRNow = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(listener => listener());
}

function patch(partial: Partial<ASRState>) {
  asr = { ...asr, ...partial };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return asr;
}

const resolveSDKSourceLanguage = (value: string) => value || 'auto';

function setASROn(next: boolean) {
  const changed = asr.asrOn !== next;
  asr = {
    ...asr,
    asrOn: next,
    asrEverOn: next ? true : asr.asrEverOn,
  };
  if (!next) {
    lastAuthoritativeOffAt = Date.now();
  }
  emit();

  if (!changed) {
    return;
  }

  // A real state change re-presents the truth: a dismissed card must not hide
  // the fact that transcription just started or stopped. Whether captions are
  // shown stays each participant's own choice.
  setEmptyDismissed(false);
}

function resetASRState() {
  asr = initialASRState();
  lastAuthoritativeOffAt = 0;
  emit();
}

const extractErrorCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as Record<string, unknown>;
  const rawCode = candidate.code ?? candidate.errorCode ?? candidate.errCode;

  if (typeof rawCode === 'number' && Number.isFinite(rawCode)) {
    return rawCode;
  }

  if (typeof rawCode === 'string') {
    const parsed = Number(rawCode);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (typeof candidate.message === 'string') {
    const match = candidate.message.match(/-?\d{3,6}/);
    if (match) {
      const parsed = Number(match[0]);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const getASRStartErrorMessage = (error: unknown) => {
  const errorCode = extractErrorCode(error);

  switch (errorCode) {
    case TUIErrorCode.ERR_REQUIRE_PAYMENT:
      return t('AITools.StartFailedPackageRequired');
    default:
      return t('AITools.StartFailed');
  }
};

let eventsBound = false;

function bindTranscriberEvents(subscribeEvent: ReturnType<typeof useAITranscriberState>['subscribeEvent']) {
  if (eventsBound) {
    return;
  }
  eventsBound = true;

  subscribeEvent(RealtimeTranscriberEvent.onRealtimeTranscriberStarted, () => {
    if (asr.isRestarting) {
      return;
    }
    // Every started event opens a NEW transcription session for members: the
    // previous session's opt-in must not carry over, the member re-opens the
    // caption window manually. The owner keeps their own window open.
    if (!canManageASRNow) {
      resetCaptionForNewSession();
    }
    setASROn(true);
  });

  subscribeEvent(RealtimeTranscriberEvent.onRealtimeTranscriberStopped, () => {
    if (asr.isRestarting) {
      return;
    }
    setASROn(false);
  });

  subscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, () => {
    if (asr.asrOn || asr.isRestarting) {
      return;
    }
    if (Date.now() - lastAuthoritativeOffAt < MESSAGE_INFERENCE_GRACE_MS) {
      return;
    }
    setASROn(true);
  });
}

let asrRoomSeen = false;
let asrRoomId: string | undefined;

function syncAsrRoom(roomId: string | undefined) {
  if (!asrRoomSeen) {
    asrRoomSeen = true;
    asrRoomId = roomId;
    if (!roomId) {
      resetASRState();
    }
    return;
  }
  if (roomId === asrRoomId) {
    return;
  }
  const previousRoomId = asrRoomId;
  asrRoomId = roomId;
  if (!roomId || previousRoomId) {
    resetASRState();
  }
}

type TranscriberApi = Pick<
  ReturnType<typeof useAITranscriberState>,
  'startRealtimeTranscriber' | 'stopRealtimeTranscriber' | 'updateRealTimeTranscriber' | 'subscribeEvent'
>;

let transcriberApi: TranscriberApi | null = null;

export async function stopASR(options?: { resetState?: boolean }) {
  if (!asr.asrOn || asr.isStoppingASR) {
    if (options?.resetState) {
      setASROn(false);
    }
    return;
  }

  try {
    patch({ isStoppingASR: true });
    if (!transcriberApi) {
      throw new Error('AI transcriber is not ready');
    }
    await transcriberApi.stopRealtimeTranscriber();
    setASROn(false);
    setCapViewOpen(false);
  } catch (error) {
    console.error('[useASRState] failed to stop ASR:', error);
  } finally {
    if (options?.resetState) {
      setASROn(false);
    }
    patch({ isStoppingASR: false });
  }
}

export function setShowCaptionsOnStart(showCaptionsOnStart: boolean) {
  patch({ showCaptionsOnStart });
}

export function useASRState() {
  const view = useSubtitleViewState();
  const transcriber = useAITranscriberState();
  const { currentRoom } = useRoomState();
  const { localParticipant } = useRoomParticipantState();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  transcriberApi = transcriber;
  const roomId = currentRoom?.roomId;
  useEffect(() => {
    bindTranscriberEvents(transcriber.subscribeEvent);
    syncAsrRoom(roomId);
  }, [roomId, transcriber.subscribeEvent]);

  const canManageASR = currentRoom?.roomOwner?.userId === localParticipant?.userId;
  canManageASRNow = canManageASR;
  const previousCanManage = useRef<boolean | null>(null);
  useEffect(() => {
    const previous = previousCanManage.current;
    previousCanManage.current = canManageASR;
    if (previous && !canManageASR && getSnapshot().asrOn) {
      void stopASR({ resetState: true });
    }
  }, [canManageASR]);

  const isTransNone = !snapshot.targetLanguage;
  const captionDisplayMode = view.showTrans && !isTransNone ? 'bilingual' as const : 'source-only' as const;
  const isMemberStopped = !canManageASR && snapshot.asrEverOn;
  const isCaptionEmptyVisible = (
    !snapshot.asrOn
    && view.capViewOpen
    && !view.emptyDismissed
    && isMemberStopped
  );
  const isCaptionShown = snapshot.asrOn ? view.capViewOpen : isCaptionEmptyVisible;

  async function startASR(options?: { showCaptions?: boolean }) {
    if (!canManageASR || getSnapshot().asrOn) {
      return;
    }
    const current = getSnapshot();
    try {
      await transcriber.startRealtimeTranscriber({
        sourceLanguage: resolveSDKSourceLanguage(current.sourceLanguage),
        translationLanguages: current.targetLanguage ? [current.targetLanguage] : [],
      });
      setASROn(true);
      if (options?.showCaptions) {
        presentCaptionHint();
      }
    } catch (error) {
      console.error('[useASRState] failed to start ASR:', error);
      TUIToast.error({ message: getASRStartErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Owner-only transcription config. Local caption preferences are written
   * straight to the view state and never pass through here.
   */
  async function saveSettings(options: {
    sourceLanguage?: string;
    targetLanguage?: string;
  }) {
    const current = getSnapshot();
    const nextSourceLanguage = options.sourceLanguage ?? current.sourceLanguage;
    const nextTargetLanguage = options.targetLanguage ?? current.targetLanguage;
    const transcriberConfigChanged = (
      nextSourceLanguage !== current.sourceLanguage
      || nextTargetLanguage !== current.targetLanguage
    );

    patch({
      sourceLanguage: nextSourceLanguage,
      targetLanguage: nextTargetLanguage,
    });

    if (!transcriberConfigChanged || !getSnapshot().asrOn) {
      return;
    }

    // Updating the transcriber restarts it and emits a stopped event. Without
    // this guard the stopped handler would tear captions down on every language change.
    patch({ isRestarting: true });
    try {
      const next = getSnapshot();
      await transcriber.updateRealTimeTranscriber({
        sourceLanguage: resolveSDKSourceLanguage(next.sourceLanguage),
        translationLanguages: next.targetLanguage ? [next.targetLanguage] : [],
      });
    } finally {
      patch({ isRestarting: false });
    }
  }

  function confirmStartASR() {
    patch({
      showCaptionsOnStart: true,
      startConfirmVisible: true,
    });
  }

  async function submitStartASR() {
    const current = getSnapshot();
    patch({ startConfirmVisible: false });
    await startASR({ showCaptions: current.showCaptionsOnStart }).catch(() => undefined);
  }

  function cancelStartASR() {
    patch({ startConfirmVisible: false });
  }

  function confirmStopASR() {
    patch({ stopConfirmVisible: true });
  }

  async function submitStopASR() {
    patch({ stopConfirmVisible: false });
    await stopASR();
  }

  function cancelStopASR() {
    patch({ stopConfirmVisible: false });
  }

  /** Language changes restart the transcriber for the whole room. */
  function confirmSaveSettings(options: {
    sourceLanguage?: string;
    targetLanguage?: string;
  }) {
    if (!canManageASR) {
      return;
    }

    const isSource = options.sourceLanguage !== undefined;
    const nextValue = isSource ? options.sourceLanguage : options.targetLanguage;
    const current = getSnapshot();
    const currentValue = isSource ? current.sourceLanguage : current.targetLanguage;
    if (nextValue === currentValue) {
      return;
    }

    void TUIMessageBox.confirm({
      title: t(isSource ? 'AITools.ConfirmChangeSourceTitle' : 'AITools.ConfirmChangeTargetTitle'),
      message: t(isSource ? 'AITools.ConfirmChangeSourceDesc' : 'AITools.ConfirmChangeTargetDesc'),
      confirmText: t('AITools.ConfirmChangeOk'),
      cancelText: t('AITools.Cancel'),
    }).then(async (confirmed) => {
      if (!confirmed) {
        return;
      }
      try {
        await saveSettings(options);
      } catch (error) {
        console.error('[useASRState] failed to update transcription settings:', error);
        TUIToast.error({ message: t('AITools.SaveSettingsFailed') });
      }
    });
  }

  return {
    sourceLanguage: snapshot.sourceLanguage,
    targetLanguage: snapshot.targetLanguage,
    isTransNone,
    asrOn: snapshot.asrOn,
    canManageASR,
    captionDisplayMode,
    isMemberStopped,
    isCaptionShown,
    stopASR,
    startConfirmVisible: snapshot.startConfirmVisible,
    stopConfirmVisible: snapshot.stopConfirmVisible,
    showCaptionsOnStart: snapshot.showCaptionsOnStart,
    setShowCaptionsOnStart,
    confirmStartASR,
    submitStartASR,
    cancelStartASR,
    confirmStopASR,
    submitStopASR,
    cancelStopASR,
    confirmSaveSettings,
  };
}
