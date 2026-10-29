import { useContext, useEffect, useRef } from 'react';
import { DeviceStatus, useDeviceState } from 'tuikit-atomicx-react/room';
import { IconWhiteboard, TUIMessageBox, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import { ScreenShareEntryContext } from '../../ScreenShare/ScreenShareButton/useScreenShare';
import type { ScreenShareEntry } from '../../ScreenShare/ScreenShareButton/useScreenShare';
import { useWhiteboardState } from '../WhiteboardState';

/** Only works inside `ScreenShareButton`; renders nothing of its own. */
export function WhiteboardButton() {
  const { t } = useI18n();
  const { screenStatus } = useDeviceState();
  const { isWhiteboardOn, startWhiteboard, stopWhiteboard } = useWhiteboardState();
  const registry = useContext(ScreenShareEntryContext);

  async function openBoard() {
    if (screenStatus === DeviceStatus.On || isWhiteboardOn) {
      TUIToast.warning(t('Whiteboard.CloseScreenShareFirst'));
      return;
    }
    try {
      await startWhiteboard();
    } catch (error: unknown) {
      console.warn('[WhiteboardButton] open whiteboard failed:', error);
    }
  }

  async function closeBoard() {
    const confirmed = await TUIMessageBox.danger({
      title: t('Whiteboard.CloseConfirmTitle'),
      message: t('Whiteboard.CloseConfirmContent'),
      confirmText: t('Whiteboard.Close'),
      cancelText: t('ScreenShare.Cancel'),
    });
    if (confirmed) {
      await stopWhiteboard();
    }
  }

  const entry: ScreenShareEntry = {
    act: 'whiteboard',
    label: t('ScreenShare.TabWhiteboard'),
    icon: IconWhiteboard,
    active: isWhiteboardOn,
    stopLabel: t('Whiteboard.Close'),
    run: () => void openBoard(),
    stop: () => void closeBoard(),
  };
  const entryRef = useRef(entry);
  entryRef.current = entry;

  useEffect(() => {
    if (!registry) {
      console.warn('[WhiteboardButton] place it inside <ScreenShareButton>.');
      return undefined;
    }
    return registry.register(() => entryRef.current);
  }, [registry]);

  useEffect(() => {
    registry?.refresh();
  }, [registry, entry.active, entry.label, entry.stopLabel]);

  return null;
}

export default WhiteboardButton;
