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
import type { SettingsTab } from '../../Setting/SettingsDialogPC/SettingsDialogPC';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import VideoDeviceMenu from '../VideoDeviceMenu/index';
import { useDeviceFault } from '../useDeviceFault';

export interface CameraButtonProps {
  hideMenu?: boolean;
  /** The shell owns the settings dialog; the button only forwards which tab was asked for. */
  onOpenSetting?: (tab: SettingsTab) => void;
}

export function CameraButton(props: CameraButtonProps) {
  const { hideMenu = false, onOpenSetting } = props;
  const { t } = useI18n();

  const {
    cameraStatus,
    cameraLastError,
    openLocalCamera,
    closeLocalCamera,
  } = useDeviceState();
  const { currentRoom } = useRoomState();
  const { localParticipant } = useRoomParticipantState();
  const { handleDeviceError } = useDeviceFault();

  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const cameraOn = cameraStatus === DeviceStatus.On;
  const hasDeviceError = cameraLastError !== DeviceError.NoError;
  const isPrivileged = localParticipant?.role === RoomParticipantRole.Owner
    || localParticipant?.role === RoomParticipantRole.Admin;

  /** Host and admin keep control; others cannot open the camera while the room disables video */
  const isCameraDisabled = (isPrivileged || cameraOn)
    ? false
    : !!currentRoom?.isAllCameraDisabled;

  /** Dismiss the popover before the dialog takes over, so it is not left open behind the mask */
  function leaveForSetting(tab: SettingsTab, closeMenu: () => void) {
    closeMenu();
    onOpenSetting?.(tab);
  }

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
    <ToolbarButtonPC
      label={cameraOn ? t('Device.CamClose') : t('Device.CamOpen')}
      icon={cameraOn ? IconCam : IconCamOff}
      menuLabel={t('Device.VideoSettings')}
      blocked={isCameraDisabled}
      loading={isProcessing}
      notice={hasDeviceError}
      hideMenu={hideMenu}
      onClick={toggleCamera}
      menuSlot={({ close }) => (
        <VideoDeviceMenu onOpenSetting={tab => leaveForSetting(tab, close)} />
      )}
    />
  );
}

export default CameraButton;
