import type React from 'react';
import {
  IconAudioClose,
  IconAudioOpen,
  IconScreenOpen,
  IconUser,
  IconVideoClose,
  IconVideoOpen,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import {
  useRoomParticipantState,
  useRoomState,
  Avatar,
  DeviceStatus,
  RoomParticipantRole,
  RoomType,
} from 'tuikit-atomicx-react/room';
import styles from './ParticipantItem.module.scss';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

interface Props {
  participant: RoomParticipant;
  isLocal: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  children?: React.ReactNode;
}

export function ParticipantItem({ participant, isActive, onActivate, onDeactivate, children }: Props) {
  const { t } = useUIKit();
  const { localParticipant } = useRoomParticipantState();
  const { currentRoom } = useRoomState();

  const isWebinar = currentRoom?.roomType === RoomType.Webinar;
  const isOwner = participant.role === RoomParticipantRole.Owner;
  const isAdmin = participant.role === RoomParticipantRole.Admin;
  const isMe = localParticipant?.userId === participant.userId;
  const displayName = participant.nameCard || participant.userName || participant.userId;

  const roleLabel = (() => {
    if (isOwner && isMe) {
      return `${t('ParticipantList.Host')}, ${t('ParticipantList.Me')}`;
    }
    if (isOwner) {
      return t('ParticipantList.Host');
    }
    if (isAdmin && isMe) {
      return `${t('ParticipantList.Admin')}, ${t('ParticipantList.Me')}`;
    }
    if (isAdmin) {
      return t('ParticipantList.Admin');
    }
    if (isMe) {
      return t('ParticipantList.Me');
    }
    return '';
  })();

  return (
    <div
      className={classNames(styles['participant-item'], { [styles.hovered]: isActive })}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
    >
      <div className={styles['user-info']}>
        <Avatar src={participant.avatarUrl} size={40} />
        <span className={styles['user-name']}>{displayName}</span>
        {(isOwner || isAdmin || roleLabel) && (
          <div className={styles['role-info']}>
            {(isOwner || isAdmin) && (
              <IconUser
                size="20"
                className={isAdmin ? styles['admin-icon'] : styles['master-icon']}
              />
            )}
            <div
              className={classNames(styles['user-extra-info'], {
                [styles['user-extra-info-admin']]: isAdmin,
              })}
            >
              {roleLabel}
            </div>
          </div>
        )}
      </div>

      {!isActive && (
        <div className={styles['member-av-state']}>
          {!isWebinar && participant.screenShareStatus === DeviceStatus.On && (
            <IconScreenOpen className={styles['state-icon']} />
          )}
          {participant.microphoneStatus === DeviceStatus.On
            ? <IconAudioOpen className={styles['state-icon']} />
            : <IconAudioClose className={styles['state-icon']} />}
          {!isWebinar && (
            participant.cameraStatus === DeviceStatus.On
              ? <IconVideoOpen className={styles['state-icon']} />
              : <IconVideoClose className={styles['state-icon']} />
          )}
        </div>
      )}

      {isActive && (
        <div className={styles['action-area']}>
          {children}
        </div>
      )}
    </div>
  );
}
