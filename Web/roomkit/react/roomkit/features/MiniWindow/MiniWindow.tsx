import { forwardRef, useContext, useEffect, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { DeviceStatus, useDeviceState } from 'tuikit-atomicx-react/room';
import { IconRestore, OVERLAY_CONTEXT_KEY, TUIToast, useUIConfig } from '../../base';
import { useI18n } from '../../i18n';
import { RoomLayoutTemplate } from '../../core/types';
import ToolbarButtonPC from '../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import CameraButton from '../Device/CameraButton/index';
import MicButton from '../Device/MicButton/index';
import RoomViewPC from '../RoomView/RoomViewPC/RoomViewPC';
import { useSingleStageStream } from '../RoomView/useParticipantStreams';
import { useWhiteboardState } from '../Whiteboard/WhiteboardState';
import { useMiniWindow } from './useMiniWindow';
import type { MinimizeOptions } from './useMiniWindow';
import './MiniWindow.scss';

export interface MiniWindowExpose {
  minimize: (options?: MinimizeOptions) => Promise<void>;
  restore: () => void;
  dismissAuto: () => void;
}

export const MiniWindow = forwardRef<MiniWindowExpose>((_props, ref) => {
  const { t } = useI18n();
  const { uiConfig } = useUIConfig();
  const { isSessionActive } = useWhiteboardState();
  const { stageStream } = useSingleStageStream();
  /* The picture-in-picture document needs the opener's theme carrier copied onto its
     mount point, and the provider already holds that element. */
  const overlay = useContext(OVERLAY_CONTEXT_KEY);
  const { screenStatus } = useDeviceState();
  const { minimized, container, minimize: openWindow, restore, dismissAuto, close } = useMiniWindow(
    overlay?.root ?? null,
  );
  const isPip = Boolean(container);
  const { theme } = uiConfig;

  /* The mini window cannot carry a board or an annotation, so either one keeps it shut from
     the moment it starts: before the SDK binds an annotation, and while a board is still
     faking the local share it has no picture for. A local screen share keeps it shut too. */
  const isScreenSharing = screenStatus === DeviceStatus.On;
  let blockedTip = '';
  if (isSessionActive) {
    blockedTip = 'Room.PipUnavailableWithWhiteboard';
  } else if (isScreenSharing) {
    blockedTip = 'Room.PipUnavailableWithScreenShare';
  }
  const blocked = Boolean(blockedTip);

  async function minimize(options?: MinimizeOptions) {
    if (blocked) {
      if (!options?.auto) {
        TUIToast.info(t(blockedTip));
      }
      return;
    }
    await openWindow(options);
  }

  // Also watches `minimized`, so a window that finishes opening after the session starts still closes.
  useEffect(() => {
    if (blocked && minimized) {
      close();
    }
  }, [blocked, minimized, close]);

  useImperativeHandle(ref, () => ({ minimize, restore, dismissAuto }));

  if (!minimized) {
    return null;
  }

  const node = (
    <div
      className={['rk-root mini-window', isPip ? 'mini-window-pip' : 'mini-window-floating'].join(' ')}
      data-rk-theme={theme}
    >
      <div className="mini-window-picture">
        {/* Info only: the tile chrome reads at this size, its more menu does not. */}
        <RoomViewPC layoutTemplate={RoomLayoutTemplate.SingleLayout} stageStream={stageStream} hideActions />
      </div>

      <div className="mini-window-controls">
        <MicButton hideMenu />
        <CameraButton hideMenu />
        <span className="mini-window-divider" />
        <ToolbarButtonPC
          label={t('Room.MiniRestore')}
          icon={IconRestore}
          onClick={restore}
        />
      </div>
    </div>
  );

  return isPip && container ? createPortal(node, container) : node;
});

MiniWindow.displayName = 'MiniWindow';

export default MiniWindow;
