import { computed, ref, watch } from 'vue';
import { TUIErrorCode, useAITranscriberState, useRoomParticipantState, useRoomState, RealtimeTranscriberEvent } from 'tuikit-atomicx-vue3/room';
import { TUIMessageBox, TUIToast, t } from '../../base';
import { DEFAULT_SOURCE_LANGUAGE, DEFAULT_TARGET_LANGUAGE } from './constants';
import { useSubtitleViewState } from './useSubtitleViewState';

/**
 * Transcription messages already in flight when the owner stops transcription
 * must not flip the state back on. Within this window after an authoritative
 * "off" signal, message-based inference is ignored.
 */
const MESSAGE_INFERENCE_GRACE_MS = 3000;

const sourceLanguage = ref(DEFAULT_SOURCE_LANGUAGE);
const targetLanguage = ref(DEFAULT_TARGET_LANGUAGE);
const asrOn = ref(false);
const asrEverOn = ref(false);
const isRestarting = ref(false);
const isStoppingASR = ref(false);
const startConfirmVisible = ref(false);
const stopConfirmVisible = ref(false);
const showCaptionsOnStart = ref(true);

let lastAuthoritativeOffAt = 0;

const {
  startRealtimeTranscriber,
  stopRealtimeTranscriber,
  updateRealTimeTranscriber,
  subscribeEvent,
} = useAITranscriberState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();
const { showTrans, capViewOpen, emptyDismissed, presentCaptionHint, resetCaptionForNewSession } = useSubtitleViewState();

const resolveSDKSourceLanguage = (value: string) => value || 'auto';
const canManageASR = computed(() => (
  currentRoom.value?.roomOwner?.userId === localParticipant.value?.userId
));
const isTransNone = computed(() => !targetLanguage.value);

/**
 * Effective caption rendering mode. Falling back to `source-only` keeps
 * captions readable when translation is off.
 */
const captionDisplayMode = computed(() => (showTrans.value && !isTransNone.value ? 'bilingual' : 'source-only'));

/**
 * A non-owner who already saw transcription this room. Hosts and members who
 * never saw it get no stopped overlay.
 */
const isMemberStopped = computed(() => !canManageASR.value && asrEverOn.value);

/**
 * Overlay while transcription is off: only members who were already watching
 * captions keep the dock, so they can see the stopped status line.
 */
const isCaptionEmptyVisible = computed(() => (
  !asrOn.value
  && capViewOpen.value
  && !emptyDismissed.value
  && isMemberStopped.value
));

const isCaptionShown = computed(() => (asrOn.value ? capViewOpen.value : isCaptionEmptyVisible.value));

const setASROn = (next: boolean) => {
  const changed = asrOn.value !== next;
  asrOn.value = next;

  if (next) {
    asrEverOn.value = true;
  } else {
    lastAuthoritativeOffAt = Date.now();
  }

  if (!changed) {
    return;
  }

  // A real state change re-presents the truth: a dismissed card must not hide
  // the fact that transcription just started or stopped. Whether captions are
  // shown stays each participant's own choice.
  emptyDismissed.value = false;
};

const resetASRState = () => {
  sourceLanguage.value = DEFAULT_SOURCE_LANGUAGE;
  targetLanguage.value = DEFAULT_TARGET_LANGUAGE;
  asrOn.value = false;
  asrEverOn.value = false;
  isRestarting.value = false;
  isStoppingASR.value = false;
  startConfirmVisible.value = false;
  stopConfirmVisible.value = false;
  showCaptionsOnStart.value = true;
  lastAuthoritativeOffAt = 0;
};

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

subscribeEvent(RealtimeTranscriberEvent.onRealtimeTranscriberStarted, () => {
  if (isRestarting.value) {
    return;
  }
  // Every started event opens a NEW transcription session for members: the
  // previous session's opt-in must not carry over, the member re-opens the
  // caption window manually. The owner keeps their own window open.
  if (!canManageASR.value) {
    resetCaptionForNewSession();
  }
  setASROn(true);
});

subscribeEvent(RealtimeTranscriberEvent.onRealtimeTranscriberStopped, () => {
  if (isRestarting.value) {
    return;
  }
  setASROn(false);
});

subscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, () => {
  if (asrOn.value || isRestarting.value) {
    return;
  }
  if (Date.now() - lastAuthoritativeOffAt < MESSAGE_INFERENCE_GRACE_MS) {
    return;
  }
  setASROn(true);
});

