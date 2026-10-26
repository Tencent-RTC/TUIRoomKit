import { useRef } from 'react';
import { MirrorType, useDeviceState } from 'tuikit-atomicx-react/room';
import { IconFlipCamera } from '../../../base';
import { useI18n } from '../../../i18n';
import './SwitchCameraButton.scss';

export function SwitchCameraButton() {
  const { t } = useI18n();
  const { isFrontCamera, switchCamera, localMirrorType, switchMirror } = useDeviceState();

  /* The back camera never mirrors, and the front camera's setting comes back on the
     return trip. */
  const lastLocalFrontCameraMirrorRef = useRef(
    isFrontCamera ? localMirrorType : MirrorType.Auto,
  );

  async function handleSwitchCamera() {
    // Capture before the await: hook values are render snapshots, unlike Vue refs.
    const wasFront = isFrontCamera;
    await switchCamera({ isFrontCamera: !wasFront });
    if (!wasFront) {
      await switchMirror({ mirror: lastLocalFrontCameraMirrorRef.current });
      return;
    }
    lastLocalFrontCameraMirrorRef.current = localMirrorType;
    await switchMirror({ mirror: MirrorType.Disable });
  }

  return (
    <button
      className="switch-camera"
      type="button"
      aria-label={t('Device.FlipCamera')}
      onClick={() => {
        void handleSwitchCamera();
      }}
    >
      <IconFlipCamera size={20} />
    </button>
  );
}

export default SwitchCameraButton;
