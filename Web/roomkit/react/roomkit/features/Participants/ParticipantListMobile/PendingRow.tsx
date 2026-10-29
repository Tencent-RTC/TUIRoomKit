import { IconPhone, TUIAvatar } from '../../../base';
import { useI18n } from '../../../i18n';
import { useParticipantCall } from '../participantActions';
import type { PendingRowData } from '../participantData';
import './PendingRow.scss';

export interface PendingRowProps {
  row: PendingRowData;
}

export function PendingRow(props: PendingRowProps) {
  const { row } = props;
  const { t } = useI18n();
  const { callOne } = useParticipantCall();

  function renderState() {
    if (row.callState === 'no-answer') {
      return (
        <span className="participant-list-mobile-wait-failed">
          {t('Participants.NoAnswer')}
        </span>
      );
    }
    if (row.callState === 'calling') {
      return (
        <span className="participant-list-mobile-wait-call is-calling">
          <IconPhone className="participant-list-mobile-wait-pulse" size={14} />
          <span>{t('Participants.Calling')}</span>
        </span>
      );
    }
    return (
      <div
        className="participant-list-mobile-wait-call"
        role="button"
        tabIndex={0}
        aria-label={t('Participants.Call')}
        onClick={() => {
          void callOne(row.participant);
        }}
      >
        <IconPhone size={14} />
      </div>
    );
  }

  return (
    <div className="participant-list-mobile-row">
      <TUIAvatar size={32} src={row.avatarUrl} alt={row.name} />
      <div className="participant-list-mobile-info">
        <div className="participant-list-mobile-name">
          <span className="participant-list-mobile-name-text">{row.name}</span>
        </div>
      </div>
      <div className="participant-list-mobile-wait">
        {renderState()}
      </div>
    </div>
  );
}

export default PendingRow;
