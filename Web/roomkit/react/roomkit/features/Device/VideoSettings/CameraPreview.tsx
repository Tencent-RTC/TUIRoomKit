import { useEffect, useRef, useState } from 'react';
import { DeviceType, useDeviceState } from 'tuikit-atomicx-react/room';
import { TUILoading } from '../../../base';
import { useI18n } from '../../../i18n';
import { useDeviceFault } from '../useDeviceFault';
import './CameraPreview.scss';

export interface CameraPreviewProps {
  /* Exposed because effect panels can only apply to a running stream, and they need to
     know when there is one. Unbound it behaves as plain local state. */
  previewing?: boolean;
  onUpdatePreviewing?: (value: boolean) => void;
}

export function CameraPreview(props: CameraPreviewProps) {
  const { previewing, onUpdatePreviewing } = props;
  const { t } = useI18n();

  const [localPreviewing, setLocalPreviewing] = useState(false);
  const isPreviewing = previewing !== undefined ? previewing : localPreviewing;
  const onUpdatePreviewingRef = useRef(onUpdatePreviewing);
  onUpdatePreviewingRef.current = onUpdatePreviewing;

  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { startCameraTest, stopCameraTest } = useDeviceState();
  const { handleDeviceError } = useDeviceFault();

  function setIsPreviewing(value: boolean) {
    setLocalPreviewing(value);
    onUpdatePreviewingRef.current?.(value);
  }

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      if (!previewRef.current) {
        setIsLoading(false);
        return;
      }
      try {
        await startCameraTest({ view: previewRef.current });
        setIsPreviewing(true);
      } catch (error) {
        await handleDeviceError(DeviceType.Camera, error);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      setIsPreviewing(false);
      // The engine may already have torn the test view down on room leave.
      void stopCameraTest().catch(() => {});
    };
  }, []);

  return (
    <div className="camera-preview">
      <div ref={previewRef} className="camera-preview-view" />
      {isLoading && (
        <div className="camera-preview-loading">
          <TUILoading spinning />
        </div>
      )}
      {!isLoading && !isPreviewing && (
        <div className="camera-preview-empty">
          <span className="camera-preview-empty-title">
            {t('Settings.CameraPreviewUnavailable')}
          </span>
        </div>
      )}
    </div>
  );
}

export default CameraPreview;
