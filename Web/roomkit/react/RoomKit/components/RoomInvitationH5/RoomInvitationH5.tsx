import { useEffect, useRef } from 'react';
import {
  IconArrowStrokeUp,
  IconClose,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { Avatar } from 'tuikit-atomicx-react/room';
import styles from './RoomInvitationH5.module.scss';

export interface RoomInvitationH5Options {
  /** Inviter's display name, rendered in the invitation text. */
  inviterName: string;
  /** Inviter's avatar URL, also used as the blurred background. */
  inviterAvatar: string;
  /** Room name shown as the primary title. */
  roomName: string;
  /** Host name displayed in the room details line. */
  hostName: string;
  /** Number of participants currently in the room. */
  participantCount: number;
  /** Countdown duration in seconds before `onTimeout` fires. Defaults to 30. */
  duration?: number;
  /** Fired when the user taps "Not Join". */
  onCancel?: () => void;
  /** Fired when the user taps "Join". */
  onAccept?: () => void;
  /** Fired when the countdown reaches zero with no user action. */
  onTimeout?: () => void;
}

export interface RoomInvitationH5Props {
  options: RoomInvitationH5Options;
}

/**
 * Full-screen H5 room invitation overlay.
 *
 * Matches Vue `RoomInvitationH5`: avatar blur background, invite text,
 * room info, and circular reject / accept actions (call-style UI).
 */
export function RoomInvitationH5({ options }: RoomInvitationH5Props) {
  const { t } = useUIKit();
  const {
    inviterName,
    inviterAvatar,
    roomName,
    hostName,
    participantCount,
    duration = 30,
    onCancel,
    onAccept,
    onTimeout,
  } = options;

  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (duration <= 0) {
      return undefined;
    }
    let remaining = duration;

    const interval = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(interval);
        onTimeoutRef.current?.();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [duration]);

  return (
    <div className={styles.invitationContainer}>
      <div
        className={styles.backgroundBlur}
        style={{ backgroundImage: `url(${inviterAvatar})` }}
      />
      <div className={styles.backgroundMask} />

      <div className={styles.content}>
        <div className={styles.roomInfoContainer}>
          <div className={styles.avatarWrapper}>
            <Avatar src={inviterAvatar} size={60} />
          </div>

          <div className={styles.inviteText}>
            {t('RoomInvitation.InviteText', { name: inviterName })}
          </div>

          <div className={styles.roomInfo}>
            <div className={styles.roomTitle}>{roomName}</div>
            <div className={styles.roomDetails}>
              <span className={styles.detail}>
                {t('RoomInvitation.Host')}
                {hostName}
              </span>
              <span className={styles.divider}>|</span>
              <span className={styles.detail}>
                {t('RoomInvitation.Participants')}
                {participantCount}
                {t('RoomInvitation.ParticipantsUnit')}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.actionItem} onClick={onCancel}>
            <span className={styles.rejectButton}>
              <IconClose size="18" className={styles.rejectButtonIcon} />
            </span>
            <span className={styles.rejectButtonText}>
              {t('RoomInvitation.NotJoin')}
            </span>
          </div>
          <div className={styles.actionItem} onClick={onAccept}>
            <span className={styles.acceptButton}>
              <IconArrowStrokeUp size="18" className={styles.acceptButtonIcon} />
            </span>
            <span className={styles.acceptButtonText}>
              {t('RoomInvitation.JoinMeeting')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
