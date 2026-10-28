import { TUIMessageBox, TUIToast, t } from '../../../base';
import type { ScreenShareFailure } from './useScreenShare';

export async function confirmStopScreenShare(stop: () => Promise<ScreenShareFailure | undefined>) {
  const confirmed = await TUIMessageBox.danger({
    title: t('ScreenShare.StopTitle'),
    message: t('ScreenShare.StopMessage'),
    confirmText: t('ScreenShare.StopConfirm'),
    cancelText: t('ScreenShare.Cancel'),
  });
  if (!confirmed) {
    return;
  }
  const failure = await stop();
  if (failure) {
    TUIToast.error(t(`ScreenShare.Failure.${failure}`));
  }
}
