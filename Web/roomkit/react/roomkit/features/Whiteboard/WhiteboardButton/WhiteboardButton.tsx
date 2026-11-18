import { useContext, useEffect, useRef } from 'react';
import { IconWhiteboard, TUIMessageBox } from '../../../base';
import { useI18n } from '../../../i18n';
import { SCREEN_SHARE_ENTRY_KEY, useScreenShare } from '../../ScreenShare/useScreenShare';
import type { ScreenShareEntry } from '../../ScreenShare/useScreenShare';
import { useWhiteboardState } from '../WhiteboardState';

/** Only works inside `ScreenShareButton`; renders nothing of its own. */
export function WhiteboardButton() {
  const { t } = useI18n();
  const { holder } = useScreenShare();
  const { startWhiteboard, stopWhiteboard } = useWhiteboardState();
  const registry = useContext(SCREEN_SHARE_ENTRY_KEY);

  /** The share control only offers the board while the slot is free and the user may take it. */
  async function openBoard() {
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
    command: 'whiteboard',
    label: t('ScreenShare.TabWhiteboard'),
    icon: IconWhiteboard,
    // From the click on, like every other reader of the slot, so the control and the more menu agree.
    active: holder === 'local-board',
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
