import { useEffect, useRef } from 'react';
import TUIRoomEngine, {
  TUIErrorCode,
  TUIRoomEvents,
} from '@tencentcloud/tuiroom-engine-js';
import {
  IconLoading,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import { useDeviceState, useRoomEngine } from 'tuikit-atomicx-react/room';
import {
  CameraButtonH5,
  JoinRoomButtonH5,
  LanguageButton,
  LoginUserInfoH5,
  MicButtonH5,
  StartRoomButtonH5,
  SwitchCameraButtonH5,
  ThemeButton,
} from '../../components';
import styles from './PreviewView.module.scss';

const PREVIEW_VIDEO_ID = 'room-preview-video';

export interface PreviewViewH5Props {
  onLogout?: () => void;
  onCreateRoom?: () => void;
  onJoinRoom?: () => void;
  onCameraPreferenceChange?: (isOpen: boolean) => void;
  onMicrophonePreferenceChange?: (isOpen: boolean) => void;
  /** Parent-owned "camera permission was denied" flag; survives child view unmounts. */
  cameraPermissionDenied?: boolean;
  microphonePermissionDenied?: boolean;
  onCameraPermissionDeniedChange?: (denied: boolean) => void;
  onMicrophonePermissionDeniedChange?: (denied: boolean) => void;
}

export function PreviewView(props: PreviewViewH5Props) {
  const {
    onLogout,
    onCreateRoom,
    onJoinRoom,
    onCameraPreferenceChange,
    onMicrophonePreferenceChange,
    cameraPermissionDenied = false,
    microphonePermissionDenied = false,
    onCameraPermissionDeniedChange,
    onMicrophonePermissionDeniedChange,
  } = props;

  const { t, theme, language } = useUIKit();
  const roomEngine = useRoomEngine();
  const {
    isCameraTesting,
    isMicrophoneTesting,
    isCameraTestLoading,
    startCameraTest,
    startMicrophoneTest,
    stopCameraTest,
    stopMicrophoneTest,
  } = useDeviceState();

  const onCameraChangeRef = useRef(onCameraPreferenceChange);
  useEffect(() => {
    onCameraChangeRef.current = onCameraPreferenceChange;
  }, [onCameraPreferenceChange]);

  const onMicChangeRef = useRef(onMicrophonePreferenceChange);
  useEffect(() => {
    onMicChangeRef.current = onMicrophonePreferenceChange;
  }, [onMicrophonePreferenceChange]);

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

  // "permission was denied" state is owned by PreConferenceViewH5 (see parent
  // props) so the red-slash badge survives when the user navigates to
  // CreateRoom/JoinRoom and back (which unmounts PreviewView).

  // Once the still-pending start* success branch has flipped isCameraTesting=true,
  // stop the test to bring the state back to Off. Keep cameraPermissionDenied
  // set so the button can render its "permission denied" red-slash badge; it
  // clears when the user explicitly reopens the device from the button.
  useEffect(() => {
    if (cameraPermissionDenied && isCameraTesting) {
      void stopCameraTest();
    }
  }, [cameraPermissionDenied, isCameraTesting, stopCameraTest]);

  useEffect(() => {
    if (microphonePermissionDenied && isMicrophoneTesting) {
      void stopMicrophoneTest();
    }
  }, [microphonePermissionDenied, isMicrophoneTesting, stopMicrophoneTest]);

  useEffect(() => {
    let cancelled = false;

    // SDK path: startCameraDeviceTest resolves before permission is denied at
    // the browser layer; the failure only arrives later via TUIRoomEvents.onError
    // with code -1101 (camera) / -1105 (microphone). atomicx doesn't sync
    // isCameraTesting/isMicrophoneTesting from that channel, so the button
    // stays visually "on" without any video. Force stopCameraTest / stopMicrophoneTest
    // when we see these codes.
    const handleRoomError = (error: { code?: number }) => {
      if (error?.code === TUIErrorCode.ERR_CAMERA_NOT_AUTHORIZED) {
        onCameraPermissionDeniedChange?.(true);
      }
      if (error?.code === TUIErrorCode.ERR_MICROPHONE_NOT_AUTHORIZED) {
        onMicrophonePermissionDeniedChange?.(true);
      }
    };

    const handleReady = () => {
      if (cancelled) {
        return;
      }
      // Subscribe BEFORE starting device tests so the -1101 / -1105 onError
      // events for camera/microphone (fired async after startCameraDeviceTest
      // has already resolved) are received by our handler.
      roomEngine.instance?.on(TUIRoomEvents.onError, handleRoomError);

      const previewElement = document.getElementById(PREVIEW_VIDEO_ID);
      if (previewElement) {
        // Silently swallow — permission denials arrive on the onError channel
        // (handled above with the red-slash badge, matches Vue H5 UX where
        // mount-time device tests are non-blocking). Non-permission errors on
        // startCameraDeviceTest are extremely rare on H5 and would only affect
        // the preview thumbnail, not the ability to enter a room.
        void startCameraTest({ view: previewElement as HTMLDivElement }).catch(() => {});
      }
      void startMicrophoneTest().catch(() => {});
    };

    TUIRoomEngine.once('ready', handleReady);

    return () => {
      cancelled = true;
      stopCameraTest();
      stopMicrophoneTest();
      roomEngine.instance?.off(TUIRoomEvents.onError, handleRoomError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themeClass = theme === 'dark' ? styles.themeDark : styles.themeLight;
  const brandLogoClass = classNames(styles.brandLogo, {
    [styles.brandLightZh]: theme === 'light' && language === 'zh-CN',
    [styles.brandLightEn]: theme === 'light' && language === 'en-US',
    [styles.brandDarkZh]: theme === 'dark' && language === 'zh-CN',
    [styles.brandDarkEn]: theme === 'dark' && language === 'en-US',
  });

  return (
    <div className={classNames(styles.homeContainerH5, themeClass)}>
      <header className={styles.headerH5}>
        <div className={styles.userInfoSection}>
          <LoginUserInfoH5 onLogout={onLogout} />
        </div>
        <div className={styles.headerActions}>
          <ThemeButton />
          <LanguageButton />
        </div>
      </header>

      <main className={styles.mainH5}>
        <div className={styles.previewCard}>
          <div className={styles.cameraPreviewArea}>
            <div className={styles.cameraPreviewAreaHeader}>
              <SwitchCameraButtonH5 />
            </div>
            <div id={PREVIEW_VIDEO_ID} className={styles.videoPreview} />
            <div className={styles.attentionInfo}>
              {!isCameraTesting && !isCameraTestLoading && (
                <span className={styles.offCameraInfo}>{t('Off Camera')}</span>
              )}
              {isCameraTestLoading && (
                <IconLoading size="36" className={styles.loading} />
              )}
            </div>
            <div className={styles.mediaControlsOverlay}>
              <MicButtonH5
                showDescription={false}
                customStyle={{ backgroundColor: 'transparent', color: '#fff' }}
                hasPermissionError={microphonePermissionDenied}
                onRetryPermission={() => onMicrophonePermissionDeniedChange?.(false)}
              />
              <CameraButtonH5
                cameraTestContainer={PREVIEW_VIDEO_ID}
                showDescription={false}
                customStyle={{ backgroundColor: 'transparent', color: '#fff' }}
                hasPermissionError={cameraPermissionDenied}
                onRetryPermission={() => onCameraPermissionDeniedChange?.(false)}
              />
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <JoinRoomButtonH5
            className={styles.primaryButton}
            onJoinRoom={onJoinRoom}
          />
          <StartRoomButtonH5
            className={styles.primaryButton}
            onStartRoom={onCreateRoom}
          />
        </div>
      </main>

      <footer className={styles.footerH5}>
        <div className={brandLogoClass} />
      </footer>
    </div>
  );
}
