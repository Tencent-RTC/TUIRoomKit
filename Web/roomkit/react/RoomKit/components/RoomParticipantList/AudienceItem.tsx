import { useState } from 'react';
import type React from 'react';
import { IconUser, useUIKit } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import { useRoomParticipantState, Avatar } from 'tuikit-atomicx-react/room';
import styles from './AudienceItem.module.scss';
import type { RoomUser } from 'tuikit-atomicx-react/room';

interface Props {
  audience: RoomUser;
  isLocal: boolean;
  children?: React.ReactNode;
}

export function AudienceItem({ audience, children }: Props) {
  const { t } = useUIKit();
  const [isHovered, setIsHovered] = useState(false);
  const { localParticipant, adminList } = useRoomParticipantState();

  const isAdmin = adminList.some(admin => admin.userId === audience.userId);
  const isMe = localParticipant?.userId === audience.userId;
  const displayName = audience.userName || audience.userId;

  const roleLabel = (() => {
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
      className={classNames(styles['participant-item'], { [styles.hovered]: isHovered })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles['user-info']}>
        <Avatar src={audience.avatarUrl} size={40} />
        <span className={styles['user-name']}>{displayName}</span>
        {(isAdmin || roleLabel) && (
          <div className={styles['role-info']}>
            {isAdmin && <IconUser size="20" className={styles['admin-icon']} />}
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

      {isHovered && (
        <div className={styles['action-area']}>
          {children}
        </div>
      )}
    </div>
  );
}
