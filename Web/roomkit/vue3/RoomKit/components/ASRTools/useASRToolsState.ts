import { computed, ref, watch } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { TUIMessageBox, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useAITranscriberState, useRoomParticipantState, useRoomState, RealtimeTranscriberEvent } from 'tuikit-atomicx-vue3/room';
import {
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  type ASREmptyVariant,
} from './constants';
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
/** Where the start confirm was opened from; drives title/copy and the captions checkbox. */
const startConfirmSource = ref<'toggle' | 'subtitle' | 'record'>('toggle');

let lastAuthoritativeOffAt = 0;

const {
  startRealtimeTranscriber,
  stopRealtimeTranscriber,
  updateRealTimeTranscriber,
  subscribeEvent,
} = useAITranscriberState();
const { t } = useUIKit();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();
const { showTrans, capViewOpen, emptyDismissed, presentCaptionHint } = useSubtitleViewState();

const resolveSDKSourceLanguage = (value: string) => value || 'auto';
const canManageASR = computed(() => currentRoom.value?.roomOwner?.userId === localParticipant.value?.userId);
const isTransNone = computed(() => !targetLanguage.value);

/**
 * Effective caption rendering mode. Falling back to `source-only` (rather than
 * to a translation-only view) keeps captions readable when translation is off.
 */
const captionDisplayMode = computed(() => (showTrans.value && !isTransNone.value ? 'bilingual' : 'source-only'));

/**
 * Empty-state copy depends on both the role and whether transcription ever ran:
 * a member who never saw it running is waiting, one who did needs to be told it
 * was stopped.
 */
const asrEmptyVariant = computed<ASREmptyVariant>(() => {
  if (canManageASR.value) {
    return 'host-idle';
  }
  return asrEverOn.value ? 'member-stopped' : 'member-waiting';
});

/**
 * Overlay while transcription is off: only members who were already watching
 * captions keep the dock, so they can see the stopped status line.
 */
const isCaptionEmptyVisible = computed(() => (
  !asrOn.value
  && capViewOpen.value
  && !emptyDismissed.value
  && asrEmptyVariant.value === 'member-stopped'
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
  // shown stays each participant's own choice — never opened on their behalf.
  emptyDismissed.value = false;
};

const resetASRToolsState = () => {
  sourceLanguage.value = DEFAULT_SOURCE_LANGUAGE;
  targetLanguage.value = DEFAULT_TARGET_LANGUAGE;
  asrOn.value = false;
  asrEverOn.value = false;
  isRestarting.value = false;
  isStoppingASR.value = false;
  startConfirmVisible.value = false;
  stopConfirmVisible.value = false;
  showCaptionsOnStart.value = true;
  startConfirmSource.value = 'toggle';
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

// Source 1: authoritative SDK lifecycle events. Late joiners also receive
// `onRealtimeTranscriberStarted` when a transcriber is already running.
subscribeEvent(RealtimeTranscriberEvent.onRealtimeTranscriberStarted, () => {
  if (isRestarting.value) {
    return;
  }
  setASROn(true);
});

subscribeEvent(RealtimeTranscriberEvent.onRealtimeTranscriberStopped, () => {
  if (isRestarting.value) {
    return;
  }
  setASROn(false);
});

// Source 2: inference from incoming transcription messages. Covers the
// window where the started event has not arrived yet but speech is flowing.
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
    resetASRToolsState();
    return;
  }

  // Switching rooms must drop the previous room's ASR state. The first enter
  // must not: `onRealtimeTranscriberStarted` can arrive while `enterRoom` is
  // still writing `currentRoom.roomId`, and a reset here would wipe it.
  if (previousRoomId) {
    resetASRToolsState();
  }
}, { immediate: true });

