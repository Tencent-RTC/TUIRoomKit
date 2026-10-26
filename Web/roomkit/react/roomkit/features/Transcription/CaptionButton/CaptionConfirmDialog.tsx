import { getPlatform } from '@tencentcloud/universal-api';
import { TUIDialog } from '../../../base';
import { useI18n } from '../../../i18n';
import { useASRState } from '../useASRState';
import './CaptionConfirmDialog.scss';

export function CaptionConfirmDialog() {
  const { t } = useI18n();
  const isPC = getPlatform() === 'pc';
  const {
    startConfirmVisible,
    stopConfirmVisible,
    showCaptionsOnStart,
    setShowCaptionsOnStart,
    submitStartASR,
    cancelStartASR,
    submitStopASR,
    cancelStopASR,
  } = useASRState();

  return (
    <>
      <TUIDialog
        open={startConfirmVisible}
        title={t('AITools.ConfirmStartTitle')}
        width={420}
        closable={isPC}
        confirmText={t('AITools.ConfirmStartOk')}
        cancelText={t('AITools.Cancel')}
        onClose={cancelStartASR}
        onConfirm={() => {
          void submitStartASR();
        }}
        onCancel={cancelStartASR}
      >
        <div className={['asr-confirm', !isPC ? 'is-h5' : ''].filter(Boolean).join(' ')}>
          <p className="asr-confirm-desc">{t('AITools.ConfirmStartDesc')}</p>
          <label className="asr-confirm-check">
            <input
              type="checkbox"
              checked={showCaptionsOnStart}
              onChange={event => setShowCaptionsOnStart(event.target.checked)}
            />
            <span>{t('AITools.ConfirmStartShowCaptions')}</span>
          </label>
        </div>
      </TUIDialog>

      <TUIDialog
        open={stopConfirmVisible}
        width={420}
        closable={isPC}
        title={t('AITools.ConfirmStopTitle')}
        confirmText={t('AITools.ConfirmStopOk')}
        cancelText={t('AITools.ConfirmStopCancel')}
        onClose={cancelStopASR}
        onConfirm={() => {
          void submitStopASR();
        }}
        onCancel={cancelStopASR}
      >
        <p className="asr-confirm-desc">{t('AITools.ConfirmStopDesc')}</p>
      </TUIDialog>
    </>
  );
}

export default CaptionConfirmDialog;
