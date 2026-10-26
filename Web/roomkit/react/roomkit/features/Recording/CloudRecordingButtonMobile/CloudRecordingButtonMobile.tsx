import { useEffect, useRef, useState } from 'react';
import {
  RecordingStatus,
  RoomParticipantRole,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { IconRecord, IconRecording, TUIMessageBox, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import { getRoomErrorKey } from '../../../utils/roomError';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';

/** Cloud recording is enabled per SDKAppID in the console; the engine reports that gap with this code. */
const ERROR_RECORDING_NOT_ENABLED = 101072;

const START_RECORDING_ERROR = {
  featureErrors: { [ERROR_RECORDING_NOT_ENABLED]: 'CloudRecording.StartError_101072' },
  fallback: 'CloudRecording.StartError',
};

const STOP_RECORDING_ERROR = {
  fallback: 'CloudRecording.StopError',
};

export interface CloudRecordingButtonMobileProps {
  onClick?: () => void;
}

export function CloudRecordingButtonMobile({ onClick }: CloudRecordingButtonMobileProps = {}) {
  const { t } = useI18n();
  const { currentRoom, startRecording, stopRecording } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const { localParticipant } = useRoomParticipantState();

  const [isBusy, setIsBusy] = useState(false);

  const isRecording = currentRoom?.recordingInfo?.status === RecordingStatus.Recording;

  /**
   * Ownership reads from the room record; admin falls back to the local participant.
   * The participant list stays empty until something calls getParticipantList(), so a
   * missing local row has to fail closed instead of handing out the control.
   */
  const canRecord = (() => {
    const userId = loginUserInfo?.userId;
    if (!userId) {
      return false;
    }
    if (currentRoom?.roomOwner?.userId === userId) {
      return true;
    }
    return localParticipant?.role === RoomParticipantRole.Admin;
  })();

  const label = t(isRecording ? 'CloudRecording.RecordingLabel' : 'CloudRecording.RecordLabel');

  const actionConfirmRef = useRef<ReturnType<typeof TUIMessageBox.confirm> | null>(null);

  /** Another host acting, or a demotion, answers the pending question for us. */
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    actionConfirmRef.current?.close();
    actionConfirmRef.current = null;
  }, [isRecording, canRecord]);

  /* Vue's mobile flow folds the confirm into one click handler; the PC flow splits it
     into start/stop helpers. The shared guards stay identical. */
  async function handleClick() {
    if (!canRecord || isBusy) {
      return;
    }
    onClick?.();
    const stop = isRecording;
    const pending = TUIMessageBox.confirm(stop
      ? {
        title: t('CloudRecording.StopTitle'),
        message: t('CloudRecording.StopContent'),
        confirmText: t('CloudRecording.StopConfirm'),
        cancelText: t('CloudRecording.Cancel'),
      }
      : {
        title: t('CloudRecording.StartTitle'),
        message: t('CloudRecording.StartContent'),
        confirmText: t('CloudRecording.StartConfirm'),
        cancelText: t('CloudRecording.Cancel'),
      });
    actionConfirmRef.current = pending;
    const confirmed = await pending;
    if (actionConfirmRef.current === pending) {
      actionConfirmRef.current = null;
    }
    if (!confirmed) {
      return;
    }
    setIsBusy(true);
    try {
      if (stop) {
        await stopRecording();
        TUIToast.success(t('CloudRecording.EndTitle'));
      } else {
        await startRecording();
      }
    } catch (error) {
      console.error('[RoomKit.cloudRecording] Failed to toggle cloud recording:', error);
      TUIToast.error(t(getRoomErrorKey(error, stop ? STOP_RECORDING_ERROR : START_RECORDING_ERROR)));
    } finally {
      setIsBusy(false);
    }
  }

  if (!canRecord) {
    return null;
  }

  return (
    <ToolbarButtonMobile
      label={label}
      disabled={isBusy}
      onClick={() => {
        void handleClick();
      }}
    >
      {isRecording ? <IconRecording size={20} /> : <IconRecord size={20} />}
    </ToolbarButtonMobile>
  );
}

export default CloudRecordingButtonMobile;