const stopASR = async (options?: { suppressError?: boolean; resetState?: boolean }) => {
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
    // The host who deliberately stopped does not need a card explaining it.
    capViewOpen.value = false;
  } catch (error) {
    if (!options?.suppressError) {
      console.error('[useASRToolsState] failed to stop ASR:', error);
      throw error;
    }
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
      stopASR({ suppressError: true, resetState: true });
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
    // Captions are a local view. Only open them when the host opted in on
    // the start confirm — never as a hidden side effect of starting the room service.
    if (options?.showCaptions) {
      presentCaptionHint();
    }
  } catch (error) {
    console.error('[useASRToolsState] failed to start ASR:', error);
    TUIToast.error({ message: getASRStartErrorMessage(error) });
    throw error;
  }
};

/**
 * Owner-only transcription config. Local caption preferences (`showTrans`,
 * `fontSize`) are written straight to `useSubtitleViewState` and deliberately
 * do not pass through here — they never touch the transcriber.
 */
const saveSettings = async (options: {
  sourceLanguage?: string;
  targetLanguage?: string;
}) => {
  const isOwner = canManageASR.value;
  const nextSourceLanguage = isOwner ? (options.sourceLanguage ?? sourceLanguage.value) : sourceLanguage.value;
  const nextTargetLanguage = isOwner ? (options.targetLanguage ?? targetLanguage.value) : targetLanguage.value;
  const transcriberConfigChanged = isOwner && (
    nextSourceLanguage !== sourceLanguage.value
    || nextTargetLanguage !== targetLanguage.value
  );

  sourceLanguage.value = nextSourceLanguage;
  targetLanguage.value = nextTargetLanguage;

  if (!transcriberConfigChanged || !asrOn.value) {
    return;
  }

  // `updateRealTimeTranscriber` restarts the robot (stop then start), which
  // emits a stopped event. Without this guard the stopped handler would tear
  // down captions and panels for everyone on every language change.
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

/**
 * Starting and stopping transcription affects every participant, so both are
 * gated behind a confirmation. The start dialog also asks whether to open
 * the local caption overlay — that choice is not implied by starting the service.
 */
const confirmStartASR = (source: 'toggle' | 'subtitle' | 'record' = 'toggle') => {
  startConfirmSource.value = source;
  // Clicking "show captions" already means the host wants the overlay.
  showCaptionsOnStart.value = source !== 'record';
  startConfirmVisible.value = true;
};

const submitStartASR = async () => {
  startConfirmVisible.value = false;
  const showCaptions = startConfirmSource.value === 'subtitle' || showCaptionsOnStart.value;
  await startASR({ showCaptions }).catch(() => undefined);
};

const cancelStartASR = () => {
  startConfirmVisible.value = false;
};

const confirmStopASR = () => {
  stopConfirmVisible.value = true;
};

const submitStopASR = async () => {
  stopConfirmVisible.value = false;
  await stopASR({ suppressError: true });
};

const cancelStopASR = () => {
  stopConfirmVisible.value = false;
};

/**
 * Language changes restart the transcriber for the whole room, so they use
 * the same confirmation gate as start / stop.
 */
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

  TUIMessageBox.confirm({
    title: t(isSource ? 'AITools.ConfirmChangeSourceTitle' : 'AITools.ConfirmChangeTargetTitle'),
    content: t(isSource ? 'AITools.ConfirmChangeSourceDesc' : 'AITools.ConfirmChangeTargetDesc'),
    confirmText: t('AITools.ConfirmChangeOk'),
    cancelText: t('AITools.Cancel'),
    callback: async (action) => {
      if (action !== 'confirm') {
        return;
      }
      try {
        await saveSettings(options);
      } catch (error) {
        console.error('[useASRToolsState] failed to update transcription settings:', error);
        TUIToast.error({ message: t('AITools.SaveSettingsFailed') });
      }
    },
  });
};

export function useASRToolsState() {
  return {
    sourceLanguage,
    targetLanguage,
    isTransNone,
    asrOn,
    canManageASR,
    captionDisplayMode,
    asrEmptyVariant,
    isCaptionShown,
    stopASR,
    startConfirmVisible,
    stopConfirmVisible,
    startConfirmSource,
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
