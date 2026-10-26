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
import { IconMicOff, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';
import { useDeviceFault } from '../useDeviceFault';
import MicLevelIcon from './MicLevelIcon';
import './MicButtonMobile.scss';

export function MicButtonMobile() {
  const { t } = useI18n();

  const { microphoneStatus, microphoneLastError, openLocalMicrophone } = useDeviceState();
  const { currentRoom } = useRoomState();
  const { localParticipant, muteMicrophone, unmuteMicrophone } = useRoomParticipantState();
  const { handleDeviceError, microphoneFault } = useDeviceFault();

  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const microphoneOn = microphoneStatus === DeviceStatus.On;
  const hasDeviceError = microphoneLastError !== DeviceError.NoError || !!microphoneFault;
  const isPrivileged = localParticipant?.role === RoomParticipantRole.Owner
    || localParticipant?.role === RoomParticipantRole.Admin;

  /** Host and admin keep control; others cannot unmute while the room mutes everyone. */
  const isMicrophoneDisabled = (isPrivileged || microphoneOn)
    ? false
    : !!currentRoom?.isAllMicrophoneDisabled;

  async function toggleMicrophone() {
    if (isProcessingRef.current) {
      return;
    }
    if (isMicrophoneDisabled) {
      TUIToast.warning(t('Device.AllMicDisabled'));
      return;
    }
    const wasOn = microphoneOn;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      if (wasOn) {
        await muteMicrophone();
      } else {
        await openLocalMicrophone();
        await unmuteMicrophone();
      }
    } catch (error) {
      if (wasOn) {
        TUIToast.error(t('Device.MicCloseFailed'));
        return;
      }
      void handleDeviceError(DeviceType.Microphone, error);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }

  return (
    <ToolbarButtonMobile
      label={microphoneOn ? t('Device.MicClose') : t('Device.MicOpen')}
      blocked={isMicrophoneDisabled}
      disabled={isProcessing}
      onClick={() => {
        void toggleMicrophone();
      }}
    >
      {microphoneOn ? <MicLevelIcon size={20} /> : <IconMicOff size={20} />}
      {hasDeviceError && <span className="mic-button-mobile-fault">!</span>}
    </ToolbarButtonMobile>
  );
}

export default MicButtonMobile;
