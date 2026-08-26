import { useState } from 'react';
import {
  IconManageMember,
  Popup,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { useRoomState } from 'tuikit-atomicx-react/room';
import { IconButtonH5 } from '../base/IconButtonH5';
import { PopUpArrowDown } from '../base/PopUpArrowDown';
import { RoomParticipantListH5 } from '../RoomParticipantList';
import styles from './MemberButtonH5.module.scss';

// Vue reference: ParticipantButtonH5/index.vue (72 lines).
export function MemberButtonH5() {
  const { t } = useUIKit();
  const { currentRoom } = useRoomState();
  const [visible, setVisible] = useState(false);

  const memberCount =
    (currentRoom?.participantCount || 0) + (currentRoom?.audienceCount || 0);
  const baseTitle = t('Participant.Title');
  const title =
    currentRoom?.roomId && memberCount > 0
      ? `${baseTitle}(${memberCount})`
      : baseTitle;

  return (
    <>
      <IconButtonH5 title={title} onClick={() => setVisible(true)}>
        <IconManageMember size="24" />
      </IconButtonH5>
      <Popup visible={visible} onUpdateVisible={setVisible} height="90%">
        <div className={styles.participantListContent}>
          <PopUpArrowDown onClick={() => setVisible(false)} />
          <div className={styles.participantListHeader}>{title}</div>
          <RoomParticipantListH5 />
        </div>
      </Popup>
    </>
  );
}
