import { useRef, useState } from 'react';
import { MirrorType, useDeviceState } from 'tuikit-atomicx-react/room';
import { IconFlipCamera } from '../../../base';
import { useI18n } from '../../../i18n';
import './SwitchCameraButton.scss';

/* isFrontCamera only updates once switchCamera resolves, so overlapping flips would
   all aim the same way and save the back camera's Disable as the front setting.
   A flip that never settles frees the button after FLIP_TIMEOUT_MS; once a newer
   flip has started, the stale one neither applies its mirror nor clears the lock. */
const FLIP_TIMEOUT_MS = 5000;

export function SwitchCameraButton() {
  const { t } = useI18n();
  const { isFrontCamera, switchCamera, localMirrorType, switchMirror } = useDeviceState();

  /* The back camera never mirrors, and the front camera's setting comes back on the
     return trip. */
  const lastLocalFrontCameraMirrorRef = useRef(
    isFrontCamera ? localMirrorType : MirrorType.Auto,
  );
  const [isPending, setIsPending] = useState(false);
  const isPendingRef = useRef(false);
  const flipIdRef = useRef(0);

  function setPending(value: boolean) {
    isPendingRef.current = value;
    setIsPending(value);
  }

  async function handleSwitchCamera() {
    if (isPendingRef.current) {
      return;
    }
    const id = ++flipIdRef.current;
    setPending(true);
    const timer = setTimeout(() => {
      if (id === flipIdRef.current) {
        setPending(false);
      }
    }, FLIP_TIMEOUT_MS);
    try {
      // Capture before the await: hook values are render snapshots, unlike Vue refs.
      const toFront = !isFrontCamera;
      if (!toFront) {
        lastLocalFrontCameraMirrorRef.current = localMirrorType;
      }
      await switchCamera({ isFrontCamera: toFront });
      if (id !== flipIdRef.current) {
        return;
      }
      await switchMirror({
        mirror: toFront ? lastLocalFrontCameraMirrorRef.current : MirrorType.Disable,
      });
    } finally {
      clearTimeout(timer);
      if (id === flipIdRef.current) {
        setPending(false);
      }
    }
  }

  return (
    <button
      className={['switch-camera', isPending ? 'is-pending' : ''].filter(Boolean).join(' ')}
      type="button"
      disabled={isPending}
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
