import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCam, IconMic } from '../../base';
import { useI18n } from '../../i18n';
import type { DeviceFaultView } from './useDeviceFault';
import './DeviceFaultSheet.scss';

export interface DeviceFaultSheetProps {
  open: boolean;
  faultView: DeviceFaultView | null;
  host: HTMLElement | null;
  title: string;
  description: string;
  close: () => void;
}

export function DeviceFaultSheet(props: DeviceFaultSheetProps) {
  const {
    open,
    faultView,
    host,
    title,
    description,
    close,
  } = props;
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsOpen(true);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!(host && faultView && open)) {
    return null;
  }

  return createPortal(
    <div className={['device-fault-sheet-root', isOpen ? 'is-open' : ''].filter(Boolean).join(' ')}>
      <div className="device-fault-sheet-mask" onClick={() => close()} />
      <div
        className="device-fault-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="device-fault-sheet-handle" aria-hidden="true">
          <i />
        </div>
        <div className="device-fault-sheet-icon">
          {faultView.target === 'microphone' ? <IconMic size={24} /> : <IconCam size={24} />}
        </div>
        <h3 className="device-fault-sheet-title">
          {title}
        </h3>
        <p className="device-fault-sheet-body">
          {description}
        </p>
        <div className="device-fault-sheet-actions">
          {faultView.actions.map((action, index) => (
            <button
              key={action.labelKey}
              className={['device-fault-sheet-button', index === 0 ? 'is-primary' : ''].filter(Boolean).join(' ')}
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

export default DeviceFaultSheet;
