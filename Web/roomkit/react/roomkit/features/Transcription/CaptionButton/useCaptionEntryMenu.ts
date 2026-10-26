import { useAITranscriberState } from 'tuikit-atomicx-react/room';
import { IconAI, IconAISubtitleCC, IconAITranscription } from '../../../base';
import { useI18n } from '../../../i18n';
import type { OverflowSubmenuItem } from '../../../layouts/OverflowToolbarPC/overflowSubmenu';
import { hasDisplayableText } from '../display';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';

/**
 * Caption-entry actions shared by the PC dropdown, the overflow drill-in, and the
 * H5 sheet. Each surface picks its own labels and controls; the enable rules stay here.
 */
export function useCaptionEntryMenu(
  transcriptOpen: boolean,
  onToggleTranscript: () => void,
) {
  const { t } = useI18n();
  const {
    capViewOpen,
    presentCaptionHint,
    hideCaptionOverlay,
  } = useSubtitleViewState();
  const { asrOn, canManageASR, confirmStartASR, confirmStopASR } = useASRState();
  const { realtimeMessageList } = useAITranscriberState();

  const showWaitHint = !asrOn && !canManageASR;
  const captionDisabled = !asrOn;
  const hasTranscript = realtimeMessageList.some(message => (
    hasDisplayableText(message.sourceText)
  ));
  const transcriptDisabled = !asrOn && !transcriptOpen && !hasTranscript;
  const isCaptionChecked = asrOn && capViewOpen;

  const transcriptionLabel = asrOn ? t('AITools.TranscriptionStop') : t('AITools.TranscriptionStart');
  const captionLabel = isCaptionChecked ? t('AITools.SubtitlesClose') : t('AITools.SubtitlesOpen');
  const recordLabel = transcriptOpen
    ? t('AITools.RealtimeMessageListClose')
    : t('AITools.RealtimeMessageListOpen');
  const hint = showWaitHint ? t('AITools.WaitHost') : '';

  const items: OverflowSubmenuItem[] = [];
  if (canManageASR) {
    items.push({
      act: 'transcription',
      label: transcriptionLabel,
      icon: IconAI,
      on: asrOn,
    });
    items.push({ divider: true });
  }
  items.push({
    act: 'caption',
    label: captionLabel,
    icon: IconAISubtitleCC,
    disabled: captionDisabled,
  });
  items.push({
    act: 'transcript',
    label: recordLabel,
    icon: IconAITranscription,
    disabled: transcriptDisabled,
  });

  function run(act: string): boolean {
    if (act === 'transcription') {
      if (!canManageASR) {
        return false;
      }
      if (asrOn) {
        confirmStopASR();
      } else {
        confirmStartASR();
      }
      return true;
    }
    if (act === 'caption') {
      if (captionDisabled) {
        return false;
      }
      if (isCaptionChecked) {
        hideCaptionOverlay();
      } else {
        presentCaptionHint();
      }
      return true;
    }
    if (act === 'transcript') {
      if (transcriptDisabled) {
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
