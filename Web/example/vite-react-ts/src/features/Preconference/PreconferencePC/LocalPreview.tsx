import { useEffect, useRef, useState } from 'react';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { useLoginState } from 'tuikit-atomicx-react/room';
import { DeviceError, DeviceType, useDeviceState } from 'tuikit-atomicx-react/room';
import {
  IconAlertCircle,
  IconCam,
  IconCamOff,
  IconChevronUp,
  IconImage,
  IconMicOff,
  IconUnSupport,
  AudioDeviceMenu,
  MicLevelIcon,
  SettingsDialogPC,
  TUIAvatar,
  TUILoading,
  TUIPopover,
  VideoDeviceMenu,
  checkInsecureContext,
  useDeviceFault,
  useI18n,
} from '@tencentcloud/roomkit-web-react';
import type { SettingsTab } from '@tencentcloud/roomkit-web-react';
import './LocalPreview.scss';

const MIC_TEST_INTERVAL = 200;

export interface LocalPreviewProps {
  onBannerChange?: (key: string | undefined) => void;
}

export function LocalPreview(props: LocalPreviewProps) {
  const { onBannerChange } = props;
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const userName = loginUserInfo?.userName || loginUserInfo?.userId || '';
  const avatarUrl = loginUserInfo?.avatarUrl || '';
  const [micMenuOpen, setMicMenuOpen] = useState(false);
  const [camMenuOpen, setCamMenuOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('videoEffect');
  const {
    isCameraTesting,
    isCameraTestLoading,
    isMicrophoneTesting,
    cameraLastError,
    microphoneLastError,
    startCameraTest,
    stopCameraTest,
    startMicrophoneTest,
    stopMicrophoneTest,
  } = useDeviceState();
  const {
    errorTitle,
    errorDesc,
    cameraFault,
    microphoneFault,
    handleDeviceError,
    clearDeviceFault,
  } = useDeviceFault();
  const hasCameraError = cameraLastError !== DeviceError.NoError || !!cameraFault;
  const hasMicrophoneError = microphoneLastError !== DeviceError.NoError || !!microphoneFault;

  async function startCameraPreview() {
    try {
      await Promise.resolve();
      if (!previewRef.current) {
        return;
      }
      await startCameraTest({ view: previewRef.current });
      clearDeviceFault(DeviceType.Camera);
    } catch (error) {
      await handleDeviceError(DeviceType.Camera, error);
    }
  }

  async function startMicrophonePreview() {
    try {
      await startMicrophoneTest({ interval: MIC_TEST_INTERVAL });
      clearDeviceFault(DeviceType.Microphone);
    } catch (error) {
      await handleDeviceError(DeviceType.Microphone, error);
    }
  }

  function toggleCamera() {
    if (isCameraTestLoading) {
      return;
    }
    if (isCameraTesting) {
      stopCameraTest().catch(() => {});
    } else {
      startCameraPreview().catch(() => {});
    }
  }

  function toggleMicrophone() {
    if (isMicrophoneTesting) {
      stopMicrophoneTest().catch(() => {});
    } else {
      startMicrophonePreview().catch(() => {});
    }
  }

  function openSettings(tab: SettingsTab = 'videoEffect') {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  useEffect(() => {
    onBannerChange?.(checkInsecureContext() ? 'Device.Fault.InsecureBanner' : undefined);
    TUIRoomEngine.once('ready', () => {
      startCameraPreview().catch(() => {});
      startMicrophonePreview().catch(() => {});
    });
    return () => {
      stopCameraTest().catch(() => {});
      stopMicrophoneTest().catch(() => {});
    };
  }, []);

  function leaveForSetting(tab: SettingsTab) {
    setCamMenuOpen(false);
    openSettings(tab);
  }

  return (
    <div className={['local-preview', hasCameraError ? 'has-fault-overlay' : ''].filter(Boolean).join(' ')}>
      <div
        className="video-preview"
        aria-label={t('Preconference.PreviewCameraArea')}
      >
        <div
          ref={previewRef}
          className="video-preview-view"
        />
        {!isCameraTesting && !isCameraTestLoading && !hasCameraError && (
          <div className="video-placeholder">
            <div className="avatar-frame">
              <TUIAvatar
                className="preview-avatar"
                size={96}
                src={avatarUrl}
                alt={userName || t('Preconference.AvatarFallback')}
              />
            </div>
            <div className="video-off-info">
              <strong className="video-off-name">
                {userName || t('Preconference.PreviewFallbackName')}
              </strong>
              <span className="video-off-hint">
                <IconCamOff size={11} />
                {t('Preconference.CameraOff')}
              </span>
            </div>
          </div>
        )}
        {isCameraTestLoading && (
          <div className="video-preview-loading">
            <TUILoading spinning />
          </div>
        )}
        {hasCameraError && (
          <div className="preview-fault-overlay">
            <div className="preview-fault-overlay-icon">
              <IconAlertCircle size={20} />
            </div>
            <div className="preview-fault-overlay-title">
              {errorTitle}
            </div>
            <div className="preview-fault-overlay-desc">
              {errorDesc}
            </div>
          </div>
        )}
        <div className="name-tag">
          {userName || t('Preconference.PreviewFallbackName')}
        </div>
        <button
          className="video-fx-hint"
          type="button"
          onClick={() => openSettings('videoEffect')}
        >
          <IconImage size={12} />
          <span>{t('Settings.TabVideoEffect')}</span>
        </button>
      </div>

      <div className="media-controls">
        <div
          className={[
            'media-btn',
            !isMicrophoneTesting ? 'is-off' : '',
            hasMicrophoneError ? 'is-abnormal' : '',
          ].filter(Boolean).join(' ')}
        >
          <button
            className="media-btn-icon"
            type="button"
            aria-label={isMicrophoneTesting ? t('Device.MicClose') : t('Device.MicOpen')}
            onClick={toggleMicrophone}
          >
            <span className="media-btn-icon-wrap">
              {isMicrophoneTesting ? <MicLevelIcon size={20} /> : <IconMicOff size={20} />}
              {hasMicrophoneError && <IconUnSupport className="media-btn-badge" size={10} />}
            </span>
          </button>
          <i className="media-btn-divider" />
          <TUIPopover
            open={micMenuOpen}
            onUpdateOpen={setMicMenuOpen}
            placement="top"
            offset={8}
            padded={false}
            contentSlot={<AudioDeviceMenu />}
          >
            <button
              className={['media-btn-caret', micMenuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
              type="button"
              aria-label={t('Device.MicSettings')}
              aria-expanded={micMenuOpen}
            >
              <IconChevronUp size={12} />
            </button>
          </TUIPopover>
        </div>

        <div
          className={[
            'media-btn',
            !isCameraTesting ? 'is-off' : '',
            hasCameraError ? 'is-abnormal' : '',
          ].filter(Boolean).join(' ')}
        >
          <button
            className="media-btn-icon"
            type="button"
            aria-label={isCameraTesting ? t('Device.CamClose') : t('Device.CamOpen')}
            disabled={isCameraTestLoading}
            onClick={toggleCamera}
          >
            <span className="media-btn-icon-wrap">
              {isCameraTesting ? <IconCam size={20} /> : <IconCamOff size={20} />}
              {hasCameraError && <IconUnSupport className="media-btn-badge" size={10} />}
            </span>
          </button>
          <i className="media-btn-divider" />
          <TUIPopover
            open={camMenuOpen}
            onUpdateOpen={setCamMenuOpen}
            placement="top"
            offset={8}
            padded={false}
            contentSlot={<VideoDeviceMenu onOpenSetting={leaveForSetting} />}
          >
            <button
              className={['media-btn-caret', camMenuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
              type="button"
              aria-label={t('Device.VideoSettings')}
              aria-expanded={camMenuOpen}
            >
              <IconChevronUp size={12} />
            </button>
          </TUIPopover>
        </div>
      </div>

      <SettingsDialogPC
        open={settingsOpen}
        activeTab={settingsTab}
        onSelect={setSettingsTab}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default LocalPreview;
