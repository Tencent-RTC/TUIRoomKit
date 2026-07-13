import { useEffect, useRef } from 'react';
import { MessageBox, Toast, useUIKit, TOAST_TYPE } from '@tencentcloud/uikit-base-component-react';
import {
  RoomEvent,
  RecordingStopReason,
  useLoginState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { RoomEvent as ConferenceRoomEvent } from '../../adapter/type';
import { getRoomErrorKey } from '../../utils/errorHandler';
import { eventCenter } from '../../utils/eventCenter';
import type { MessageBoxHandle } from '@tencentcloud/uikit-base-component-react';
import type { RoomInfo, RoomUser } from 'tuikit-atomicx-react/room';

const getRoomPage = (): HTMLElement => document.getElementById('roomPage') ?? document.body;

/**
 * Subscribes to cloud recording SDK events and shows the corresponding
 * notification dialogs. Call this only from Status components (PC + H5)
 * to ensure exactly one subscription exists per view.
 */
export function useCloudRecordingEvents() {
  const { t } = useUIKit();
  const { loginUserInfo } = useLoginState();
  const { leaveRoom, subscribeEvent, unsubscribeEvent } = useRoomState();

  const loginUserIdRef = useRef(loginUserInfo?.userId);
  loginUserIdRef.current = loginUserInfo?.userId;

  // Tracks the currently visible event-notification dialog so we can dismiss it
  // before showing a new one, preventing dialog pile-up.
  const activeDialogRef = useRef<MessageBoxHandle | null>(null);

  function showRecordingDialog(create: () => MessageBoxHandle) {
    activeDialogRef.current?.close();
    activeDialogRef.current = create();
  }

  function showRecordingNotifyDialog(operator: RoomUser) {
    if (operator.userId === loginUserIdRef.current) {
      return;
    }
    showRecordingDialog(() => MessageBox.confirm({
      title: t('CloudRecording.NotifyTitle'),
      content: t('CloudRecording.NotifyContent', { name: operator.userName || operator.userId }),
      confirmText: t('CloudRecording.NotifyConfirm'),
      cancelText: t('CloudRecording.NotifyCancel'),
      appendTo: getRoomPage(),
      callback: async (action?: string) => {
        if (action === 'cancel') {
          try {
            await leaveRoom();
            eventCenter.emit(ConferenceRoomEvent.ROOM_LEAVE);
          } catch (error: unknown) {
            Toast({ message: t(getRoomErrorKey(error)), type: TOAST_TYPE.ERROR });
          }
        }
      },
    }));
  }

  function showRecordingEndToast(operator: RoomUser, reason: RecordingStopReason) {
    if (operator.userId === loginUserIdRef.current) {
      return;
    }
    activeDialogRef.current?.close();
    activeDialogRef.current = null;

    const isAbnormal = reason === RecordingStopReason.RecorderLeftRoom;
    Toast({
      message: t(isAbnormal ? 'CloudRecording.EndAbnormal' : 'CloudRecording.EndTitle'),
      type: isAbnormal ? TOAST_TYPE.WARNING : TOAST_TYPE.INFO,
    });
  }

  useEffect(() => {
    const onRecordingStarted = ({ operator }: { roomInfo: RoomInfo; operator: RoomUser }) => {
      showRecordingNotifyDialog(operator);
    };

    const onRecordingStopped = ({ operator, reason }: { roomInfo: RoomInfo; operator: RoomUser; reason: RecordingStopReason }) => {
      showRecordingEndToast(operator, reason);
    };

    subscribeEvent(RoomEvent.onRecordingStarted, onRecordingStarted);
    subscribeEvent(RoomEvent.onRecordingStopped, onRecordingStopped);

    return () => {
      activeDialogRef.current?.close();
      activeDialogRef.current = null;
      unsubscribeEvent(RoomEvent.onRecordingStarted, onRecordingStarted);
      unsubscribeEvent(RoomEvent.onRecordingStopped, onRecordingStopped);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
