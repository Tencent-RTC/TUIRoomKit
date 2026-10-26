import type { KeyboardEvent } from 'react';
import { IconCapCloseMobile } from '../../../base';
import { useI18n } from '../../../i18n';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import Subtitle from './Subtitle';
import { useSubtitleIdle } from './useSubtitleIdle';
import './CaptionOverlayMobile.scss';

export interface CaptionOverlayMobileProps {
  className?: string;
  onOpenTranscript?: () => void;
}

export function CaptionOverlayMobile(props: CaptionOverlayMobileProps) {
  const { className, onOpenTranscript } = props;
  const { t } = useI18n();
  const {
    hideCaptionOverlay,
    capViewOpen,
    enableHintVisible,
    hasCaptionMessages,
  } = useSubtitleViewState();
  const { targetLanguage, asrOn, captionDisplayMode } = useASRState();

  useSubtitleIdle(
    asrOn && capViewOpen,
    enableHintVisible || hasCaptionMessages,
  );

  function openTranscript() {
    onOpenTranscript?.();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    openTranscript();
  }

  return (
    <div
      className={['caption-overlay-mobile', className].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      onClick={openTranscript}
      onKeyDown={onKeyDown}
    >
      <button
        className="caption-overlay-mobile-close"
        type="button"
        aria-label={t('AITools.SubtitlesClose')}
        onClick={(event) => {
          event.stopPropagation();
          hideCaptionOverlay();
        }}
      >
        <IconCapCloseMobile size={14} />
      </button>
      <Subtitle
        targetLanguage={targetLanguage}
        captionMode={captionDisplayMode}
        pinned={false}
        avatarSize={16}
        placeholderKey={asrOn ? 'ASRTools.SubtitlePlaceholder' : 'ASRTools.SubtitleStoppedPlaceholder'}
        forcePlaceholder={!asrOn}
      />
    </div>
  );
}

export default CaptionOverlayMobile;
