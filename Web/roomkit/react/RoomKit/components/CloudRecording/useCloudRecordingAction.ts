import { useEffect, useRef } from 'react';
import { MessageBox, Toast, useUIKit, TOAST_TYPE } from '@tencentcloud/uikit-base-component-react';
import {
  RoomParticipantRole,
  RecordingStatus,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { getRoomErrorKey } from '../../utils/errorHandler';
import type { MessageBoxHandle } from '@tencentcloud/uikit-base-component-react';

const getRoomPage = (): HTMLElement => document.getElementById('roomPage') ?? document.body;

const START_RECORDING_ERROR_OPTIONS = {
  featureErrors: { 101072: 'CloudRecording.StartError_101072' },
  fallback: 'CloudRecording.StartError',
} as const;

const STOP_RECORDING_ERROR_OPTIONS = {
  fallback: 'CloudRecording.StopError',
} as const;

export function useCloudRecordingAction() {
  const { t } = useUIKit();
  const { currentRoom, startRecording, stopRecording } = useRoomState();
  const { localParticipant } = useRoomParticipantState();

  const isRecording = currentRoom?.recordingInfo?.status === RecordingStatus.Recording;
  const isOwnerOrAdmin
    = localParticipant?.role === RoomParticipantRole.Owner
      || localParticipant?.role === RoomParticipantRole.Admin;

  // Track the active action dialog so it can be dismissed on role/recording change
  const activeActionDialogRef = useRef<MessageBoxHandle | null>(null);

  useEffect(() => {
    activeActionDialogRef.current?.close();
    activeActionDialogRef.current = null;
  }, [isRecording, isOwnerOrAdmin]);

  function confirmStartRecording() {
    activeActionDialogRef.current = MessageBox.confirm({
      title: t('CloudRecording.StartTitle'),
      content: t('CloudRecording.StartContent'),
      confirmText: t('CloudRecording.StartConfirm'),
      cancelText: t('CloudRecording.Cancel'),
      appendTo: getRoomPage(),
      callback: async (action?: string) => {
        activeActionDialogRef.current = null;
        if (action === 'confirm') {
          try {
            await startRecording();
          } catch (error: unknown) {
            console.error('startRecording error', error);
            Toast({ message: t(getRoomErrorKey(error, START_RECORDING_ERROR_OPTIONS)), type: TOAST_TYPE.ERROR });
          }
        }
      },
    });
  }

  function confirmStopRecording() {
    activeActionDialogRef.current = MessageBox.confirm({
      title: t('CloudRecording.StopTitle'),
      content: t('CloudRecording.StopContent'),
      confirmText: t('CloudRecording.StopConfirm'),
      cancelText: t('CloudRecording.Cancel'),
      appendTo: getRoomPage(),
      callback: async (action?: string) => {
        activeActionDialogRef.current = null;
        if (action === 'confirm') {
          try {
            await stopRecording();
          } catch (error: unknown) {
            console.error('stopRecording error', error);
            Toast({ message: t(getRoomErrorKey(error, STOP_RECORDING_ERROR_OPTIONS)), type: TOAST_TYPE.ERROR });
          }
        }
      },
    });
  }

  function handleRecordingClick() {
    if (!isOwnerOrAdmin) {
      return;
    }
    if (isRecording) {
      confirmStopRecording();
    } else {
      confirmStartRecording();
    }
  }

  return {
    isRecording,
    isOwnerOrAdmin,
    handleRecordingClick,
    confirmStopRecording,
  };
}
