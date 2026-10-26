import { IconShare, TUIMessageBox, TUIToast } from '../../../base';
import { hasInterceptor, runInterceptors } from '../../../core/interceptors';
import { useI18n } from '../../../i18n';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import { useScreenShare } from './useScreenShare';
import { confirmStopScreenShare } from './confirmStopScreenShare';
import type { ScreenShareFailure } from './useScreenShare';

export function ScreenShareButton() {
  const { t } = useI18n();
  const {
    isBusy,
    canShareScreen,
    hasScreenFault,
    isScreenCaptureUnsupported,
    isLocalSharing,
    isRemoteSharing,
    startScreenShare,
    stopScreenShare,
  } = useScreenShare();

  const label = isLocalSharing ? t('ScreenShare.Stop') : t('ScreenShare.Share');
  /** Host and admin keep control; a share already in progress can still be stopped. */
  const isShareBlocked = !canShareScreen && !isLocalSharing;

  function notifyFailure(reason: ScreenShareFailure) {
    if (reason === 'capture') {
      return;
    }
    const type = reason === 'failed' ? 'error' : 'warning';
    TUIToast[type](t(`ScreenShare.Failure.${reason}`));
  }

  async function startWithConfirm() {
    if (!canShareScreen) {
      notifyFailure('not-allowed');
      return;
    }
    if (isRemoteSharing) {
      notifyFailure('remote-sharing');
      return;
    }
    if (!isScreenCaptureUnsupported && hasInterceptor('startScreenShare')) {
      if (!await runInterceptors('startScreenShare')) {
        return;
      }
    } else if (!isScreenCaptureUnsupported) {
      const confirmed = await TUIMessageBox.confirm({
        title: t('ScreenShare.StartTitle'),
        message: t('ScreenShare.StartMessage'),
        confirmText: t('ScreenShare.StartConfirm'),
        cancelText: t('ScreenShare.Cancel'),
      });
      if (!confirmed) {
        return;
      }
    }
    /**
     * No success toast: when two people start sharing at once the engine keeps
     * only one stream, so a toast here would confirm a share that is about to be
     * dropped. Silence means success; the active button state is the feedback.
     */
    const failure = await startScreenShare();
    if (failure) {
      notifyFailure(failure);
    }
  }

  function handleClick() {
    void (isLocalSharing ? confirmStopScreenShare(stopScreenShare) : startWithConfirm());
  }

  return (
    <ToolbarButtonPC
      label={label}
      icon={IconShare}
      active={isLocalSharing}
      blocked={isShareBlocked}
      loading={isBusy}
      notice={hasScreenFault}
      onClick={handleClick}
    />
  );
}

export default ScreenShareButton;
