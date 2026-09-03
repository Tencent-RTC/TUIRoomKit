import { useEffect, useRef, useState } from 'react';
import { Button, useUIKit, Toast } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import { useRoomState, Avatar, RoomParticipantStatus } from 'tuikit-atomicx-react/room';
import styles from './PendingParticipantItem.module.scss';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

interface Props {
  userInfo: RoomParticipant;
}

export function PendingParticipantItem({ userInfo }: Props) {
  const { t } = useUIKit();
  const [isHovered, setIsHovered] = useState(false);
  const [showRejectedMessage, setShowRejectedMessage] = useState(false);
  const rejectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { currentRoom, callUserToRoom } = useRoomState();

  const displayName = userInfo.userName || userInfo.userId;

  useEffect(() => {
    if (rejectedTimerRef.current) {
      clearTimeout(rejectedTimerRef.current);
      rejectedTimerRef.current = null;
    }

    if (userInfo.roomStatus === RoomParticipantStatus.CallRejected) {
      setShowRejectedMessage(true);
      rejectedTimerRef.current = setTimeout(() => {
        setShowRejectedMessage(false);
        rejectedTimerRef.current = null;
      }, 3000);
    } else {
      setShowRejectedMessage(false);
    }

    return () => {
      if (rejectedTimerRef.current) {
        clearTimeout(rejectedTimerRef.current);
      }
    };
  }, [userInfo.roomStatus]);

  async function handleInvite() {
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
  }

  return (
    <div
      className={classNames(styles['unjoined-user-item'], { [styles.hovered]: isHovered })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles['user-info']}>
        <Avatar src={userInfo.avatarUrl} size={40} />
        <span className={styles['user-name']}>{displayName}</span>
      </div>

      <div className={styles['status-container']}>
        {showRejectedMessage && <span className={styles['status-text']}>{t('ParticipantList.NotJoin')}</span>}
        {userInfo.roomStatus === RoomParticipantStatus.InCalling
          ? (
            <span className={styles['status-text']}>{t('ParticipantList.Calling')}</span>
          )
          : (
            <Button type="primary" onClick={handleInvite}>
              {t('ParticipantList.Call')}
            </Button>
          )}
      </div>
    </div>
  );
}
