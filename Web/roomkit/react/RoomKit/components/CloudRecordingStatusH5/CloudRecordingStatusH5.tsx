import { useEffect, useRef, useState } from 'react';
import {
  IconChevronRight,
  IconStopRecord,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import { useCloudRecordingAction } from '../CloudRecording/useCloudRecordingAction';
import { useCloudRecordingEvents } from '../CloudRecording/useCloudRecordingEvents';
import styles from './CloudRecordingStatusH5.module.scss';

// Vue reference: CloudRecording/CloudRecordingStatusH5.vue (181 lines).
export function CloudRecordingStatusH5() {
  const { t } = useUIKit();
  const { isRecording, isOwnerOrAdmin, confirmStopRecording } = useCloudRecordingAction();
  useCloudRecordingEvents();

  const statusRef = useRef<HTMLDivElement | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!isRecording || !isOwnerOrAdmin) {
      setShowMenu(false);
    }
  }, [isRecording, isOwnerOrAdmin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusRef.current && !statusRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!isRecording) {
    return null;
  }

  const toggleMenu = () => setShowMenu(prev => !prev);
  const handleStop = () => {
    setShowMenu(false);
    confirmStopRecording();
  };

  return (
    <div
      ref={statusRef}
      className={classNames(styles.cloudRecordingStatusH5, {
        [styles.expandable]: isOwnerOrAdmin,
      })}
    >
      <div
        className={styles.cardTitle}
        onClick={(e) => {
          e.stopPropagation();
          if (isOwnerOrAdmin) {
            toggleMenu();
          }
        }}
      >
        <span className={styles.recordingDot} />
        <span className={styles.recordingLabel}>
          {t('CloudRecording.StatusLabel')}
        </span>
        {isOwnerOrAdmin && (
          <IconChevronRight
            className={classNames(styles.chevron, {
              [styles.expanded]: showMenu,
            })}
            size="12"
          />
        )}
      </div>
      {isOwnerOrAdmin && (
        <div
          className={classNames(styles.cardContent, {
            [styles.expanded]: showMenu,
          })}
        >
          <div className={styles.cardContentInner}>
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleStop();
              }}
              type="button"
            >
              <div className={styles.actionIcon}>
                <IconStopRecord size="30" />
              </div>
              <span className={styles.actionLabel}>
                {t('CloudRecording.StopButton')}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
