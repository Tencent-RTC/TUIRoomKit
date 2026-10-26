import { useRef, useState } from 'react';
import {
  DeviceError,
  DeviceStatus,
  DeviceType,
  RoomParticipantRole,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { IconCam, IconCamOff, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';
import { useDeviceFault } from '../useDeviceFault';
import './CameraButtonMobile.scss';

export function CameraButtonMobile() {
  const { t } = useI18n();

  const {
    cameraStatus,
    cameraLastError,
    openLocalCamera,
    closeLocalCamera,
  } = useDeviceState();
  const { currentRoom } = useRoomState();
  const { localParticipant } = useRoomParticipantState();
  const { handleDeviceError, cameraFault } = useDeviceFault();

  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const cameraOn = cameraStatus === DeviceStatus.On;
  const hasDeviceError = cameraLastError !== DeviceError.NoError || !!cameraFault;
  const isPrivileged = localParticipant?.role === RoomParticipantRole.Owner
    || localParticipant?.role === RoomParticipantRole.Admin;

  /** Host and admin keep control; others cannot open the camera while the room disables video. */
  const isCameraDisabled = (isPrivileged || cameraOn)
    ? false
    : !!currentRoom?.isAllCameraDisabled;

  async function toggleCamera() {
    if (isProcessingRef.current) {
      return;
    }
    if (isCameraDisabled) {
      TUIToast.warning(t('Device.AllCamDisabled'));
      return;
    }
    const wasOn = cameraOn;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      if (wasOn) {
        await closeLocalCamera();
      } else {
        await openLocalCamera();
      }
    } catch (error) {
      if (wasOn) {
        TUIToast.error(t('Device.CamCloseFailed'));
        return;
      }
      handleDeviceError(DeviceType.Camera, error);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }

  return (
    <ToolbarButtonMobile
      label={cameraOn ? t('Device.CamClose') : t('Device.CamOpen')}
      blocked={isCameraDisabled}
      disabled={isProcessing}
      onClick={() => {
        void toggleCamera();
      }}
    >
      {cameraOn ? <IconCam size={20} /> : <IconCamOff size={20} />}
      {hasDeviceError && <span className="camera-button-mobile-fault">!</span>}
    </ToolbarButtonMobile>
  );
}

export default CameraButtonMobile;
