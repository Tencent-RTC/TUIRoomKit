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
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';

/** Cloud recording is enabled per SDKAppID in the console; the engine reports that gap with this code. */
const ERROR_RECORDING_NOT_ENABLED = 101072;

const START_RECORDING_ERROR = {
  featureErrors: { [ERROR_RECORDING_NOT_ENABLED]: 'CloudRecording.StartError_101072' },
  fallback: 'CloudRecording.StartError',
};

const STOP_RECORDING_ERROR = {
  fallback: 'CloudRecording.StopError',
};

export function CloudRecordingButtonPC() {
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

  async function askConfirm(options: Parameters<typeof TUIMessageBox.confirm>[0]) {
    const pending = TUIMessageBox.confirm(options);
    actionConfirmRef.current = pending;
    const confirmed = await pending;
    if (actionConfirmRef.current === pending) {
      actionConfirmRef.current = null;
    }
    return confirmed;
  }

  async function startWithConfirm() {
    const confirmed = await askConfirm({
      title: t('CloudRecording.StartTitle'),
      message: t('CloudRecording.StartContent'),
      confirmText: t('CloudRecording.StartConfirm'),
      cancelText: t('CloudRecording.Cancel'),
    });
    if (!confirmed) {
      return;
    }
    setIsBusy(true);
    try {
      await startRecording();
    } catch (error) {
      console.error('[RoomKit.startRecording] Failed to start cloud recording:', error);
      TUIToast.error(t(getRoomErrorKey(error, START_RECORDING_ERROR)));
    } finally {
      setIsBusy(false);
    }
  }

  async function stopWithConfirm() {
    const confirmed = await askConfirm({
      title: t('CloudRecording.StopTitle'),
      message: t('CloudRecording.StopContent'),
      confirmText: t('CloudRecording.StopConfirm'),
      cancelText: t('CloudRecording.Cancel'),
    });
    if (!confirmed) {
      return;
    }
    setIsBusy(true);
    try {
      await stopRecording();
      TUIToast.success(t('CloudRecording.EndTitle'));
    } catch (error) {
      console.error('[RoomKit.stopRecording] Failed to stop cloud recording:', error);
      TUIToast.error(t(getRoomErrorKey(error, STOP_RECORDING_ERROR)));
    } finally {
      setIsBusy(false);
    }
  }

  function handleClick() {
    if (!canRecord) {
      return;
    }
    void (isRecording ? stopWithConfirm() : startWithConfirm());
  }

  if (!canRecord) {
    return null;
  }

  return (
    <ToolbarButtonPC
      label={label}
      icon={isRecording ? IconRecording : IconRecord}
      loading={isBusy}
      onClick={handleClick}
    />
  );
}

export default CloudRecordingButtonPC;
