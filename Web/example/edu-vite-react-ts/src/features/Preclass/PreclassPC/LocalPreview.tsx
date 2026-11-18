import { useEffect, useRef, useState } from 'react';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { DeviceError, DeviceType, LoginStatus, useDeviceState, useLoginState } from 'tuikit-atomicx-react/room';
import { IconAlertCircle, IconCam, IconCamOff, IconChevronUp, IconImage, IconMicOff, AudioDeviceMenu, EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST, MicLevelIcon, SettingsDialogPC, TUIAvatar, TUILoading, TUIPopover, VideoDeviceMenu, checkInsecureContext, useDeviceFault, useI18n } from '@tencentcloud/roomkit-web-react';
import type { SettingsTab } from '@tencentcloud/roomkit-web-react';

export default function LocalPreview({ onBannerChange }: { onBannerChange: (key: string | undefined) => void }) {
  const { t } = useI18n();
  const { loginUserInfo, loginStatus } = useLoginState();
  const userName = loginUserInfo?.userName || loginUserInfo?.userId || '';
  const avatarUrl = loginUserInfo?.avatarUrl || '';
  const [isMicMenuOpen, setMicMenuOpen] = useState(false);
  const [isCamMenuOpen, setCamMenuOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('videoEffect');
  const previewRef = useRef<HTMLDivElement>(null);
  const wasCameraOn = useRef(false);
  const { isCameraTesting, isCameraTestLoading, isMicrophoneTesting, cameraLastError, microphoneLastError, startCameraTest, stopCameraTest, startMicrophoneTest, stopMicrophoneTest } = useDeviceState();
  const { errorTitle, errorDesc, cameraFault, microphoneFault, handleDeviceError, clearDeviceFault } = useDeviceFault();
  const hasCameraError = cameraLastError !== DeviceError.NoError || !!cameraFault;
  const hasMicrophoneError = microphoneLastError !== DeviceError.NoError || !!microphoneFault;

  async function startCameraPreview() {
    try {
      if (!previewRef.current) return;
      await startCameraTest({ view: previewRef.current });
      clearDeviceFault(DeviceType.Camera);
    } catch (error) {
      await handleDeviceError(DeviceType.Camera, error);
    }
  }
  async function startMicrophonePreview() {
    try {
      await startMicrophoneTest({ interval: 200 });
      clearDeviceFault(DeviceType.Microphone);
    } catch (error) {
      await handleDeviceError(DeviceType.Microphone, error);
    }
  }
  function toggleCamera() {
    if (isCameraTestLoading) return;
    if (isCameraTesting) stopCameraTest().catch(() => {});
    else startCameraPreview().catch(() => {});
  }
  function toggleMicrophone() {
    if (isMicrophoneTesting) stopMicrophoneTest().catch(() => {});
    else startMicrophonePreview().catch(() => {});
  }
  function openSettings(tab: SettingsTab = 'videoEffect') {
    wasCameraOn.current = isCameraTesting;
    setSettingsTab(tab);
    setSettingsOpen(true);
  }
  function closeSettings() {
    setSettingsOpen(false);
    if (wasCameraOn.current) startCameraPreview().catch(() => {});
  }

  useEffect(() => {
    let isMounted = true;
    let hasStarted = false;
    function startDevices() {
      if (!isMounted || hasStarted) return;
      hasStarted = true;
      startCameraPreview().catch(() => {});
      startMicrophonePreview().catch(() => {});
    }
    onBannerChange(checkInsecureContext() ? 'Device.Fault.InsecureBanner' : undefined);
    TUIRoomEngine.once('ready', startDevices);
    if (loginStatus === LoginStatus.LOGINED) startDevices();
    return () => {
      isMounted = false;
      stopCameraTest().catch(() => {});
      stopMicrophoneTest().catch(() => {});
    };
  }, []);

  return (
    <div className={`local-preview ${hasCameraError ? 'has-fault-overlay' : ''}`}>
      <div className="video-preview" aria-label={t('Preconference.PreviewCameraArea')}>
        <div ref={previewRef} className="video-preview-view" />
        {!isCameraTesting && !isCameraTestLoading && !hasCameraError && <div className="video-placeholder"><TUIAvatar className="preview-avatar" size={88} src={avatarUrl} alt={userName || t('Preconference.AvatarFallback')} /></div>}
        {isCameraTestLoading && <div className="video-preview-loading"><TUILoading spinning /></div>}
        {hasCameraError && (
          <div className="preview-fault-overlay">
            <div className="preview-fault-overlay-icon"><IconAlertCircle size={20} /></div>
            <div className="preview-fault-overlay-title">{errorTitle}</div>
            <div className="preview-fault-overlay-desc">{errorDesc}</div>
          </div>
        )}
        <div className="name-tag">{userName || t('Preconference.PreviewFallbackName')}</div>
        <button className="video-fx-hint" type="button" onClick={() => openSettings('videoEffect')}>
          <IconImage size={12} />
          <span>{t('Settings.TabVideoEffect')}</span>
        </button>
      </div>
      <div className="media-controls">
        <div className={`media-btn ${isMicrophoneTesting ? '' : 'is-off'}`}>
          <button className="media-btn-icon" type="button" aria-label={t(isMicrophoneTesting ? 'Device.MicClose' : 'Device.MicOpen')} onClick={toggleMicrophone}>
            <span className="media-btn-icon-wrap">
              {isMicrophoneTesting ? <MicLevelIcon size={20} /> : <IconMicOff size={20} />}
              {hasMicrophoneError && <span className="media-btn-badge" aria-hidden="true">!</span>}
            </span>
          </button>
          <i className="media-btn-divider" />
          <TUIPopover open={isMicMenuOpen} onUpdateOpen={setMicMenuOpen} placement="top" offset={8} padded={false} contentSlot={<AudioDeviceMenu />}><button className={`media-btn-caret ${isMicMenuOpen ? 'is-open' : ''}`} type="button" aria-label={t('Device.MicSettings')} aria-expanded={isMicMenuOpen}><IconChevronUp size={12} /></button></TUIPopover>
        </div>
        <div className={`media-btn ${isCameraTesting ? '' : 'is-off'}`}>
          <button className="media-btn-icon" type="button" aria-label={t(isCameraTesting ? 'Device.CamClose' : 'Device.CamOpen')} disabled={isCameraTestLoading} onClick={toggleCamera}>
            <span className="media-btn-icon-wrap">
              {isCameraTesting ? <IconCam size={20} /> : <IconCamOff size={20} />}
              {hasCameraError && <span className="media-btn-badge" aria-hidden="true">!</span>}
            </span>
          </button>
          <i className="media-btn-divider" />
          <TUIPopover
            open={isCamMenuOpen}
            onUpdateOpen={setCamMenuOpen}
            placement="top"
            offset={8}
            padded={false}
            contentSlot={(
              <VideoDeviceMenu onOpenSetting={(tab) => {
                setCamMenuOpen(false);
                openSettings(tab);
              }}
              />
            )}
          >
            <button className={`media-btn-caret ${isCamMenuOpen ? 'is-open' : ''}`} type="button" aria-label={t('Device.VideoSettings')} aria-expanded={isCamMenuOpen}><IconChevronUp size={12} /></button>
          </TUIPopover>
        </div>
      </div>
      <SettingsDialogPC open={isSettingsOpen} activeTab={settingsTab} hiddenItems={['theme']} virtualBackgroundImgList={EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST} onSelect={setSettingsTab} onClose={closeSettings} />
    </div>
  );
}
