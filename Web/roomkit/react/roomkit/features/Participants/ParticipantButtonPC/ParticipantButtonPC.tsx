import type { CSSProperties } from 'react';
import { IconMembers } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import { useParticipantAutoLoad, useParticipantCount } from '../participantData';
import './ParticipantButtonPC.scss';

export interface ParticipantButtonPCProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function ParticipantButtonPC(props: ParticipantButtonPCProps) {
  const { active = false, onClick, className, style } = props;
  const { t } = useI18n();

  const { refreshParticipants } = useParticipantAutoLoad();
  const { count } = useParticipantCount();

  /** The room watch can miss the first empty load if the engine is not ready yet. */
  function handleClick() {
    void refreshParticipants();
    onClick?.();
  }

  return (
    <ToolbarButtonPC
      className={className}
      style={style}
      label={t('Participants.Panel')}
      active={active}
      onClick={handleClick}
      iconSlot={(
        <>
          <IconMembers size={22} />
          <span className="participant-button-badge">{count}</span>
        </>
      )}
    />
  );
}

export default ParticipantButtonPC;
