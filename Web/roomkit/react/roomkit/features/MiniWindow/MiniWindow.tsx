import { forwardRef, useContext, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { IconRestore, OVERLAY_CONTEXT_KEY, useUIConfig } from '../../base';
import { useI18n } from '../../i18n';
import { RoomLayoutTemplate } from '../../core/types';
import ToolbarButtonPC from '../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import CameraButton from '../Device/CameraButton/index';
import MicButton from '../Device/MicButton/index';
import RoomViewPC from '../RoomView/RoomViewPC/RoomViewPC';
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
  /* The picture-in-picture document needs the opener's theme carrier copied onto its
     mount point, and the provider already holds that element. */
  const overlay = useContext(OVERLAY_CONTEXT_KEY);
  const { minimized, container, minimize, restore, dismissAuto } = useMiniWindow(overlay?.root ?? null);
  const isPip = Boolean(container);
  const { theme } = uiConfig;

  useImperativeHandle(ref, () => ({ minimize, restore, dismissAuto }), [minimize, restore, dismissAuto]);

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
        <RoomViewPC layoutTemplate={RoomLayoutTemplate.SingleLayout} hideActions />
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
