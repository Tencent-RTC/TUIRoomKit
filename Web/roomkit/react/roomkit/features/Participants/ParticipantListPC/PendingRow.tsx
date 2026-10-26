import type { CSSProperties } from 'react';
import { RoomParticipantStatus } from 'tuikit-atomicx-react/room';
import { IconPhone, TUIAvatar, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import { participantDisplayName } from './useParticipant';
import { useInvitation } from './useInvitation';
import type { InvitationFailure } from './useInvitation';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './PendingRow.scss';

export interface PendingRowProps {
  participant: RoomParticipant;
  className?: string;
  style?: CSSProperties;
}

export function PendingRow(props: PendingRowProps) {
  const { participant, className, style } = props;
  const { t } = useI18n();

  const { inviteUsers, recentCallFailures } = useInvitation();
  const showRejected = recentCallFailures.has(participant.userId);

  const displayName = participantDisplayName(participant);
  const isCalling = participant.roomStatus === RoomParticipantStatus.InCalling;
  const callLabel = t('Participants.Call');

  function notify(failure?: InvitationFailure) {
    if (!failure) {
      return false;
    }
    TUIToast[failure === 'failed' ? 'error' : 'warning'](t(`Participants.InviteFailure.${failure}`));
    return true;
  }

  async function call() {
    if (notify(await inviteUsers([participant.userId]))) {
      return;
    }
    TUIToast.success(t('Participants.CallStarted', { name: displayName }));
  }

  function renderState() {
    if (showRejected) {
      return (
        <span className="pending-row-state is-failed">
          {t('Participants.NoAnswer')}
        </span>
      );
    }
    if (isCalling) {
      return (
        <span
          className="pending-row-state is-calling"
        >
          <IconPhone size={14} />
          <span>{t('Participants.Calling')}</span>
        </span>
      );
    }
    return (
      <button
        className="pending-row-state is-idle"
        type="button"
        title={callLabel}
        aria-label={callLabel}
        onClick={() => {
          void call();
        }}
      >
        <IconPhone size={14} />
      </button>
    );
  }

  return (
    <div className={['pending-row', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <TUIAvatar
        className="pending-row-avatar"
        src={participant.avatarUrl}
        alt={displayName}
        size={32}
      />
      <div className="pending-row-info">
        <span className="pending-row-name">{displayName}</span>
      </div>
      <div className="pending-row-actions">
        {renderState()}
      </div>
    </div>
  );
}

export default PendingRow;
