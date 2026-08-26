import { useEffect, useRef, useState } from 'react';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  Button,
  IconBack,
  Input,
  MessageBox,
  Switch,
  Toast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import {
  RoomType,
  useLoginState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import styles from './JoinRoomView.module.scss';

export interface JoinRoomViewProps {
  cameraPreference?: boolean;
  microphonePreference?: boolean;
  onJoinRoom?: (roomId: string) => void;
  onBack?: () => void;
  onCameraPreferenceChange?: (isOpen: boolean) => void;
  onMicrophonePreferenceChange?: (isOpen: boolean) => void;
}

export function JoinRoomView({
  cameraPreference = true,
  microphonePreference = true,
  onJoinRoom,
  onBack,
  onCameraPreferenceChange,
  onMicrophonePreferenceChange,
}: JoinRoomViewProps) {
  const { t, theme, language } = useUIKit();
  const { loginUserInfo } = useLoginState();
  const { getRoomInfo } = useRoomState();

  const [roomId, setRoomId] = useState('');
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

  const labelWidth = language === 'en-US' ? '115px' : '80px';

  const getTargetRoomInfo = async (id: string) => {
    try {
      return await getRoomInfo({ roomId: id });
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
        return null;
      }
      throw error;
    }
  };

  const handleJoinRoom = async () => {
    setLoading(true);
    if (!roomId.trim()) {
      Toast.error({ message: t('Room.RoomIdRequired') });
      // Vue H5 has a latent bug here: it early-returns without clearing
      // `loading.value = true`, leaving the button spinner stuck. Fix that
      // in-place on the React side.
      setLoading(false);
      return;
    }

    try {
      const normalizedRoomId = roomId.trim();
      const roomInfo = await getTargetRoomInfo(normalizedRoomId);

      if (!roomInfo) {
        MessageBox.alert({
          type: 'error',
          modal: false,
          showClose: false,
          title: t('Room.Alert'),
          content: t('Room.RoomNotFound'),
        });
        return;
      }

      if (roomInfo.roomType === RoomType.Webinar) {
        MessageBox.alert({
          type: 'error',
          modal: false,
          showClose: false,
          title: t('Room.Alert'),
          content: t('Room.H5NotSupportWebinar'),
        });
        return;
      }

      onJoinRoom?.(normalizedRoomId);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : t('Room.JoinRoomError');
      Toast.error({ message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classNames(styles.joinRoomContainerH5, theme === 'dark' ? styles.themeDark : styles.themeLight)}>
      <header className={styles.headerH5}>
        <IconBack
          size="22"
          className={styles.backButton}
          onClick={() => onBack?.()}
        />
        <h1 className={styles.title}>{t('Button.JoinRoom')}</h1>
        <div className={styles.headerPlaceholder} />
      </header>

      <main className={styles.mainH5}>
        <div className={styles.roomInfo}>
          <div className={styles.formItem}>
            <span
              className={styles.formLabel}
              style={{ minWidth: labelWidth }}
            >
              {t('Room.RoomId')}
            </span>
            <Input
              value={roomId}
              border={false}
              className={styles.roomIdInput}
              placeholder={t('Room.EnterRoomId')}
              maxLength={20}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>

          <div className={styles.formItem}>
            <span
              className={styles.formLabel}
              style={{ minWidth: labelWidth }}
            >
              {t('User.Nickname')}
            </span>
            <span className={styles.formInput}>
              {loginUserInfo?.userName || loginUserInfo?.userId}
            </span>
          </div>
        </div>

        <div className={styles.roomSettings}>
          <div className={classNames(styles.formItem, styles.toggleItem)}>
            <span
              className={styles.formLabel}
              style={{ minWidth: labelWidth }}
            >
              {t('Room.OpenMicrophone')}
            </span>
            <Switch
              value={openMicrophone}
              size="large"
              onChange={setOpenMicrophone}
            />
          </div>
          <div className={classNames(styles.formItem, styles.toggleItem)}>
            <span
              className={styles.formLabel}
              style={{ minWidth: labelWidth }}
            >
              {t('Room.OpenCamera')}
            </span>
            <Switch value={openCamera} size="large" onChange={setOpenCamera} />
          </div>
        </div>
      </main>

      <div className={styles.footerH5}>
        <Button
          type="primary"
          className={styles.joinButton}
          loading={loading}
          onClick={handleJoinRoom}
        >
          {t('Button.JoinRoom')}
        </Button>
      </div>
    </div>
  );
}
