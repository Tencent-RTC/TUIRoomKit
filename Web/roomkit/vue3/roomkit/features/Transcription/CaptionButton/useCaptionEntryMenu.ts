import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import { IconAI, IconAISubtitleCC, IconAITranscription, t } from '../../../base';
import type { OverflowSubmenuItem } from '../../../layouts/OverflowToolbarPC/overflowSubmenu';
import { hasDisplayableText } from '../display';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';

/**
 * Caption-entry actions shared by the PC dropdown, the overflow drill-in, and the
 * H5 sheet. Each surface picks its own labels and controls; the enable rules stay here.
 */
export function useCaptionEntryMenu(
  transcriptOpen: MaybeRefOrGetter<boolean>,
  onToggleTranscript: () => void,
) {
  const {
    capViewOpen,
    presentCaptionHint,
    hideCaptionOverlay,
  } = useSubtitleViewState();
  const { asrOn, canManageASR, confirmStartASR, confirmStopASR } = useASRState();
  const { realtimeMessageList } = useAITranscriberState();

  const isTranscriptOpen = computed(() => toValue(transcriptOpen));
  const showWaitHint = computed(() => !asrOn.value && !canManageASR.value);
  const captionDisabled = computed(() => !asrOn.value);
  const hasTranscript = computed(() => realtimeMessageList.value.some(message => (
    hasDisplayableText(message.sourceText)
  )));
  const transcriptDisabled = computed(() => (
    !asrOn.value && !isTranscriptOpen.value && !hasTranscript.value
  ));
  const isCaptionChecked = computed(() => asrOn.value && capViewOpen.value);

  const transcriptionLabel = computed(() => (
    asrOn.value ? t('AITools.TranscriptionStop') : t('AITools.TranscriptionStart')
  ));
  const captionLabel = computed(() => (
    isCaptionChecked.value ? t('AITools.SubtitlesClose') : t('AITools.SubtitlesOpen')
  ));
  const recordLabel = computed(() => (
    isTranscriptOpen.value
      ? t('AITools.RealtimeMessageListClose')
      : t('AITools.RealtimeMessageListOpen')
  ));
  const hint = computed(() => (showWaitHint.value ? t('AITools.WaitHost') : ''));

  const items = computed<OverflowSubmenuItem[]>(() => {
    const rows: OverflowSubmenuItem[] = [];
    if (canManageASR.value) {
      rows.push({
        act: 'transcription',
        label: transcriptionLabel.value,
        icon: IconAI,
        on: asrOn.value,
      });
      rows.push({ divider: true });
    }
    rows.push({
      act: 'caption',
      label: captionLabel.value,
      icon: IconAISubtitleCC,
      disabled: captionDisabled.value,
    });
    rows.push({
      act: 'transcript',
      label: recordLabel.value,
      icon: IconAITranscription,
      disabled: transcriptDisabled.value,
    });
    return rows;
  });

  function run(act: string): boolean {
    if (act === 'transcription') {
      if (!canManageASR.value) {
        return false;
      }
      if (asrOn.value) {
        confirmStopASR();
      } else {
        confirmStartASR();
      }
      return true;
    }
    if (act === 'caption') {
      if (captionDisabled.value) {
        return false;
      }
      if (isCaptionChecked.value) {
        hideCaptionOverlay();
      } else {
        presentCaptionHint();
      }
      return true;
    }
    if (act === 'transcript') {
      if (transcriptDisabled.value) {
        return false;
      }
      onToggleTranscript();
      return true;
    }
    return false;
  }

  return {
    asrOn,
    canManageASR,
    showWaitHint,
    isCaptionChecked,
    captionDisabled,
    transcriptDisabled,
    transcriptionLabel,
    captionLabel,
    recordLabel,
    hint,
    items,
    run,
  };
}
