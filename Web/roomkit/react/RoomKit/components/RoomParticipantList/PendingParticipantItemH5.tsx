import { useEffect, useRef, useState } from 'react';
import { Button, Toast, useUIKit } from '@tencentcloud/uikit-base-component-react';
import {
  Avatar,
  RoomParticipantStatus,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import styles from './PendingParticipantItemH5.module.scss';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

export interface PendingParticipantItemH5Props {
  userInfo: RoomParticipant;
}

// Vue reference: RoomParticipantList/PendingParticipantItemH5.vue (164 lines).
export function PendingParticipantItemH5({
  userInfo,
}: PendingParticipantItemH5Props) {
  const { t } = useUIKit();
  const { currentRoom, callUserToRoom } = useRoomState();

  const displayName = userInfo?.userName || userInfo?.userId;

  // Match Vue `watch(roomStatus)` without `immediate`: only react to status
  // transitions, not the value already present when the row mounts. Otherwise
  // opening「未进房」flashes「暂不入会」for leftover CallRejected members.
  const [showRejectedMessage, setShowRejectedMessage] = useState(false);
  const prevRoomStatusRef = useRef(userInfo.roomStatus);
  useEffect(() => {
    const prevStatus = prevRoomStatusRef.current;
    prevRoomStatusRef.current = userInfo.roomStatus;

    if (
      userInfo.roomStatus === RoomParticipantStatus.CallRejected
      && prevStatus !== RoomParticipantStatus.CallRejected
    ) {
      setShowRejectedMessage(true);
      const timer = window.setTimeout(() => setShowRejectedMessage(false), 3000);
      return () => window.clearTimeout(timer);
    }

    if (userInfo.roomStatus !== RoomParticipantStatus.CallRejected) {
      setShowRejectedMessage(false);
    }
    return undefined;
  }, [userInfo.roomStatus]);

  const handleInvite = async () => {
    if (!currentRoom?.roomId) {
      return;
    }
    try {
      await callUserToRoom({
        roomId: currentRoom.roomId,
        userIdList: [userInfo.userId],
        timeout: 60,
      });
      Toast.success({ message: t('ParticipantList.InviteSuccess') });
    } catch (error) {
      Toast.error({ message: t('ParticipantList.InviteFailed') });
      // eslint-disable-next-line no-console
      console.error('Failed to invite user to room:', error);
    }
  };

  return (
    <div className={styles.pendingParticipantItemH5}>
      <Avatar src={userInfo.avatarUrl} size={40} />
      <div className={styles.participantContent}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{displayName}</span>
          <div className={styles.statusContainer}>
            {showRejectedMessage && <span>{t('ParticipantList.NotJoin')}</span>}
            {userInfo.roomStatus === RoomParticipantStatus.InCalling
              ? (
                <span>{t('ParticipantList.Calling')}</span>
              )
              : (
                <Button type="primary" onClick={() => handleInvite()}>
                  {t('ParticipantList.Call')}
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
