import { computed, watch } from 'vue';
import { TUIMessageBox, useUIKit, TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import {
  useRoomParticipantState,
  useRoomState,
  RecordingStatus,
  RoomParticipantRole,
} from 'tuikit-atomicx-vue3/room';
import { getRoomErrorKey } from '../../utils/errorHandler';
import type { MessageBoxHandle } from '@tencentcloud/uikit-base-component-vue3';

const getRoomPage = () => document.getElementById('roomPage') ?? document.body;

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

  const isRecording = computed(() =>
    currentRoom.value?.recordingInfo?.status === RecordingStatus.Recording,
  );

  const isOwnerOrAdmin = computed(() =>
    localParticipant.value?.role === RoomParticipantRole.Owner
    || localParticipant.value?.role === RoomParticipantRole.Admin,
  );

  // Track the active action dialog so it can be dismissed on role/recording change
  let activeActionDialog: MessageBoxHandle | null = null;

  watch([isRecording, isOwnerOrAdmin], () => {
    activeActionDialog?.close();
    activeActionDialog = null;
  });

  // ---- user-initiated action dialogs ----

  function confirmStartRecording() {
    activeActionDialog = TUIMessageBox.confirm({
      title: t('CloudRecording.StartTitle'),
      content: t('CloudRecording.StartContent'),
      confirmText: t('CloudRecording.StartConfirm'),
      cancelText: t('CloudRecording.Cancel'),
      appendTo: getRoomPage(),
      callback: async (action?: string) => {
        activeActionDialog = null;
        if (action === 'confirm') {
          try {
            await startRecording();
          } catch (_error: any) {
            TUIToast({ message: t(getRoomErrorKey(_error, START_RECORDING_ERROR_OPTIONS)), type: TOAST_TYPE.ERROR });
          }
        }
      },
    });
  }

  function confirmStopRecording() {
    activeActionDialog = TUIMessageBox.confirm({
      title: t('CloudRecording.StopTitle'),
      content: t('CloudRecording.StopContent'),
      confirmText: t('CloudRecording.StopConfirm'),
      cancelText: t('CloudRecording.Cancel'),
      appendTo: getRoomPage(),
      callback: async (action?: string) => {
        activeActionDialog = null;
        if (action === 'confirm') {
          try {
            await stopRecording();
          } catch (_error: any) {
            TUIToast({ message: t(getRoomErrorKey(_error, STOP_RECORDING_ERROR_OPTIONS)), type: TOAST_TYPE.ERROR });
          }
        }
      },
    });
  }

  function handleRecordingClick() {
    if (!isOwnerOrAdmin.value) {
      return;
    }
    if (isRecording.value) {
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
