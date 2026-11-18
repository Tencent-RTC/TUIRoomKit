import { useEffect, useRef, useState } from 'react';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { DeviceError, DeviceType, LoginStatus, MirrorType, VideoQuality, useDeviceState, useLoginState } from 'tuikit-atomicx-react/room';
import { IconCam, IconCamOff, IconFlipCamera, IconMicOff, MicLevelIcon, TUIAvatar, TUILoading, useDeviceFault, useI18n } from '@tencentcloud/roomkit-web-react';
import './PreclassPreviewMobile.scss';

export default function PreclassPreviewMobile() {
  const { t } = useI18n();
  const { loginUserInfo, loginStatus } = useLoginState();
  const userName = loginUserInfo?.userName || loginUserInfo?.userId || '';
  const avatarUrl = loginUserInfo?.avatarUrl || '';
  const previewRef = useRef<HTMLDivElement>(null);
  const [isFlipPending, setFlipPending] = useState(false);
  const flipId = useRef(0);
  const isFlipping = useRef(false);
  const lastFrontMirror = useRef(MirrorType.Auto);
  const flipTimer = useRef<ReturnType<typeof setTimeout>>();
  const { isCameraTesting, isCameraTestLoading, isMicrophoneTesting, isFrontCamera, cameraLastError, microphoneLastError, localMirrorType, startCameraTest, stopCameraTest, startMicrophoneTest, stopMicrophoneTest, switchCamera, switchMirror, updateVideoQuality } = useDeviceState();
  const { errorTitle, errorDesc, cameraFault, microphoneFault, handleDeviceError, clearDeviceFault } = useDeviceFault();
  const hasCameraError = cameraLastError !== DeviceError.NoError || !!cameraFault;
  const hasMicrophoneError = microphoneLastError !== DeviceError.NoError || !!microphoneFault;
  const shouldShowAvatar = !isCameraTesting && !isCameraTestLoading && !hasCameraError;

  async function startCameraPreview() {
    try {
      if (!previewRef.current) return;
      // Match the in-class 720p pipeline to avoid a framing jump on entry.
      await updateVideoQuality({ quality: VideoQuality.Quality720P });
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
  async function flipCamera() {
    if (isFlipping.current) return;
    flipId.current += 1;
    const id = flipId.current;
    isFlipping.current = true;
    setFlipPending(true);
    flipTimer.current = setTimeout(() => {
      if (id === flipId.current) {
        isFlipping.current = false;
        setFlipPending(false);
      }
    }, 5000);
    const timer = flipTimer.current;
    try {
      const shouldUseFront = !isFrontCamera;
      if (!shouldUseFront) lastFrontMirror.current = localMirrorType;
      await switchCamera({ isFrontCamera: shouldUseFront });
      if (id !== flipId.current) return;
      await switchMirror({ mirror: shouldUseFront ? lastFrontMirror.current : MirrorType.Disable });
    } catch (error) {
      console.error('[PreclassMobile] Failed to switch camera:', error);
    } finally {
      clearTimeout(timer);
      if (id === flipId.current) {
        isFlipping.current = false;
        setFlipPending(false);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;
    let hasStarted = false;
    lastFrontMirror.current = isFrontCamera ? localMirrorType : MirrorType.Auto;
    async function startDevices() {
      if (!isMounted || hasStarted) return;
      hasStarted = true;
      await startCameraPreview();
      if (isMounted) await startMicrophonePreview();
    }
    TUIRoomEngine.once('ready', () => {
      startDevices().catch(() => {});
    });
    if (loginStatus === LoginStatus.LOGINED) startDevices().catch(() => {});
    return () => {
      isMounted = false;
      flipId.current += 1;
      clearTimeout(flipTimer.current);
      stopCameraTest().catch(() => {});
      stopMicrophoneTest().catch(() => {});
    };
  }, []);

  return (
    <div className={`preclass-preview ${isCameraTesting ? 'is-on' : ''} ${hasCameraError ? 'has-fault' : ''}`}>
      <div ref={previewRef} className="preclass-preview-view" />
      {shouldShowAvatar && (
        <div className="preclass-preview-off">
          <TUIAvatar className="preclass-preview-avatar" size={60} src={avatarUrl} alt={userName || t('Preconference.AvatarFallback')} />
          <b className="preclass-preview-off-name">{userName}</b>
        </div>
      )}
      {isCameraTestLoading && <div className="preclass-preview-loading"><TUILoading spinning /></div>}
      {hasCameraError && (
        <div className="preclass-preview-fault">
          <p className="preclass-preview-fault-title">{errorTitle}</p>
          <p className="preclass-preview-fault-desc">{errorDesc}</p>
        </div>
      )}
      {isCameraTesting && (
        <button
          className={`preclass-preview-flip ${isFlipPending ? 'is-pending' : ''}`}
          type="button"
          disabled={isFlipPending}
          aria-label={t('Device.FlipCamera')}
          onClick={() => {
            flipCamera().catch(() => {});
          }}
        >
          <IconFlipCamera size={16} />
        </button>
      )}
      <span className="preclass-preview-name">{userName || t('Preconference.PreviewFallbackName')}</span>
      <div className="preclass-preview-controls">
        <button className="preclass-preview-control" type="button" aria-label={t(isMicrophoneTesting ? 'Device.MicClose' : 'Device.MicOpen')} onClick={toggleMicrophone}>
          {isMicrophoneTesting ? <MicLevelIcon size={16} /> : <IconMicOff size={16} />}
          {hasMicrophoneError && <span className="preclass-preview-fault-badge" aria-hidden="true">!</span>}
        </button>
        <button className="preclass-preview-control" type="button" disabled={isCameraTestLoading} aria-label={t(isCameraTesting ? 'Device.CamClose' : 'Device.CamOpen')} onClick={toggleCamera}>
          {isCameraTesting ? <IconCam size={16} /> : <IconCamOff size={16} />}
          {hasCameraError && <span className="preclass-preview-fault-badge" aria-hidden="true">!</span>}
        </button>
      </div>
    </div>
  );
}
