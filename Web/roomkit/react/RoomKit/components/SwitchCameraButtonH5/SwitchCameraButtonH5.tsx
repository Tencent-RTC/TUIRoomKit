import { useRef } from 'react';
import { IconCameraSwitch } from '@tencentcloud/uikit-base-component-react';
import { MirrorType, useDeviceState } from 'tuikit-atomicx-react/room';

export function SwitchCameraButtonH5() {
  const { isFrontCamera, switchCamera, localMirrorType, switchMirror } = useDeviceState();

  const lastLocalFrontCameraMirrorRef = useRef<MirrorType>(
    isFrontCamera ? localMirrorType : MirrorType.Auto,
  );

  const handleSwitchCamera = async () => {
    await switchCamera({ isFrontCamera: !isFrontCamera });
    const newIsFrontCamera = !isFrontCamera;
    if (newIsFrontCamera) {
      await switchMirror({ mirror: lastLocalFrontCameraMirrorRef.current });
    } else {
      lastLocalFrontCameraMirrorRef.current = localMirrorType;
      await switchMirror({ mirror: MirrorType.Disable });
    }
  };

  return <IconCameraSwitch size="20" onClick={handleSwitchCamera} />;
}