watch(() => currentRoom.value?.roomId, (roomId, previousRoomId) => {
  if (roomId === previousRoomId) {
    return;
  }

  if (!roomId) {
    resetASRState();
    return;
  }

  // Switching rooms must drop the previous room's ASR state. The first enter
  // must not: the started event can arrive while enter is still writing roomId.
  if (previousRoomId) {
    resetASRState();
  }
}, { immediate: true });

const stopASR = async (options?: { resetState?: boolean }) => {
  if (!asrOn.value || isStoppingASR.value) {
    if (options?.resetState) {
      setASROn(false);
    }
    return;
  }

  try {
    isStoppingASR.value = true;
    await stopRealtimeTranscriber();
    setASROn(false);
    capViewOpen.value = false;
  } catch (error) {
    console.error('[useASRState] failed to stop ASR:', error);
  } finally {
    if (options?.resetState) {
      setASROn(false);
    }
    isStoppingASR.value = false;
  }
};

watch(
  canManageASR,
  (canManage, previousCanManage) => {
    if (previousCanManage && !canManage && asrOn.value) {
      void stopASR({ resetState: true });
    }
  },
);

const startASR = async (options?: { showCaptions?: boolean }) => {
  if (!canManageASR.value || asrOn.value) {
    return;
  }

  try {
    await startRealtimeTranscriber({
      sourceLanguage: resolveSDKSourceLanguage(sourceLanguage.value),
      translationLanguages: targetLanguage.value ? [targetLanguage.value] : [],
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
};

/**
 * Owner-only transcription config. Local caption preferences are written
 * straight to the view state and never pass through here.
 */
const saveSettings = async (options: {
  sourceLanguage?: string;
  targetLanguage?: string;
}) => {
  const nextSourceLanguage = options.sourceLanguage ?? sourceLanguage.value;
  const nextTargetLanguage = options.targetLanguage ?? targetLanguage.value;
  const transcriberConfigChanged = (
    nextSourceLanguage !== sourceLanguage.value
    || nextTargetLanguage !== targetLanguage.value
  );

  sourceLanguage.value = nextSourceLanguage;
  targetLanguage.value = nextTargetLanguage;

  if (!transcriberConfigChanged || !asrOn.value) {
    return;
  }

  // Updating the transcriber restarts it and emits a stopped event. Without
  // this guard the stopped handler would tear captions down on every language change.
  isRestarting.value = true;
  try {
    await updateRealTimeTranscriber({
      sourceLanguage: resolveSDKSourceLanguage(sourceLanguage.value),
      translationLanguages: targetLanguage.value ? [targetLanguage.value] : [],
    });
  } finally {
    isRestarting.value = false;
  }
};

const confirmStartASR = () => {
  showCaptionsOnStart.value = true;
  startConfirmVisible.value = true;
};

const submitStartASR = async () => {
  startConfirmVisible.value = false;
  await startASR({ showCaptions: showCaptionsOnStart.value }).catch(() => undefined);
};

const cancelStartASR = () => {
  startConfirmVisible.value = false;
};

const confirmStopASR = () => {
  stopConfirmVisible.value = true;
};

const submitStopASR = async () => {
  stopConfirmVisible.value = false;
  await stopASR();
};

const cancelStopASR = () => {
  stopConfirmVisible.value = false;
};

/** Language changes restart the transcriber for the whole room. */
const confirmSaveSettings = (options: {
  sourceLanguage?: string;
  targetLanguage?: string;
}) => {
  if (!canManageASR.value) {
    return;
  }

  const isSource = options.sourceLanguage !== undefined;
  const nextValue = isSource ? options.sourceLanguage : options.targetLanguage;
  const currentValue = isSource ? sourceLanguage.value : targetLanguage.value;
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
};

export function useASRState() {
  return {
    sourceLanguage,
    targetLanguage,
    isTransNone,
    asrOn,
    canManageASR,
    captionDisplayMode,
    isMemberStopped,
    isCaptionShown,
    startConfirmVisible,
    stopConfirmVisible,
    showCaptionsOnStart,
    confirmStartASR,
    submitStartASR,
    cancelStartASR,
    confirmStopASR,
    submitStopASR,
    cancelStopASR,
    confirmSaveSettings,
  };
}
