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
import { useParticipantActions } from '../participantActions';
import type { JoinedRowData } from '../participantData';
import ParticipantMoreMenu from './ParticipantMoreMenu';
import './ParticipantRow.scss';

export interface ParticipantRowProps {
  row: JoinedRowData;
}

export function ParticipantRow(props: ParticipantRowProps) {
  const { row } = props;
  const { t } = useI18n();
  const { toggleMic, toggleCam } = useParticipantActions();
  const MediaTag = row.canOperateMedia ? 'button' : 'span';
  const mediaType = row.canOperateMedia ? 'button' : undefined;

  return (
    <div className="participant-row">
      <TUIAvatar
        className="participant-row-avatar"
        src={row.avatarUrl}
        alt={row.name}
        size={32}
      />
      <div className="participant-row-info">
        <div className="participant-row-name">
          <span className="participant-row-name-text">{row.name}</span>
          {row.isSelf && <span className="participant-row-tag is-self">{t('Participants.Me')}</span>}
          {row.roleTag === 'owner' && (
            <span className="participant-row-tag is-owner">{t('Participants.Owner')}</span>
          )}
          {row.roleTag === 'admin' && (
            <span className="participant-row-tag is-admin">{t('Participants.Admin')}</span>
          )}
          {row.isSharing && (
            <span className="participant-row-tag is-sharing">
              <IconShare size={10} />
              {t('Participants.Sharing')}
            </span>
          )}
        </div>
      </div>
      <div className="participant-row-icons">
        <MediaTag
          className="participant-row-icon"
          type={mediaType}
          title={row.micTooltip}
          onClick={() => {
            void toggleMic(row.participant);
          }}
        >
          {row.isMicOn ? <IconMic size={14} /> : <IconMicOff size={14} />}
        </MediaTag>
        <MediaTag
          className="participant-row-icon"
          type={mediaType}
          title={row.camTooltip}
          onClick={() => {
            void toggleCam(row.participant);
          }}
        >
          {row.isCamOn ? <IconCam size={14} /> : <IconCamOff size={14} />}
        </MediaTag>
      </div>
      <ParticipantMoreMenu participant={row.participant}>
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
