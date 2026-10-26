import type { KeyboardEvent } from 'react';
import {
  IconCapPanelMobile,
  IconCcMobile,
  IconChevronRightMobile,
  IconInfo,
  IconTranscribeMobile,
  TUISwitch,
} from '../../../base';
import { useI18n } from '../../../i18n';
import { useCaptionEntryMenu } from './useCaptionEntryMenu';
import './CaptionMenuMobile.scss';

export interface CaptionMenuMobileProps {
  transcriptOpen: boolean;
  /** Vue passes this as a class fallthrough attribute; React accepts it explicitly. */
  className?: string;
  onTranscription?: () => void;
  onOpenTranscript?: () => void;
}

function markInert(node: HTMLSpanElement | null) {
  node?.setAttribute('inert', '');
}

export function CaptionMenuMobile(props: CaptionMenuMobileProps) {
  const { transcriptOpen, className, onTranscription, onOpenTranscript } = props;
  const { t } = useI18n();

  const {
    asrOn,
    canManageASR,
    showWaitHint,
    isCaptionChecked,
    captionDisabled,
    transcriptDisabled,
    run,
  } = useCaptionEntryMenu(
    transcriptOpen,
    () => onOpenTranscript?.(),
  );

  function onTranscriptionAction() {
    if (run('transcription')) {
      onTranscription?.();
    }
  }

  function toggleCaptions() {
    run('caption');
  }

  function openTranscript() {
    run('transcript');
  }

  function onActivateKey(event: KeyboardEvent<HTMLDivElement>, action: () => void) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    action();
  }

  return (
    <div className={['caption-menu-mobile', className ?? ''].filter(Boolean).join(' ')}>
      {showWaitHint
        ? (
          <p className="caption-menu-hint">
            <IconInfo size={16} />
            <span>{t('AITools.WaitHost')}</span>
          </p>
        )
        : null}

      {canManageASR
        ? (
          <div
            className={['caption-menu-row', asrOn ? 'is-on' : ''].filter(Boolean).join(' ')}
            role="switch"
            tabIndex={0}
            aria-checked={asrOn}
            onClick={onTranscriptionAction}
            onKeyDown={event => onActivateKey(event, onTranscriptionAction)}
          >
            <span className="caption-menu-icon">
              <IconTranscribeMobile size={18} />
            </span>
            <span className="caption-menu-main">
              <span className="caption-menu-label">{t('AITools.H5RoomTitle')}</span>
              <span className="caption-menu-desc">{t('AITools.H5RoomDesc')}</span>
            </span>
            <span className="caption-menu-switch" ref={markInert}>
              <TUISwitch modelValue={asrOn} size="lg" />
            </span>
          </div>
        )
        : null}

      <div
        className={[
          'caption-menu-row',
          isCaptionChecked ? 'is-on' : '',
          captionDisabled ? 'is-disabled' : '',
        ].filter(Boolean).join(' ')}
        role="switch"
        tabIndex={captionDisabled ? -1 : 0}
        aria-checked={isCaptionChecked}
        aria-disabled={captionDisabled}
        onClick={toggleCaptions}
        onKeyDown={event => onActivateKey(event, toggleCaptions)}
      >
        <span className="caption-menu-icon">
          <IconCcMobile size={18} />
        </span>
        <span className="caption-menu-main">
          <span className="caption-menu-label">{t('AITools.H5Live')}</span>
          <span className="caption-menu-desc">{t('AITools.H5LiveDesc')}</span>
        </span>
        <span className="caption-menu-switch" ref={markInert}>
          <TUISwitch modelValue={isCaptionChecked} size="lg" />
        </span>
      </div>

      <div
        className={[
          'caption-menu-row',
          transcriptDisabled ? 'is-disabled' : '',
        ].filter(Boolean).join(' ')}
        role="button"
        tabIndex={transcriptDisabled ? -1 : 0}
        aria-disabled={transcriptDisabled}
        onClick={openTranscript}
        onKeyDown={event => onActivateKey(event, openTranscript)}
      >
        <span className="caption-menu-icon">
          <IconCapPanelMobile size={18} />
        </span>
        <span className="caption-menu-main">
          <span className="caption-menu-label">{t('AITools.RealtimeMessageList')}</span>
          <span className="caption-menu-desc">{t('AITools.H5ViewDesc')}</span>
        </span>
        <IconChevronRightMobile className="caption-menu-arrow" size={16} />
      </div>
    </div>
  );
}

export default CaptionMenuMobile;
