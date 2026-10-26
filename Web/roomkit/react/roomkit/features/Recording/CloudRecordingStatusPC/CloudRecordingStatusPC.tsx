import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  RecordingStatus,
  RoomParticipantRole,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { TUIMessageBox, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import { getRoomErrorKey } from '../../../utils/roomError';
import './CloudRecordingStatusPC.scss';

export interface CloudRecordingStatusPCProps {
  className?: string;
  style?: CSSProperties;
}

export function CloudRecordingStatusPC(props: CloudRecordingStatusPCProps) {
  const { className, style } = props;
  const { t } = useI18n();
  const { currentRoom, stopRecording } = useRoomState();
  const { loginUserInfo } = useLoginState();
  const { localParticipant } = useRoomParticipantState();

  const isBusyRef = useRef(false);

  const isRecording = currentRoom?.recordingInfo?.status === RecordingStatus.Recording;

  /** Same fail-closed rule as CloudRecordingButton: owner from the room record, admin from the local row. */
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

  const stopConfirmRef = useRef<ReturnType<typeof TUIMessageBox.confirm> | null>(null);

  /** Another host stopping the recording, or a demotion, answers the pending question for us. */
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    stopConfirmRef.current?.close();
    stopConfirmRef.current = null;
  }, [isRecording, canRecord]);

  async function handleClick() {
    if (!canRecord || isBusyRef.current) {
      return;
    }
    const pending = TUIMessageBox.confirm({
      title: t('CloudRecording.StopTitle'),
      message: t('CloudRecording.StopContent'),
      confirmText: t('CloudRecording.StopConfirm'),
      cancelText: t('CloudRecording.Cancel'),
    });
    stopConfirmRef.current = pending;
    const confirmed = await pending;
    if (stopConfirmRef.current === pending) {
      stopConfirmRef.current = null;
    }
    if (!confirmed) {
      return;
    }
    isBusyRef.current = true;
    try {
      await stopRecording();
      TUIToast.success(t('CloudRecording.EndTitle'));
    } catch (error) {
      console.error('[RoomKit.stopRecording] Failed to stop cloud recording:', error);
      TUIToast.error(t(getRoomErrorKey(error, { fallback: 'CloudRecording.StopError' })));
    } finally {
      isBusyRef.current = false;
    }
  }

  if (!isRecording) {
    return null;
  }

  return (
    <div
      className={[
        'cloud-recording-status',
        canRecord ? 'is-clickable' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={style}
      role="status"
      onClick={() => {
        void handleClick();
      }}
    >
      <span className="cloud-recording-status-dot" aria-hidden="true" />
      <span>{t('CloudRecording.StatusLabel')}</span>
    </div>
  );
}

export default CloudRecordingStatusPC;
