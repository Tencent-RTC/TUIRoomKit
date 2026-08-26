import type { CSSProperties } from 'react';
import { useState } from 'react';
import {
  IconCameraOff,
  IconCameraOn,
  IconUnSupport,
  Toast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import {
  DeviceError,
  DeviceStatus,
  DeviceType,
  RoomParticipantRole,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { conference } from '../../adapter/conference';
import { InterceptorAction } from '../../adapter/type';
import { handleMediaCaptureError } from '../../hooks/useMediaCaptureError';
import { IconButtonH5 } from '../base/IconButtonH5';
import styles from './CameraButtonH5.module.scss';

export interface CameraButtonH5Props {
  cameraTestContainer?: HTMLDivElement | string;
  showDescription?: boolean;
  customStyle?: CSSProperties;
  /**
   * Force-render the "permission denied" red-slash badge. Set by parent views
   * that listen to TUIRoomEvents.onError -1101 out-of-band, since atomicx's
   * cameraLastError only reflects promise rejections and misses the async
   * onError channel used when the browser rejects camera permission.
   */
  hasPermissionError?: boolean;
  /** Fired when the user taps the button, so the parent can clear its denial flag. */
  onRetryPermission?: () => void;
}

export function CameraButtonH5({
  cameraTestContainer,
  showDescription = true,
  customStyle,
  hasPermissionError = false,
  onRetryPermission,
}: CameraButtonH5Props) {
  const { t } = useUIKit();
  const {
    cameraStatus,
    cameraLastError,
    isCameraTesting,
    startCameraTest,
    stopCameraTest,
    openLocalCamera,
    closeLocalCamera,
  } = useDeviceState();
  const { currentRoom } = useRoomState();
  const { localParticipant } = useRoomParticipantState();

  const [isProcessing, setIsProcessing] = useState(false);

  const isOwnerOrAdmin =
    localParticipant?.role === RoomParticipantRole.Owner ||
    localParticipant?.role === RoomParticipantRole.Admin;
  const isCameraOn = cameraStatus === DeviceStatus.On;
  const isCameraDisabled =
    !isOwnerOrAdmin && !isCameraOn && Boolean(currentRoom?.isAllCameraDisabled);

  const resolveTitle = (): string => {
    if (!showDescription) return '';
    if (!currentRoom) {
      return isCameraTesting ? t('Camera.Stop') : t('Camera.Start');
    }
    return isCameraOn ? t('Camera.Stop') : t('Camera.Start');
  };
  const title = resolveTitle();

  const hasNotSupportError = cameraLastError !== DeviceError.NoError;

  const handleClickIcon = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    // Reset the parent-tracked denial flag so the red-slash badge disappears
    // while the browser re-prompts. If the user denies again, the onError
    // handler in PreviewView will re-set it.
    onRetryPermission?.();
    try {
      if (isCameraDisabled) {
        Toast.warning({ message: t('Camera.Disabled') });
        return;
      }
      if (!currentRoom && cameraTestContainer) {
        if (isCameraTesting) {
          await stopCameraTest();
        } else {
          await startCameraTest({ view: cameraTestContainer });
        }
        return;
      }
      if (localParticipant?.cameraStatus === DeviceStatus.On) {
        await conference.executeInterceptor(InterceptorAction.CloseCamera, async () => {
          await closeLocalCamera();
        });
      } else {
        await conference.executeInterceptor(InterceptorAction.OpenCamera, async () => {
          await openLocalCamera();
        });
      }
    } catch (error) {
      handleMediaCaptureError({ error, deviceType: DeviceType.Camera });
    } finally {
      setIsProcessing(false);
    }
  };

  // Pre-room preview branch adds `!hasNotSupportError` on top of the Vue
  // reference: if camera capture failed (permission denied, occupied, etc.)
  // the button shouldn't render "On" even though atomicx may briefly leave
  // `isCameraTesting=true` from the still-pending success path. Vue H5 relies
  // on Vue's proxy reactivity to reconcile faster; React's valtio snapshot
  // needs this guard to avoid a visibly wrong Camera-On icon during the
  // error window.
  const showCameraOn = currentRoom
    ? isCameraOn
    : (isCameraTesting && !hasNotSupportError);

  const showUnSupportBadge = hasNotSupportError || hasPermissionError;

  return (
    <div className={styles.videoControl}>
      <IconButtonH5
        title={title}
        disabled={isCameraDisabled}
        customStyle={customStyle}
        onClick={handleClickIcon}
      >
        <div className={styles.videoIconContainer}>
          {showCameraOn ? (
            <IconCameraOn size="24" />
          ) : (
            <IconCameraOff size="24" />
          )}
          {showUnSupportBadge && (
            <IconUnSupport className={styles.unSupportIcon} size="14" />
          )}
        </div>
      </IconButtonH5>
    </div>
  );
}
