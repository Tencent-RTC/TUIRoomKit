import { useEffect, useRef, useState } from 'react';
import { Button, IconArrowUp, useUIKit } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import { useRoomState, RoomType } from 'tuikit-atomicx-react/room';
import styles from './RoomAction.module.scss';
import { useRoomActions } from './useRoomAction';

export function RoomAction() {
  const { t } = useUIKit();
  const [showMoreControl, setShowMoreControl] = useState(false);
  const moreContainerRef = useRef<HTMLDivElement>(null);
  const { canOperate, roomActionList } = useRoomActions();
  const { currentRoom } = useRoomState();

  const isWebinar = currentRoom?.roomType === RoomType.Webinar;
  const roomAudioAction = roomActionList[0];
  const roomVideoAction = roomActionList[1];
  const moreControlList = roomActionList.slice(2);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showMoreControl) {
        return;
      }

      const target = event.target as Node;
      if (moreContainerRef.current && !moreContainerRef.current.contains(target)) {
        setShowMoreControl(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMoreControl]);

  if (!canOperate || !roomAudioAction) {
    return null;
  }

  return (
    <div className={styles['room-action-container']}>
      {!isWebinar
        ? (
          <>
            <Button
              type="primary"
              color="gray"
              onClick={roomAudioAction.handler}
            >
              {roomAudioAction.label}
            </Button>
            {roomVideoAction && (
              <Button
                type="primary"
                color="gray"
                onClick={roomVideoAction.handler}
              >
                {roomVideoAction.label}
              </Button>
            )}
            {moreControlList.length > 0 && (
              <div ref={moreContainerRef} className={styles['more-container']}>
                <Button
                  type="primary"
                  color="gray"
                  onClick={() => setShowMoreControl(value => !value)}
                >
                  {t('ParticipantList.More')}
                  <IconArrowUp
                    size="12"
                    className={classNames(styles['more-arrow'], showMoreControl ? styles.down : styles.up)}
                  />
                </Button>
                {showMoreControl && (
                  <div className={styles['drop-down']}>
                    {moreControlList.map((item) => {
                      const ActionIcon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className={styles['user-operate-item']}
                          onClick={() => {
                            item.handler();
                            setShowMoreControl(false);
                          }}
                        >
                          {ActionIcon && <ActionIcon size="16" />}
                          <span className={styles['operate-text']}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )
        : (
          <Button
            type="primary"
            color="gray"
            block
            onClick={roomAudioAction.handler}
          >
            {roomAudioAction.label}
          </Button>
        )}
    </div>
  );
}
