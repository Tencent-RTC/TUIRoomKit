import { IconAI, IconAISubtitleCC, IconAITranscription, IconInfo, TUIDropdownItem, TUIDropdownSeparator } from '../../../base';
import { useI18n } from '../../../i18n';
import { useCaptionEntryMenu } from './useCaptionEntryMenu';
import './CaptionEntryMenu.scss';

export interface CaptionEntryMenuProps {
  transcriptOpen: boolean;
}

export function CaptionEntryMenu(props: CaptionEntryMenuProps) {
  const { transcriptOpen } = props;
  const { t } = useI18n();
  const {
    asrOn,
    canManageASR,
    showWaitHint,
    captionDisabled,
    transcriptDisabled,
    transcriptionLabel,
    captionLabel,
    recordLabel,
  } = useCaptionEntryMenu(transcriptOpen, () => {});

  return (
    <div className="asr-menu">
      {showWaitHint && (
        <div className="asr-menu-hint" role="note">
          <IconInfo size={14} />
          <span>{t('AITools.WaitHost')}</span>
        </div>
      )}
      {showWaitHint && <TUIDropdownSeparator />}

      {canManageASR && (
        <TUIDropdownItem
          command="transcription"
          className={asrOn ? 'is-on' : undefined}
        >
          <IconAI size={14} />
          <span>{transcriptionLabel}</span>
        </TUIDropdownItem>
      )}

      {canManageASR && <TUIDropdownSeparator />}

      <TUIDropdownItem
        command="caption"
        disabled={captionDisabled}
      >
        <IconAISubtitleCC size={14} />
        <span>{captionLabel}</span>
      </TUIDropdownItem>

      <TUIDropdownItem
        command="transcript"
        disabled={transcriptDisabled}
      >
        <IconAITranscription size={14} />
        <span>{recordLabel}</span>
      </TUIDropdownItem>
    </div>
  );
}

export default CaptionEntryMenu;
