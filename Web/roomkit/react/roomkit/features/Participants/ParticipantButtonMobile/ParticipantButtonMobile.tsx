import { IconMembers } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';
import { useParticipantAutoLoad, useParticipantCount } from '../participantData';
import './ParticipantButtonMobile.scss';

export interface ParticipantButtonMobileProps {
  active?: boolean;
  onClick?: () => void;
}

export function ParticipantButtonMobile(props: ParticipantButtonMobileProps) {
  const { active = false, onClick } = props;
  const { t } = useI18n();

  // The member sheet mounts only when opened, so this button, mounted for the whole meeting, starts the load.
  useParticipantAutoLoad();
  const { countLabel } = useParticipantCount();

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
