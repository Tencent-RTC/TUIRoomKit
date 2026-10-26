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
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import AudioDeviceMenu from '../AudioDeviceMenu/index';
import MicLevelIcon from './MicLevelIcon';
import { useDeviceFault } from '../useDeviceFault';

export interface MicButtonProps {
  hideMenu?: boolean;
}

export function MicButton(props: MicButtonProps) {
  const { hideMenu = false } = props;
  const { t } = useI18n();

  const { microphoneStatus, microphoneLastError, openLocalMicrophone } = useDeviceState();
  const { currentRoom } = useRoomState();
  const {
    localParticipant,
    muteMicrophone,
    unmuteMicrophone,
  } = useRoomParticipantState();
  const { handleDeviceError } = useDeviceFault();

  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const microphoneOn = microphoneStatus === DeviceStatus.On;
  const hasDeviceError = microphoneLastError !== DeviceError.NoError;
  const isPrivileged = localParticipant?.role === RoomParticipantRole.Owner
    || localParticipant?.role === RoomParticipantRole.Admin;

  /** Host and admin keep control; others cannot unmute while the room mutes everyone */
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
    <ToolbarButtonPC
      label={microphoneOn ? t('Device.MicClose') : t('Device.MicOpen')}
      icon={microphoneOn ? MicLevelIcon : IconMicOff}
      menuLabel={t('Device.MicSettings')}
      blocked={isMicrophoneDisabled}
      loading={isProcessing}
      notice={hasDeviceError}
      hideMenu={hideMenu}
      onClick={toggleMicrophone}
      menuSlot={() => <AudioDeviceMenu />}
    />
  );
}

export default MicButton;
