import type { CSSProperties } from 'react';
import { DeviceStatus, RoomParticipantRole } from 'tuikit-atomicx-react/room';
import {
  IconCam,
  IconCamOff,
  IconMic,
  IconMicOff,
  IconMore,
  IconShare,
  TUIAvatar,
} from '../../../base';
import { useI18n } from '../../../i18n';
import ParticipantMoreMenu from './ParticipantMoreMenu.tsx';
import { useParticipantMoreMenu } from './useParticipantMoreMenu';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './ParticipantRow.scss';

export interface ParticipantRowProps {
  participant: RoomParticipant;
  className?: string;
  style?: CSSProperties;
}

export function ParticipantRow(props: ParticipantRowProps) {
  const { participant, className, style } = props;
  const { t } = useI18n();

  const {
    isSelf,
    displayName,
    isMicOn,
    isCamOn,
    canOperateMedia,
    micTitle,
    camTitle,
    toggleMic,
    toggleCam,
  } = useParticipantMoreMenu(participant);

  const isSharing = participant.screenShareStatus === DeviceStatus.On;
  const roleLabel = (() => {
    if (participant.role === RoomParticipantRole.Owner) {
      return t('Participants.Owner');
    }
    if (participant.role === RoomParticipantRole.Admin) {
      return t('Participants.Admin');
    }
    return '';
  })();
  const roleClass = participant.role === RoomParticipantRole.Owner ? 'is-owner' : 'is-admin';

  const MediaTag = canOperateMedia ? 'button' : 'span';

  return (
    <div className={['participant-row', className ?? ''].filter(Boolean).join(' ')} style={style}>
      <TUIAvatar
        className="participant-row-avatar"
        src={participant.avatarUrl}
        alt={displayName}
        size={32}
      />
      <div className="participant-row-info">
        <div className="participant-row-name">
          <span className="participant-row-name-text">{displayName}</span>
          {isSelf && <span className="participant-row-tag is-self">{t('Participants.Me')}</span>}
          {roleLabel && (
            <span
              className={['participant-row-tag', roleClass].join(' ')}
            >
              {roleLabel}
            </span>
          )}
          {isSharing && (
            <span className="participant-row-tag is-sharing">
              <IconShare size={10} />
              {t('Participants.Sharing')}
            </span>
          )}
        </div>
      </div>
      <div className="participant-row-icons">
        <MediaTag
          className={['participant-row-icon', isMicOn ? 'on' : '', !isMicOn ? 'muted' : ''].filter(Boolean).join(' ')}
          type={canOperateMedia ? 'button' : undefined}
          title={micTitle}
          onClick={() => {
            void toggleMic();
          }}
        >
          {isMicOn ? <IconMic size={14} /> : <IconMicOff size={14} />}
        </MediaTag>
        <MediaTag
          className={['participant-row-icon', isCamOn ? 'on' : '', !isCamOn ? 'muted' : ''].filter(Boolean).join(' ')}
          type={canOperateMedia ? 'button' : undefined}
          title={camTitle}
          onClick={() => {
            void toggleCam();
          }}
        >
          {isCamOn ? <IconCam size={14} /> : <IconCamOff size={14} />}
        </MediaTag>
      </div>
      <ParticipantMoreMenu
        participant={participant}
      >
        {({ open }) => (
          <button
            className={['participant-row-more', open ? 'is-open' : ''].filter(Boolean).join(' ')}
            type="button"
            title={t('Participants.More')}
            aria-label={t('Participants.More')}
          >
            <IconMore size={14} />
          </button>
        )}
      </ParticipantMoreMenu>
    </div>
  );
}

export default ParticipantRow;
