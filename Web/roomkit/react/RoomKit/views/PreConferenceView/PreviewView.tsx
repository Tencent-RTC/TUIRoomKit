import { useEffect, useRef } from 'react';
import TUIRoomEngine, { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  IconLoading,
  MessageBox,
  Toast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import {
  RoomType,
  ScheduledRoomList,
  useDeviceState,
  useRoomModal,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { CameraButton, JoinRoomButton, LanguageButton, LoginUserInfo, MicButton, ScheduledRoomButton, StartRoomButton, ThemeButton } from '../../components';
import styles from './PreviewView.module.scss';
import type { RoomInfo } from 'tuikit-atomicx-react/room';

const MAX_ROOM_ID_RETRIES = 5;
const PREVIEW_VIDEO_ID = 'room-preview-video';

export interface PreviewViewUIOptions {
  showHeader?: boolean;
  showLogo?: boolean;
}

export interface PreviewViewProps {
  /** Visual options for the preview view chrome. */
  uiOptions?: PreviewViewUIOptions;
  /** Fired when the user clicks "Logout" inside the login info dropdown. */
  onLogout?: () => void;
  /** Fired after a fresh room id is generated for the local user to host. */
  onCreateRoom?: (roomId: string, roomType: RoomType) => void;
  /** Fired after the local user resolves a valid room id to join. */
  onJoinRoom?: (roomId: string, roomType: RoomType) => void;
  /** Fired whenever the camera test starts (`true`) or stops (`false`). */
  onCameraPreferenceChange?: (isOpen: boolean) => void;
  /** Fired whenever the microphone test starts (`true`) or stops (`false`). */
  onMicrophonePreferenceChange?: (isOpen: boolean) => void;
}

export function PreviewView(props: PreviewViewProps) {
  const {
    uiOptions,
    onLogout,
    onCreateRoom,
    onJoinRoom,
    onCameraPreferenceChange,
    onMicrophonePreferenceChange,
  } = props;

  const { t, theme, language } = useUIKit();
  const showHeader = uiOptions?.showHeader ?? true;
  const showLogo = uiOptions?.showLogo ?? true;

  const { getRoomInfo } = useRoomState();
  const {
    isMicrophoneTesting,
    isCameraTesting,
    isCameraTestLoading,
    startCameraTest,
    startMicrophoneTest,
    stopCameraTest,
    stopMicrophoneTest,
  } = useDeviceState();
  const { handleErrorWithModal } = useRoomModal();

  // Latest-ref pattern keeps the watch effects subscribed once while the
  // parent stays free to recreate its callbacks every render.
  const onCameraChangeRef = useRef(onCameraPreferenceChange);
  useEffect(() => {
    onCameraChangeRef.current = onCameraPreferenceChange;
  }, [onCameraPreferenceChange]);

  const onMicChangeRef = useRef(onMicrophonePreferenceChange);
  useEffect(() => {
    onMicChangeRef.current = onMicrophonePreferenceChange;
  }, [onMicrophonePreferenceChange]);

  // Vue's `watch` does not fire on registration; skip the first render to
  // mirror that behaviour and only react to genuine state transitions.
  const isFirstMicWatch = useRef(true);
  useEffect(() => {
    if (isFirstMicWatch.current) {
      isFirstMicWatch.current = false;
      return;
    }
    onMicChangeRef.current?.(isMicrophoneTesting);
  }, [isMicrophoneTesting]);

  const isFirstCameraWatch = useRef(true);
  useEffect(() => {
    if (isFirstCameraWatch.current) {
      isFirstCameraWatch.current = false;
      return;
    }
    onCameraChangeRef.current?.(isCameraTesting);
  }, [isCameraTesting]);

  // onMounted: start camera + microphone tests once the engine reports ready.
  // onBeforeUnmount: tear both tests down.
  useEffect(() => {
    const handleReady = async () => {
      const previewElement = document.getElementById(PREVIEW_VIDEO_ID);
      if (previewElement) {
        try {
          await startCameraTest({ view: previewElement as HTMLDivElement });
        } catch (error) {
          handleErrorWithModal(error as { code?: number; message?: string });
        }
      }
      try {
        await startMicrophoneTest();
      } catch (error) {
        handleErrorWithModal(error as { code?: number; message?: string });
      }
    };

    TUIRoomEngine.once('ready', handleReady);

    return () => {
      stopCameraTest();
      stopMicrophoneTest();
    };
    // The actions returned by useDeviceState/useRoomModal are stable singletons
    // bound at module level in uikit-component-react.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkRoomExist = async (roomId: string): Promise<boolean> => {
    try {
      await getRoomInfo({ roomId });
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
        return false;
      }
      // Treat any unexpected error (e.g. network) as "room exists" so that
      // generateRoomId retries with a different candidate instead of propagating.
    }
    return true;
  };

  const generateRoomId = async (
    roomType: RoomType,
    retriesLeft = MAX_ROOM_ID_RETRIES,
  ): Promise<string> => {
    const candidate = String(Math.floor(Math.random() * 900000) + 100000);
    if (!(await checkRoomExist(candidate))) {
      return roomType === RoomType.Standard ? candidate : `webinar_${candidate}`;
    }
    if (retriesLeft <= 1) {
      const fallbackId = `${Math.floor(Math.random() * 900000) + 100000}_${Date.now()}`;
      return roomType === RoomType.Standard ? fallbackId : `webinar_${fallbackId}`;
    }
    return generateRoomId(roomType, retriesLeft - 1);
  };

  const handleStartRoom = async (roomType: RoomType) => {
    const roomId = await generateRoomId(roomType);
    sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
    onCreateRoom?.(roomId, roomType);
  };

  const handleJoinRoom = async (roomId: string) => {
    const normalizedRoomId = roomId.trim();
    if (!normalizedRoomId) {
      Toast.error({ message: t('Room.RoomIdRequired') });
      return;
    }
    if (await checkRoomExist(normalizedRoomId)) {
      const isWebinar = normalizedRoomId.startsWith('webinar_');
      onJoinRoom?.(normalizedRoomId, isWebinar ? RoomType.Webinar : RoomType.Standard);
    } else {
      MessageBox.alert({
        type: 'error',
        modal: false,
        showClose: false,
        title: t('Room.Alert'),
        content: t('Room.RoomNotFound'),
      });
    }
  };

  const handleScheduleJoinRoom = (roomInfo: RoomInfo) => {
    // RoomInfo is already available; call onJoinRoom directly to avoid a redundant API request.
    onJoinRoom?.(roomInfo.roomId, roomInfo.roomType);
  };

  const isDarkTheme = theme === 'dark';
  const isZhLanguage = language === 'zh-CN';
  const themeClass = isDarkTheme ? styles.themeDark : styles.themeLight;
  let logoVariant: string;
  if (isDarkTheme) {
    logoVariant = isZhLanguage ? styles.logoDarkZh : styles.logoDarkEn;
  } else {
    logoVariant = isZhLanguage ? styles.logoLightZh : styles.logoLightEn;
  }

  return (
    <div className={classNames(styles.homeContainer, themeClass)}>
      {showHeader && (
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <ThemeButton />
          </div>
          <div className={styles.headerRight}>
            <LanguageButton />
            <LoginUserInfo onLogout={onLogout} />
          </div>
        </header>
      )}

      <main className={styles.main}>
        {showLogo && (
          <div className={styles.title}>
            <div className={classNames(styles.logo, logoVariant)} />
          </div>
        )}
        <div className={styles.mainContainer}>
          <div className={styles.roomPreviewContainer}>
            <div className={styles.cameraPreviewArea}>
              <div id={PREVIEW_VIDEO_ID} className={styles.videoPreview} />
              <div className={styles.attentionInfo}>
                {!isCameraTesting && !isCameraTestLoading && (
                  <span className={styles.offCameraInfo}>{t('Off Camera')}</span>
                )}
                {isCameraTestLoading && (
                  <IconLoading size="36" className={styles.loading} />
                )}
              </div>
            </div>
            <div className={styles.controlContainer}>
              <div className={styles.mediaControlRegion}>
                <MicButton />
                <CameraButton cameraTestContainer={PREVIEW_VIDEO_ID} />
              </div>
              <div className={styles.roomControlRegion}>
                <StartRoomButton onStartRoom={handleStartRoom} />
                <JoinRoomButton onJoinRoom={handleJoinRoom} />
                <ScheduledRoomButton />
              </div>
            </div>
          </div>
          <div className={styles.scheduleList}>
            <ScheduledRoomList onJoinRoom={handleScheduleJoinRoom} />
          </div>
        </div>
      </main>
    </div>
  );
}
