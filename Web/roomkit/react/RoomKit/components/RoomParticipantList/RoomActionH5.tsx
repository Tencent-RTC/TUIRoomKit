import { useState } from 'react';
import {
  Button,
  Popup,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { useRoomActions } from './useRoomAction';
import { PopUpArrowDown } from '../base/PopUpArrowDown';
import styles from './RoomActionH5.module.scss';

// Vue reference: RoomParticipantList/RoomActionH5.vue (136 lines).
export function RoomActionH5() {
  const { t } = useUIKit();
  const { canOperate, roomActionList } = useRoomActions();

  const [showMorePopup, setShowMorePopup] = useState(false);

  if (!canOperate) {
    return null;
  }

  const roomAudioAction = roomActionList[0];
  const roomVideoAction = roomActionList[1];
  const moreControlList = roomActionList.slice(2);

  const handleMoreActionClick = (handler: () => void) => {
    handler();
    setShowMorePopup(false);
  };

  return (
    <div className={styles.roomActionH5Container}>
      <Button
        type="primary"
        color="gray"
        className={styles.actionButton}
        onClick={roomAudioAction?.handler}
      >
        {roomAudioAction?.label}
      </Button>
      <Button
        type="primary"
        color="gray"
        className={styles.actionButton}
        onClick={roomVideoAction?.handler}
      >
        {roomVideoAction?.label}
      </Button>
      {moreControlList.length > 0 && (
        <Button
          type="primary"
          color="gray"
          className={styles.actionButton}
          onClick={() => setShowMorePopup(true)}
        >
          {t('ParticipantList.More')}
        </Button>
      )}

      <Popup visible={showMorePopup} onUpdateVisible={setShowMorePopup}>
        <PopUpArrowDown onClick={() => setShowMorePopup(false)} />
        <div className={styles.moreActionsContent}>
          {moreControlList.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.key}
                className={styles.actionItem}
                onClick={() => handleMoreActionClick(item.handler)}
              >
                {IconComponent && (
                  <span className={styles.actionIcon}>
                    <IconComponent />
                  </span>
                )}
                <span className={styles.actionText}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </Popup>
    </div>
  );
}
