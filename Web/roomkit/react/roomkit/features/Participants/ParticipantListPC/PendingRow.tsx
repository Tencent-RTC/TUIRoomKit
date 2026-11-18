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
        <span className="pending-row-state is-failed">
          {t('Participants.NoAnswer')}
        </span>
      );
    }
    if (row.callState === 'calling') {
      return (
        <span className="pending-row-state is-calling">
          <IconPhone size={14} />
          <span>{t('Participants.Calling')}</span>
        </span>
      );
    }
    return (
      <button
        className="pending-row-state is-idle"
        type="button"
        title={t('Participants.Call')}
        aria-label={t('Participants.Call')}
        onClick={() => {
          void callOne(row.participant);
        }}
      >
        <IconPhone size={14} />
      </button>
    );
  }

  return (
    <div className="pending-row">
      <TUIAvatar className="pending-row-avatar" src={row.avatarUrl} alt={row.name} size={32} />
      <span className="pending-row-name">{row.name}</span>
      <div className="pending-row-actions">
        {renderState()}
      </div>
    </div>
  );
}

export default PendingRow;
