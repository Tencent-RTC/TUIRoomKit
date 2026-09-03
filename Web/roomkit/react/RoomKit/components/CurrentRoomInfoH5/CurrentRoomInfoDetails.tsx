import {
  IconCopy,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { RoomType, useRoomState } from 'tuikit-atomicx-react/room';
import { useFeatureConfig } from '../../adapter/conference';
import { useCopy } from '../../hooks/useCopy';
import { generateRoomLink } from '../../utils/utils';
import styles from './CurrentRoomInfoDetails.module.scss';

// Vue reference: RoomITitleH5/CurrentRoomInfo.vue.
// Room-details card shown inside the current-room-info popup.
export function CurrentRoomInfoDetails() {
  const { t } = useUIKit();
  const { currentRoom } = useRoomState();
  const { copy } = useCopy();

  const shareLinkConfig = useFeatureConfig('shareLink');
  const isRoomLinkVisible = shareLinkConfig !== '';

  const resolvedLink = (() => {
    if (shareLinkConfig === '') return '';
    if (shareLinkConfig) return shareLinkConfig;
    if (!currentRoom?.roomId) return '';
    return generateRoomLink(
      currentRoom.roomId,
      (currentRoom as { password?: string }).password,
      currentRoom.roomType ?? RoomType.Standard,
    );
  })();

  if (!currentRoom) return null;

  const owner = (currentRoom as { roomOwner?: { userName?: string; userId?: string } }).roomOwner;
  const password = (currentRoom as { password?: string }).password;

  return (
    <div className={styles.roomInfo}>
      <div className={styles.roomInfoItem}>
        <div className={styles.roomInfoTitle}>
          {currentRoom.roomName || currentRoom.roomId}
        </div>
      </div>
      <div className={styles.roomInfoItem}>
        <div className={styles.roomInfoLabel}>{t('CurrentRoomInfo.Host')}</div>
        <div className={styles.roomInfoValue}>
          {owner?.userName || owner?.userId || ''}
        </div>
      </div>
      <div className={styles.roomInfoItem}>
        <div className={styles.roomInfoLabel}>{t('CurrentRoomInfo.RoomId')}</div>
        <div className={styles.roomInfoValue}>{currentRoom.roomId}</div>
        <div
          className={styles.roomInfoCopy}
          onClick={() => void copy(currentRoom.roomId || '')}
        >
          <IconCopy className={styles.copyIcon} />
          <span>{t('CurrentRoomInfo.Copy')}</span>
        </div>
      </div>
      {password && (
        <div className={styles.roomInfoItem}>
          <div className={styles.roomInfoLabel}>
            {t('CurrentRoomInfo.PasswordH5')}
          </div>
          <div className={styles.roomInfoValue}>{password}</div>
          <div
            className={styles.roomInfoCopy}
            onClick={() => void copy(password)}
          >
            <IconCopy className={styles.copyIcon} />
            <span>{t('CurrentRoomInfo.Copy')}</span>
          </div>
        </div>
      )}
      {isRoomLinkVisible && (
        <div className={styles.roomInfoItem}>
          <div className={styles.roomInfoLabel}>
            {t('CurrentRoomInfo.RoomLink')}
          </div>
          <div className={styles.roomInfoValue}>{resolvedLink}</div>
          <div
            className={styles.roomInfoCopy}
            onClick={() => void copy(resolvedLink)}
          >
            <IconCopy className={styles.copyIcon} />
            <span>{t('CurrentRoomInfo.Copy')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
