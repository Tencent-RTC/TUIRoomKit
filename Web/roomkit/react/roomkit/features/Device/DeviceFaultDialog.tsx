import { createPortal } from 'react-dom';
import { IconCam, IconLock, IconMic, IconWarning } from '../../base';
import { useI18n } from '../../i18n';
import type { DeviceFaultView } from './useDeviceFault';
import './DeviceFaultDialog.scss';

export interface DeviceFaultDialogProps {
  open: boolean;
  faultView: DeviceFaultView | null;
  host: HTMLElement | null;
  title: string;
  description: string;
  close: () => void;
}

export function DeviceFaultDialog(props: DeviceFaultDialogProps) {
  const {
    open,
    faultView,
    host,
    title,
    description,
    close,
  } = props;
  const { t } = useI18n();

  if (!(host && faultView && open)) {
    return null;
  }

  const isLock = faultView.kind === 'browser-blocked' || faultView.kind === 'system-blocked';

  let icon;
  if (isLock) {
    icon = <IconLock size={22} />;
  } else if (faultView.kind === 'no-device' && faultView.target === 'camera') {
    icon = <IconCam size={22} />;
  } else if (faultView.kind === 'no-device' && faultView.target === 'microphone') {
    icon = <IconMic size={22} />;
  } else {
    icon = <IconWarning size={22} />;
  }

  return createPortal(
    <div
      className="device-fault-dialog-mask"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div className="device-fault-dialog" role="dialog" aria-modal="true">
        <div
          className={['device-fault-dialog-icon', isLock ? 'is-lock' : ''].filter(Boolean).join(' ')}
        >
          {icon}
        </div>
        <h3 className="device-fault-dialog-title">
          {title}
        </h3>
        <p className="device-fault-dialog-body">
          {description}
        </p>
        <div className="device-fault-dialog-actions">
          {faultView.actions.map((action, index) => (
            <button
              key={action.labelKey}
              className={['device-fault-dialog-button', index === 0 ? 'is-primary' : ''].filter(Boolean).join(' ')}
              type="button"
              onClick={() => action.run()}
            >
              {t(action.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>,
    host,
  );
}

export default DeviceFaultDialog;
