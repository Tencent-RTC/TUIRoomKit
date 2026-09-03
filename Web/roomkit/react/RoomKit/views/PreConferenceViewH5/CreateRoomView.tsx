import { useEffect, useRef, useState } from 'react';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  Button,
  IconBack,
  Switch,
  Toast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import { useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import styles from './CreateRoomView.module.scss';

export interface CreateRoomViewProps {
  cameraPreference?: boolean;
  microphonePreference?: boolean;
  onCreateRoom?: (roomId: string) => void;
  onBack?: () => void;
  onCameraPreferenceChange?: (isOpen: boolean) => void;
  onMicrophonePreferenceChange?: (isOpen: boolean) => void;
}

export function CreateRoomView({
  cameraPreference = true,
  microphonePreference = true,
  onCreateRoom,
  onBack,
  onCameraPreferenceChange,
  onMicrophonePreferenceChange,
}: CreateRoomViewProps) {
  const { t, theme } = useUIKit();
  const { loginUserInfo } = useLoginState();
  const { getRoomInfo } = useRoomState();

  const [openMicrophone, setOpenMicrophone] = useState(microphonePreference);
  const [openCamera, setOpenCamera] = useState(cameraPreference);
  const [loading, setLoading] = useState(false);

  const onMicChangeRef = useRef(onMicrophonePreferenceChange);
  useEffect(() => {
    onMicChangeRef.current = onMicrophonePreferenceChange;
  }, [onMicrophonePreferenceChange]);

  const onCameraChangeRef = useRef(onCameraPreferenceChange);
  useEffect(() => {
    onCameraChangeRef.current = onCameraPreferenceChange;
  }, [onCameraPreferenceChange]);

  const isFirstMicWatch = useRef(true);
  useEffect(() => {
    if (isFirstMicWatch.current) {
      isFirstMicWatch.current = false;
      return;
    }
    onMicChangeRef.current?.(openMicrophone);
  }, [openMicrophone]);

  const isFirstCameraWatch = useRef(true);
  useEffect(() => {
    if (isFirstCameraWatch.current) {
      isFirstCameraWatch.current = false;
      return;
    }
    onCameraChangeRef.current?.(openCamera);
  }, [openCamera]);

  const checkRoomExist = async (roomId: string): Promise<boolean> => {
    try {
      await getRoomInfo({ roomId });
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
        return false;
      }
    }
    return true;
  };

  const generateRoomId = async (): Promise<string> => {
    const roomId = String(Math.floor(Math.random() * 900000) + 100000);
    if (await checkRoomExist(roomId)) {
      return generateRoomId();
    }
    return roomId;
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const roomId = await generateRoomId();
      onCreateRoom?.(roomId);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : t('Room.CreateRoomError');
      Toast.error({ message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classNames(styles.createRoomContainerH5, theme === 'dark' ? styles.themeDark : styles.themeLight)}>
      <header className={styles.headerH5}>
        <IconBack
          size="22"
          className={styles.backButton}
          onClick={() => onBack?.()}
        />
        <h1 className={styles.title}>{t('Button.CreateRoom')}</h1>
        <div className={styles.headerPlaceholder} />
      </header>

      <main className={styles.mainH5}>
        <div className={styles.roomInfo}>
          <div className={styles.formItem}>
            <span className={styles.formLabel}>{t('User.Nickname')}</span>
            <span className={styles.formInput}>
              {loginUserInfo?.userName || loginUserInfo?.userId}
            </span>
          </div>
        </div>

        <div className={styles.roomSettings}>
          <div className={classNames(styles.formItem, styles.toggleItem)}>
            <span className={styles.formLabel}>{t('Room.OpenMicrophone')}</span>
            <Switch
              value={openMicrophone}
              size="large"
              onChange={setOpenMicrophone}
            />
          </div>
          <div className={classNames(styles.formItem, styles.toggleItem)}>
            <span className={styles.formLabel}>{t('Room.OpenCamera')}</span>
            <Switch value={openCamera} size="large" onChange={setOpenCamera} />
          </div>
        </div>
      </main>

      <div className={styles.footerH5}>
        <Button
          type="primary"
          className={styles.createButton}
          loading={loading}
          onClick={handleCreateRoom}
        >
          {t('Button.CreateRoom')}
        </Button>
      </div>
    </div>
  );
}
