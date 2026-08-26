import type { CSSProperties } from 'react';
import { useState } from 'react';
import { IconUnSupport, Toast, useUIKit } from '@tencentcloud/uikit-base-component-react';
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
import { AudioIcon } from '../MicButton/AudioIcon';
import styles from './MicButtonH5.module.scss';

export interface MicButtonH5Props {
  showDescription?: boolean;
  customStyle?: CSSProperties;
  /**
   * Force-render the "permission denied" red-slash badge. Set by parent views
   * that listen to TUIRoomEvents.onError -1105 out-of-band.
   */
  hasPermissionError?: boolean;
  /** Fired when the user taps the button, so the parent can clear its denial flag. */
  onRetryPermission?: () => void;
}

export function MicButtonH5({
  showDescription = true,
  customStyle,
  hasPermissionError = false,
  onRetryPermission,
}: MicButtonH5Props) {
  const { t } = useUIKit();
  const { currentRoom } = useRoomState();
  const {
    currentMicVolume,
    testingMicVolume,
    microphoneStatus,
    microphoneLastError,
    isMicrophoneTesting,
    openLocalMicrophone,
    startMicrophoneTest,
    stopMicrophoneTest,
  } = useDeviceState();
  const {
    localParticipant,
    muteMicrophone,
    unmuteMicrophone,
  } = useRoomParticipantState();

  const [isProcessing, setIsProcessing] = useState(false);

  const isOwnerOrAdmin =
    localParticipant?.role === RoomParticipantRole.Owner ||
    localParticipant?.role === RoomParticipantRole.Admin;
  const isMicrophoneOn = microphoneStatus === DeviceStatus.On;
  const isMicrophoneDisabled =
    !isOwnerOrAdmin &&
    !isMicrophoneOn &&
    Boolean(currentRoom?.isAllMicrophoneDisabled);

  // Pre-room preview branch adds `microphoneLastError !== NoError` on top of
  // Vue reference for the same reason as CameraButtonH5: cover the window
  // where atomicx still reports `isMicrophoneTesting=true` after a capture
  // failure. Ensures the mute icon reflects the actual capture state.
  const isMuted = currentRoom
    ? microphoneStatus !== DeviceStatus.On
    : (!isMicrophoneTesting || microphoneLastError !== DeviceError.NoError);

  const hasNotSupportError = microphoneLastError !== DeviceError.NoError;

  const resolveTitle = (): string => {
    if (!showDescription) return '';
    return isMuted ? t('Microphone.Unmute') : t('Microphone.Mute');
  };
  const title = resolveTitle();

  const handleClickIcon = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    onRetryPermission?.();
    try {
      if (isMicrophoneDisabled) {
        Toast.warning({ message: t('Microphone.Disabled') });
        return;
      }
      if (!currentRoom) {
        if (isMicrophoneTesting) {
          await stopMicrophoneTest();
        } else {
          await startMicrophoneTest({ interval: 200 });
        }
        return;
      }
      if (microphoneStatus === DeviceStatus.On) {
        await conference.executeInterceptor(InterceptorAction.CloseMicrophone, async () => {
          await muteMicrophone();
        });
      } else {
        await conference.executeInterceptor(InterceptorAction.OpenMicrophone, async () => {
          await openLocalMicrophone();
          await unmuteMicrophone();
        });
      }
    } catch (error) {
      handleMediaCaptureError({ error, deviceType: DeviceType.Microphone });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.audioControl}>
      <IconButtonH5
        title={title}
        disabled={isMicrophoneDisabled}
        customStyle={customStyle}
        onClick={handleClickIcon}
      >
        <div className={styles.audioIconContainer}>
          <AudioIcon
            audioVolume={isMicrophoneTesting ? testingMicVolume : currentMicVolume}
            isMuted={isMuted}
          />
          {(hasNotSupportError || hasPermissionError) && (
            <IconUnSupport className={styles.unSupportIcon} size="14" />
          )}
        </div>
      </IconButtonH5>
    </div>
  );
}
