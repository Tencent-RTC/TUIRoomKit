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
  Avatar,
  DeviceStatus,
  RoomParticipantRole,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import { useParticipantAction } from './useParticipantAction';
import styles from './ParticipantItemH5.module.scss';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

export interface ParticipantItemH5Props {
  participant: RoomParticipant;
  isLocal?: boolean;
  onClick?: (participant: RoomParticipant) => void;
}

// Vue reference: RoomParticipantList/ParticipantItemH5.vue (209 lines).
// Guard matches Vue's handleParticipantClick: if controlList is empty
// (e.g. general member tapping another member), do nothing — no state
// updates, no popup probe, no screen flash.
export function ParticipantItemH5({
  participant,
  onClick,
}: ParticipantItemH5Props) {
  const { t } = useUIKit();
  const { localParticipant } = useRoomParticipantState();
  const { controlList } = useParticipantAction({ targetParticipant: participant });

  const displayName
    = participant?.nameCard || participant?.userName || participant?.userId;

  const isOwner = participant?.role === RoomParticipantRole.Owner;
  const isAdmin = participant?.role === RoomParticipantRole.Admin;
  const isMe = localParticipant?.userId === participant.userId;

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

  const iconList: Array<{ Icon: typeof IconAudioOpen; key: string }> = [];
  if (participant?.screenShareStatus === DeviceStatus.On) {
    iconList.push({ Icon: IconScreenOpen, key: 'screen' });
  }
  iconList.push({
    Icon: participant?.microphoneStatus === DeviceStatus.On ? IconAudioOpen : IconAudioClose,
    key: 'mic',
  });
  iconList.push({
    Icon: participant?.cameraStatus === DeviceStatus.On ? IconVideoOpen : IconVideoClose,
    key: 'cam',
  });

  const handleClick = () => {
    if (controlList.length === 0) {
      return;
    }
    onClick?.(participant);
  };

  return (
    <div
      className={styles.participantItemH5}
      onClick={handleClick}
    >
      <Avatar src={participant.avatarUrl} size={40} />
      <div className={styles.participantContent}>
        <div className={styles.userInfo}>
          <div className={styles.userDetails}>
            <div className={styles.userNameRow}>
              <span className={styles.userName}>{displayName}</span>
            </div>
            {roleLabel && (
              <div className={styles.roleInfo}>
                {(isOwner || isAdmin) && (
                  <IconUser
                    size="14"
                    className={isAdmin ? styles.adminIcon : styles.masterIcon}
                  />
                )}
                <span
                  className={classNames(styles.userExtraInfo, {
                    [styles.userExtraInfoAdmin]: isAdmin,
                  })}
                >
                  {roleLabel}
                </span>
              </div>
            )}
          </div>
          <div className={styles.memberAvState}>
            {iconList.map(({ Icon, key }) => (
              <Icon key={key} className={styles.stateIcon} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
