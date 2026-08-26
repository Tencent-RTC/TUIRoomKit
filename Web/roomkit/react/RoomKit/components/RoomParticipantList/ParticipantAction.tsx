import { useEffect, useRef, useState } from 'react';
import { Button, IconArrowUp, useUIKit } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import styles from './ParticipantAction.module.scss';
import { useParticipantAction } from './useParticipantAction';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

interface Props {
  participant: RoomParticipant;
  isLocal: boolean;
}

export function ParticipantAction({ participant, isLocal }: Props) {
  const { t } = useUIKit();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { controlList } = useParticipantAction({ targetParticipant: participant });

  const singleControl = !isLocal ? controlList[0] : null;
  const moreControlList = !isLocal ? controlList.slice(1) : controlList;
  const showMoreActions = moreControlList.length >= 1;

  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  if (controlList.length === 0) {
    return null;
  }

  return (
    <>
      {singleControl && (
        <Button type="primary" onClick={singleControl.handler}>
          {singleControl.label}
        </Button>
      )}
      <div className={styles.actions}>
        {showMoreActions && (
          <div
            ref={menuRef}
            className={styles['more-actions']}
            onClick={e => e.stopPropagation()}
          >
            <Button onClick={() => setShowMenu(value => !value)}>
              {t('ParticipantList.More')}
              <IconArrowUp
                size="12"
                className={classNames(styles['more-arrow'], showMenu ? styles.up : styles.down)}
              />
            </Button>

            {showMenu && (
              <div className={styles['dropdown-menu']}>
                {moreControlList.map((item) => {
                  const ActionIcon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className={styles['menu-item']}
                      style={item.style || {}}
                      onClick={() => {
                        item.handler();
                        setShowMenu(false);
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
      </div>
    </>
  );
}
