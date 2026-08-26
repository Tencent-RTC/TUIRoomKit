import { useMemo, useState } from 'react';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  Button,
  IconEndRoom,
  MessageBox,
  Popup,
  Toast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import {
  Avatar,
  RoomParticipantRole,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { RoomEvent as ConferenceRoomEvent } from '../../adapter/type';
import { eventCenter } from '../../utils/eventCenter';
import { PopUpArrowDown } from '../base/PopUpArrowDown';
import styles from './LeaveRoomButtonH5.module.scss';

export interface LeaveRoomButtonH5Props {
  onLeave?: () => void;
  onEnd?: () => void;
}

// Vue reference: LeaveRoomButtonH5/index.vue (436 lines).
// AI-tools / ASR stop hook (`useASRToolsState.stopASR`) is out of scope for
// the H5 first pass — safely skipped.
export function LeaveRoomButtonH5({ onLeave, onEnd }: LeaveRoomButtonH5Props) {
  const { t } = useUIKit();
  const {
    currentRoom,
    leaveRoom: leaveRoomStateApi,
    endRoom: endRoomStateApi,
  } = useRoomState();
  const { localParticipant, participantList, transferOwner }
    = useRoomParticipantState();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const otherParticipants = useMemo(
    () =>
      participantList.filter(p => p.userId !== localParticipant?.userId),
    [participantList, localParticipant?.userId],
  );

  const dialogMessage
    = otherParticipants.length === 0
      ? t('Room.LeaveRoomTip')
      : t('Room.ConfirmLeaveTip');

  const leaveRoom = async () => {
    try {
      return await leaveRoomStateApi();
    } catch (error) {
      if ((error as { code?: number })?.code === TUIErrorCode.ERR_INVALID_PARAMETER) {
        return Promise.resolve();
      }
      throw error;
    }
  };

  const endRoom = async () => {
    try {
      return await endRoomStateApi();
    } catch (error) {
      if ((error as { code?: number })?.code === TUIErrorCode.ERR_INVALID_PARAMETER) {
        return Promise.resolve();
      }
      throw error;
    }
  };

  const performLeave = async () => {
    try {
      if (!currentRoom?.roomId) {
        return;
      }
      await leaveRoom();
      onLeave?.();
    } catch (_error) {
      Toast.error({ message: t('Room.LeaveRoomFailed') });
    }
  };

  const handleEndRoom = async () => {
    if (!currentRoom?.roomId || isEnding) {
      return;
    }
    try {
      setIsEnding(true);
      const roomInfo = currentRoom ? { ...currentRoom } : null;
      await endRoom();
      setShowConfirmDialog(false);
      if (roomInfo?.roomId) {
        eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS, { roomInfo });
      }
      onEnd?.();
    } catch (_error) {
      Toast.error({ message: t('Room.EndRoomFailed') });
    } finally {
      setIsEnding(false);
    }
  };

  const handleParticipantClick = (userId: string) => {
    setSelectedUserId(prev => (prev === userId ? '' : userId));
  };

  const autoTransferAndLeave = async () => {
    if (otherParticipants.length !== 1 || !currentRoom?.roomId) {
      return;
    }
    try {
      const target = otherParticipants[0];
      await transferOwner({ userId: target.userId });
      await leaveRoom();
      onLeave?.();
    } catch (_error) {
      Toast.error({ message: t('Room.TransferAndLeaveFailed') });
    }
  };

  const handleLeaveFromConfirmDialog = () => {
    setShowConfirmDialog(false);
    if (otherParticipants.length === 0) {
      performLeave();
      return;
    }
    if (otherParticipants.length === 1) {
      autoTransferAndLeave();
      return;
    }
    setShowTransferDialog(true);
    setSelectedUserId('');
  };

  const handleTransferAndLeave = async () => {
    if (!selectedUserId || !currentRoom?.roomId || isTransferring) {
      return;
    }
    try {
      setIsTransferring(true);
      await transferOwner({ userId: selectedUserId });
      await leaveRoom();
      setShowTransferDialog(false);
      onLeave?.();
    } catch (_error) {
      Toast.error({ message: t('Room.TransferAndLeaveFailed') });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleLeaveRoom = () => {
    if (!currentRoom?.roomId) {
      return;
    }
    const isOwner
      = localParticipant?.role === RoomParticipantRole.Owner;
    if (!isOwner) {
      MessageBox.confirm({
        title: t('Room.ConfirmLeaveTitle'),
        content: t('Room.ConfirmLeaveRoom'),
        callback: (action) => {
          if (action === 'confirm') {
            performLeave();
          }
        },
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  if (!currentRoom?.roomId) {
    return null;
  }

  return (
    <>
      <div className={styles.endRoomButton} onClick={handleLeaveRoom}>
        <IconEndRoom size="20" />
        <span>{t('Room.End')}</span>
      </div>

      <Popup
        visible={showConfirmDialog}
        onUpdateVisible={setShowConfirmDialog}
      >
        <div className={styles.popupContainer}>
          <PopUpArrowDown onClick={() => setShowConfirmDialog(false)} />
          <div className={styles.popupContent}>
            <div className={styles.popupMessage}>{dialogMessage}</div>
            <div className={styles.buttonContainer}>
              <div
                className={classNames(styles.buttonItem, styles.leaveRoom)}
                onClick={handleLeaveFromConfirmDialog}
              >
                {t('Room.LeaveRoom')}
              </div>
              <div
                className={classNames(styles.buttonItem, styles.endRoomClass)}
                onClick={() => handleEndRoom()}
              >
                {t('Room.EndRoom')}
              </div>
            </div>
          </div>
        </div>
      </Popup>

      <Popup
        visible={showTransferDialog}
        onUpdateVisible={setShowTransferDialog}
        height="90%"
      >
        <div className={styles.popupContainer}>
          <PopUpArrowDown onClick={() => setShowTransferDialog(false)} />
          <div className={styles.popupContent}>
            <div className={styles.popupTitle}>
              {t('Room.PleaseSelectNewHost')}
            </div>
            <div className={styles.participantList}>
              {otherParticipants.map(p => (
                <div
                  key={p.userId}
                  className={styles.participantItem}
                  onClick={() => handleParticipantClick(p.userId)}
                >
                  <Avatar src={p.avatarUrl} size={40} />
                  <div className={styles.userInfo}>
                    <span>{p.nameCard || p.userName || p.userId}</span>
                    {selectedUserId === p.userId && (
                      <div className={styles.selectedIndicator}>
                        <input checked readOnly type="checkbox" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.popupFooter}>
            <Button
              type="primary"
              style={{ minWidth: '100%' }}
              size="large"
              disabled={!selectedUserId}
              loading={isTransferring}
              onClick={() => handleTransferAndLeave()}
            >
              {t('Room.TransferAndLeave')}
            </Button>
          </div>
        </div>
      </Popup>
    </>
  );
}

// Local `classNames` — avoids one extra import for a two-arg helper.
function classNames(...cls: Array<string | false | undefined>) {
  return cls.filter(Boolean).join(' ');
}
