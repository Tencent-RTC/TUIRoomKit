import {
  IconCam,
  IconCamOff,
  IconMic,
  IconMicOff,
  IconShare,
  TUIAvatar,
} from '../../../base';
import { useI18n } from '../../../i18n';
import type { JoinedRowData } from '../participantData';
import './ParticipantRow.scss';

export interface ParticipantRowProps {
  row: JoinedRowData;
  onSelect?: (userId: string) => void;
}

export function ParticipantRow(props: ParticipantRowProps) {
  const { row, onSelect } = props;
  const { t } = useI18n();

  return (
    <div
      className={['participant-list-mobile-row', row.hasMenu ? 'is-tappable' : ''].filter(Boolean).join(' ')}
      role={row.hasMenu ? 'button' : undefined}
      tabIndex={row.hasMenu ? 0 : undefined}
      onClick={() => {
        if (row.hasMenu) {
          onSelect?.(row.userId);
        }
      }}
    >
      <TUIAvatar size={32} src={row.avatarUrl} alt={row.name} />
      <div className="participant-list-mobile-info">
        <div className="participant-list-mobile-name">
          <span className="participant-list-mobile-name-text">{row.name}</span>
          {row.isSelf && <span className="participant-list-mobile-tag is-self">{t('Participants.Me')}</span>}
          {row.roleTag === 'owner' && (
            <span className="participant-list-mobile-tag is-owner">{t('Participants.Owner')}</span>
          )}
          {row.roleTag === 'admin' && (
            <span className="participant-list-mobile-tag is-admin">{t('Participants.Admin')}</span>
          )}
          {row.isSharing && (
            <span className="participant-list-mobile-tag is-sharing">
              <IconShare size={10} />
              {t('Participants.Sharing')}
            </span>
          )}
        </div>
      </div>
      <div className="participant-list-mobile-icons">
        <span className="participant-list-mobile-status">
          {row.isMicOn ? <IconMic size={14} /> : <IconMicOff size={14} />}
        </span>
        <span className="participant-list-mobile-status">
          {row.isCamOn ? <IconCam size={14} /> : <IconCamOff size={14} />}
        </span>
      </div>
    </div>
  );
}

export default ParticipantRow;
