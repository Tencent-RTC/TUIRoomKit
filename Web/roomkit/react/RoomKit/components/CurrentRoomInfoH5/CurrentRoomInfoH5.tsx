import { useEffect, useState } from 'react';
import {
  IconCaretDownSmall,
  Popup,
} from '@tencentcloud/uikit-base-component-react';
import { useRoomState } from 'tuikit-atomicx-react/room';
import { PopUpArrowDown } from '../base/PopUpArrowDown';
import { CurrentRoomInfoDetails } from './CurrentRoomInfoDetails';
import styles from './CurrentRoomInfoH5.module.scss';

// Vue reference: RoomITitleH5/index.vue (277 lines).
// Header shows room name + auto-incrementing duration + caret; tap to open a
// bottom popup with CurrentRoomInfoDetails (host / roomId / password / link).
export function CurrentRoomInfoH5() {
  const { currentRoom } = useRoomState();

  const [popupVisible, setPopupVisible] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!currentRoom?.roomId) {
    return null;
  }

  const createTime = (currentRoom as { createTime?: number }).createTime ?? 0;
  const totalSeconds = Math.max(0, Math.floor((now - createTime) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const durationTime =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;

  return (
    <>
      <div
        className={styles.roomTitle}
        onClick={() => setPopupVisible(true)}
      >
        <div className={styles.roomTitleTop}>
          <span className={styles.roomTitleName}>
            {currentRoom.roomName || currentRoom.roomId}
          </span>
          <IconCaretDownSmall size="24" className={styles.roomTitleIcon} />
        </div>
        <span className={styles.roomDuration}>{durationTime}</span>
      </div>
      <Popup visible={popupVisible} onUpdateVisible={setPopupVisible}>
        <PopUpArrowDown onClick={() => setPopupVisible(false)} />
        <CurrentRoomInfoDetails />
      </Popup>
    </>
  );
}
