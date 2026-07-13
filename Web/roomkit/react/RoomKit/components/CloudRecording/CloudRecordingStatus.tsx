import { useState, useEffect, useRef } from 'react';
import { IconChevronRight, IconStopRecord, useUIKit } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import styles from './CloudRecordingStatus.module.scss';
import { useCloudRecordingAction } from './useCloudRecordingAction';
import { useCloudRecordingEvents } from './useCloudRecordingEvents';

export function CloudRecordingStatus() {
  const { t } = useUIKit();
  const { isRecording, isOwnerOrAdmin, confirmStopRecording } = useCloudRecordingAction();
  useCloudRecordingEvents();

  const [showActions, setShowActions] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isRecording || !isOwnerOrAdmin) {
      setShowActions(false);
    }
  }, [isRecording, isOwnerOrAdmin]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (!isRecording) {
    return null;
  }

  function handleToggle() {
    if (!isOwnerOrAdmin) {
      return;
    }
    setShowActions(prev => !prev);
  }

  function handleStop(e: React.MouseEvent) {
    e.stopPropagation();
    setShowActions(false);
    confirmStopRecording();
  }

  return (
    <div
      ref={statusRef}
      className={classNames(styles.cloudRecordingStatus, {
        [styles.clickable]: isOwnerOrAdmin,
      })}
      onClick={handleToggle}
    >
      <span className={styles.recordingDot} />
      <span className={styles.recordingLabel}>{t('CloudRecording.StatusLabel')}</span>

      {isOwnerOrAdmin && (
        <>
          {showActions && (
            <button
              className={styles.stopBtn}
              onClick={handleStop}
            >
              <IconStopRecord size="16" />
              {t('CloudRecording.StopButton')}
            </button>
          )}
          <IconChevronRight
            className={classNames(styles.chevron, {
              [styles.chevronExpanded]: showActions,
            })}
            size="12"
          />
        </>
      )}
    </div>
  );
}
