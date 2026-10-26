import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import { IconMembers } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';
import { useParticipantList } from '../ParticipantListMobile/useParticipantList';
import './ParticipantButtonMobile.scss';

export interface ParticipantButtonMobileProps {
  active?: boolean;
  onClick?: () => void;
}

export function ParticipantButtonMobile(props: ParticipantButtonMobileProps) {
  const { active = false, onClick } = props;
  const { t } = useI18n();

  const { currentRoom } = useRoomState();
  const { participantList } = useRoomParticipantState();
  // The member sheet mounts only when opened. This button stays up for the meeting.
  useParticipantList();
  const count = currentRoom?.participantCount || participantList.length;
  const countLabel = count > 99 ? '99+' : String(count);

  return (
    <ToolbarButtonMobile
      label={t('Participants.Panel')}
      active={active}
      pressed={active}
      onClick={onClick}
      badgeSlot={(
        <span className="participant-button-mobile-count" aria-hidden="true">{countLabel}</span>
      )}
    >
      <IconMembers size={20} />
    </ToolbarButtonMobile>
  );
}

export default ParticipantButtonMobile;
