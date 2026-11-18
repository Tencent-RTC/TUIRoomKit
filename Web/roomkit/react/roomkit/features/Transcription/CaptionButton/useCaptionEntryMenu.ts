import { useAITranscriberState } from 'tuikit-atomicx-react/room';
import { IconAI, IconAISubtitleCC, IconAITranscription } from '../../../base';
import { useI18n } from '../../../i18n';
import type { OverflowSubmenuItem } from '../../../layouts/OverflowToolbarPC/overflowItem';
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
  const note = showWaitHint ? t('AITools.WaitHost') : '';

  const items: OverflowSubmenuItem[] = [];
  if (canManageASR) {
    items.push({
      command: 'transcription',
      label: transcriptionLabel,
      icon: IconAI,
      checked: asrOn,
    });
    items.push({ divider: true });
  }
  items.push({
    command: 'caption',
    label: captionLabel,
    icon: IconAISubtitleCC,
    disabled: captionDisabled,
  });
  items.push({
    command: 'transcript',
    label: recordLabel,
    icon: IconAITranscription,
    disabled: transcriptDisabled,
  });

  function run(command: string): boolean {
    if (command === 'transcription') {
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
    if (command === 'caption') {
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
    if (command === 'transcript') {
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
    note,
    items,
    run,
  };
}
