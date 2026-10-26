import type { CSSProperties } from 'react';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { IconMembers } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import { useParticipantList } from '../ParticipantListPC/useParticipant';
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

  const { currentRoom } = useRoomState();
  const { participantList } = useRoomParticipantState();
  const { refreshParticipants } = useParticipantList();
  const count = currentRoom?.participantCount || participantList.length;

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
