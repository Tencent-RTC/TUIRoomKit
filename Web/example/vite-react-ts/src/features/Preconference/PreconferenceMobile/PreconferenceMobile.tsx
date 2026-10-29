import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import {
  DeviceError,
  DeviceType,
  MirrorType,
  useDeviceState,
  useLoginState,
} from 'tuikit-atomicx-react/room';
import {
  IconCam,
  IconCamOff,
  IconFlipCamera,
  IconHash,
  IconLogin,
  IconMicOff,
  MicLevelIcon,
  IconRefresh,
  MeetingDetailMobile,
  ScheduledListMobile,
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUIPopup,
  TUIToast,
  useDeviceFault,
  useI18n,
} from '@tencentcloud/roomkit-web-react';
import './PreconferenceMobile.scss';

const MIC_TEST_INTERVAL = 200;
const JOIN_FOCUS_DELAY_MS = 320;
const DETAIL_MS = 320;

export interface PreconferenceMobileProps {
  className?: string;
  onCreate?: () => void;
  onJoin?: (roomId: string, password?: string) => void;
  onLogout?: () => void;
}

function DetailLayer(props: { open: boolean; children: ReactNode }) {
  const { open, children } = props;
  const [mounted, setMounted] = useState(false);
  const [motionClass, setMotionClass] = useState('');
  const mountedRef = useRef(false);

  useEffect(() => {
    if (open) {
      mountedRef.current = true;
      setMounted(true);
      setMotionClass('pre-detail-enter-from pre-detail-enter-active');
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          setMotionClass('pre-detail-enter-to pre-detail-enter-active');
        });
      });
      return () => {
        cancelAnimationFrame(outer);
        if (inner) {
          cancelAnimationFrame(inner);
        }
      };
    }
    if (!mountedRef.current) {
      return undefined;
    }
    setMotionClass('pre-detail-leave-active');
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setMotionClass('pre-detail-leave-active pre-detail-leave-to');
      });
    });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      mountedRef.current = false;
      setMounted(false);
      setMotionClass('');
    }, reduce ? 0 : DETAIL_MS);
    return () => {
      cancelAnimationFrame(outer);
      if (inner) {
        cancelAnimationFrame(inner);
      }
      window.clearTimeout(timer);
    };
  }, [open]);

  if (!mounted) {
    return null;
  }
  return (
    <div className={['pre-detail', motionClass].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function PreconferenceMobile(props: PreconferenceMobileProps) {
  const {
    className,
    onCreate,
    onJoin,
    onLogout,
  } = props;
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const displayUserName = loginUserInfo?.userName || loginUserInfo?.userId || '';
  const displayAvatarUrl = loginUserInfo?.avatarUrl || '';

  const [searchParams, setSearchParams] = useSearchParams();
  const [linkRoomId] = useState(() => searchParams.get('roomId') || '');
  const [showRefreshReturn, setShowRefreshReturn] = useState(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return navigation?.type === 'reload' && Boolean(linkRoomId);
  });
  const [roomInput, setRoomInput] = useState(linkRoomId);
  const [joinOpen, setJoinOpen] = useState(Boolean(linkRoomId));

  function dismissRefreshReturn() {
    setShowRefreshReturn(false);
    setRoomInput('');
    setJoinOpen(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('roomId');
      return next;
    }, { replace: true });
  }

  const {
    isMicrophoneTesting,
    isCameraTesting,
    isCameraTestLoading,
    isFrontCamera,
    localMirrorType,
    microphoneLastError,
    cameraLastError,
    getMicrophoneList,
    getCameraList,
    startMicrophoneTest,
    stopMicrophoneTest,
    startCameraTest,
    stopCameraTest,
    switchCamera,
    switchMirror,
  } = useDeviceState();
  const { handleDeviceError, clearDeviceFault, microphoneFault, cameraFault } = useDeviceFault();

  const hasMicrophoneError = microphoneLastError !== DeviceError.NoError || !!microphoneFault;
  const hasCameraError = cameraLastError !== DeviceError.NoError || !!cameraFault;
  // The back camera never mirrors; the front camera's saved setting comes back on
  // the return trip. Seeded once, matching the Vue component's `let` initialization.
  const frontCameraMirrorRef = useRef(
    isFrontCamera ? localMirrorType : MirrorType.Auto,
  );

  const [cameraStarting, setCameraStarting] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRoomId, setDetailRoomId] = useState('');
  const previewRef = useRef<HTMLDivElement | null>(null);
  const joinExpandRef = useRef<HTMLDivElement | null>(null);
  const joinFocusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showVideo = isCameraTesting || cameraStarting;

  useEffect(() => {
    if (isCameraTesting) {
      setCameraStarting(false);
    }
  }, [isCameraTesting]);

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setDetailOpen(false);
      }
    }
    document.addEventListener('keydown', onKeydown);
    getMicrophoneList().catch(() => {});
    getCameraList().catch(() => {});
    TUIRoomEngine.once('ready', () => {
      startCameraPreview().catch(() => {});
      startMicrophonePreview().catch(() => {});
    });
    return () => {
      document.removeEventListener('keydown', onKeydown);
      clearTimeout(joinFocusTimerRef.current);
      stopMicrophoneTest().catch(() => {});
      stopCameraTest().catch(() => {});
    };
    // Device list and test teardown run once, matching the Vue mount hooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startMicrophonePreview() {
    try {
      await startMicrophoneTest({ interval: MIC_TEST_INTERVAL });
      clearDeviceFault(DeviceType.Microphone);
    } catch (error) {
      await handleDeviceError(DeviceType.Microphone, error);
    }
  }

  async function startCameraPreview() {
    flushSync(() => {
      setCameraStarting(true);
    });
    try {
      if (!previewRef.current) {
        setCameraStarting(false);
        return;
      }
      await startCameraTest({ view: previewRef.current });
      clearDeviceFault(DeviceType.Camera);
    } catch (error) {
      setCameraStarting(false);
      await handleDeviceError(DeviceType.Camera, error);
    }
  }

  async function toggleMicrophone() {
    if (isMicrophoneTesting) {
      await stopMicrophoneTest().catch(() => {});
      return;
    }
    await startMicrophonePreview();
  }

  async function toggleCamera() {
    if (isCameraTestLoading) {
      return;
    }
    if (isCameraTesting) {
      setCameraStarting(false);
      await stopCameraTest().catch(() => {});
      return;
    }
    await startCameraPreview();
  }

  async function flipCamera() {
    // Vue re-reads isFrontCamera after the switch inside the await; the captured
    // pre-switch value is the stable equivalent here.
    const wasFront = isFrontCamera;
    await switchCamera({ isFrontCamera: !wasFront });
    if (!wasFront) {
      await switchMirror({ mirror: frontCameraMirrorRef.current });
      return;
    }
    frontCameraMirrorRef.current = localMirrorType;
    await switchMirror({ mirror: MirrorType.Disable });
  }

  function toggleJoin() {
    const next = !joinOpen;
    setJoinOpen(next);
    clearTimeout(joinFocusTimerRef.current);
    if (next) {
      joinFocusTimerRef.current = setTimeout(() => {
        const input = joinExpandRef.current?.querySelector('input');
        if (input instanceof HTMLInputElement) {
          input.focus();
        }
      }, JOIN_FOCUS_DELAY_MS);
    }
  }

  function onRoomId(value: string | number | null) {
    setRoomInput(String(value ?? ''));
  }

  function submitJoin() {
    const id = String(roomInput ?? '').trim();
    if (!id) {
      TUIToast.info(t('Preconference.EmptyRoomId'));
      return;
    }
    if (!/^\d+$/.test(id)) {
      TUIToast.info(t('Preconference.InvalidRoomId'));
      return;
    }
    onJoin?.(id);
  }

  function openDetail(id: string) {
    setDetailRoomId(id);
    setDetailOpen(true);
  }

  function onProfileKeydown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    setProfileOpen(open => !open);
  }

  function askLogout() {
    setProfileOpen(false);
    setLogoutOpen(true);
  }

  function confirmLogout() {
    setLogoutOpen(false);
    onLogout?.();
  }

  return (
    <div className={['preconference-mobile', className].filter(Boolean).join(' ')}>
      <header className="pre-topbar">
        <div
          className="pre-profile"
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-label={displayUserName || t('Preconference.AvatarFallback')}
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen(open => !open)}
          onKeyDown={onProfileKeydown}
        >
          <span className="pre-avatar-btn">
            <TUIAvatar
              size={32}
              src={displayAvatarUrl}
              alt={displayUserName || t('Preconference.AvatarFallback')}
            />
          </span>
          <h2 className="pre-user-name" title={displayUserName}>
            {displayUserName}
          </h2>
        </div>
      </header>

      <div className="pre-body">
        <div
          className={['pre-preview', isCameraTesting ? 'is-on' : ''].filter(Boolean).join(' ')}
          aria-label={t('Preconference.PreviewRegion')}
        >
          <div
            className="pre-preview-avatar"
            style={{ display: isCameraTesting ? 'none' : undefined }}
          >
            <TUIAvatar
              size={56}
              src={displayAvatarUrl}
              alt={displayUserName || t('Preconference.AvatarFallback')}
            />
          </div>
          <div
            ref={previewRef}
            className="pre-preview-video"
            style={{ display: showVideo ? undefined : 'none' }}
          />
          {isCameraTesting && (
            <button
              type="button"
              className="pre-flip-camera"
              aria-label={t('Device.FlipCamera')}
              onClick={() => {
                flipCamera().catch(() => {});
              }}
            >
              <IconFlipCamera size={16} />
            </button>
          )}
          <span className="pre-name-tag">
            {displayUserName || t('Preconference.PreviewFallbackName')}
          </span>
          <div className="pre-controls">
            <button
              type="button"
              className={['pre-media-btn', isMicrophoneTesting ? '' : 'is-off'].filter(Boolean).join(' ')}
              aria-pressed={isMicrophoneTesting}
              aria-label={isMicrophoneTesting ? t('Device.MicClose') : t('Device.MicOpen')}
              onClick={() => {
                toggleMicrophone().catch(() => {});
              }}
            >
              <span className="pre-media-icon">
                {isMicrophoneTesting ? <MicLevelIcon size={16} /> : <IconMicOff size={16} />}
                {hasMicrophoneError && <span className="pre-media-fault">!</span>}
              </span>
            </button>
            <button
              type="button"
              className={['pre-media-btn', isCameraTesting ? '' : 'is-off'].filter(Boolean).join(' ')}
              disabled={isCameraTestLoading}
              aria-pressed={isCameraTesting}
              aria-label={isCameraTesting ? t('Device.CamClose') : t('Device.CamOpen')}
              onClick={() => {
                toggleCamera().catch(() => {});
              }}
            >
              <span className="pre-media-icon">
                {isCameraTesting ? <IconCam size={16} /> : <IconCamOff size={16} />}
                {hasCameraError && <span className="pre-media-fault">!</span>}
              </span>
            </button>
          </div>
        </div>

        <div className="pre-actions">
          {showRefreshReturn
            ? (
              <section className="pre-return" aria-label={t('RefreshReturn.Title')}>
                <div className="pre-return-icon" aria-hidden="true">
                  <IconRefresh size={18} />
                </div>
                <div className="pre-return-text">
                  <div className="pre-return-title">
                    {t('RefreshReturn.Title')}
                  </div>
                  <div className="pre-return-sub">
                    {t('RefreshReturn.Still')}
                  </div>
                </div>
                <div className="pre-return-actions">
                  <button
                    type="button"
                    className="pre-return-btn"
                    onClick={dismissRefreshReturn}
                  >
                    {t('RefreshReturn.Cancel')}
                  </button>
                  <button
                    type="button"
                    className="pre-return-btn is-primary"
                    onClick={() => onJoin?.(linkRoomId)}
                  >
                    {t('RefreshReturn.Confirm')}
                  </button>
                </div>
              </section>
            )
            : (
              <>
                <button
                  type="button"
                  className="pre-action-card is-primary"
                  onClick={() => onCreate?.()}
                >
                  <div className="pre-action-icon">
                    <IconCam size={18} />
                  </div>
                  <div className="pre-action-text">
                    <div className="pre-action-title">
                      {t('Preconference.CreateTitle')}
                    </div>
                    <div className="pre-action-sub">
                      {t('Preconference.CreateSub')}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className={['pre-action-card', joinOpen ? 'is-primary' : ''].filter(Boolean).join(' ')}
                  aria-expanded={joinOpen}
                  onClick={toggleJoin}
                >
                  <div className="pre-action-icon">
                    <IconLogin size={18} />
                  </div>
                  <div className="pre-action-text">
                    <div className="pre-action-title">
                      {t('Preconference.Join')}
                    </div>
                    <div className="pre-action-sub">
                      {t('Preconference.JoinSub')}
                    </div>
                  </div>
                </button>
              </>
            )}
        </div>

        <div
          ref={joinExpandRef}
          className={['pre-join-expand', joinOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
          style={{ display: showRefreshReturn ? 'none' : undefined }}
        >
          <TUIInput
            className="pre-join-input"
            type="number"
            size="lg"
            maxlength={6}
            modelValue={roomInput}
            placeholder={t('Preconference.RoomIdPlaceholder')}
            aria-label={t('Preconference.RoomIdLabel')}
            onUpdateModelValue={onRoomId}
            onEnter={submitJoin}
            prefixSlot={<IconHash size={14} />}
          />
          <TUIButton
            className="pre-join-btn"
            variant="primary"
            onClick={submitJoin}
          >
            {t('RoomEntry.Join')}
          </TUIButton>
        </div>

        <section className="recent">
          <div className="recent-label">
            {t('Preconference.RecentMeetings')}
          </div>
          <ScheduledListMobile onJoin={onJoin} onDetail={openDetail} />
        </section>
      </div>

      <DetailLayer open={detailOpen}>
        <MeetingDetailMobile
          roomId={detailRoomId}
          onBack={() => setDetailOpen(false)}
          onJoin={onJoin}
          onCancelled={() => setDetailOpen(false)}
        />
      </DetailLayer>

      <TUIPopup open={profileOpen} height="auto" onUpdateOpen={setProfileOpen}>
        <div className="profile-sheet-body">
          <button type="button" className="profile-sheet-logout" onClick={askLogout}>
            {t('Preconference.Logout')}
          </button>
        </div>
      </TUIPopup>

      <TUIDialog
        open={logoutOpen}
        title={t('Preconference.Logout')}
        confirmText={t('Preconference.Logout')}
        confirmVariant="danger"
        cancelText={t('Cancel')}
        onUpdateOpen={setLogoutOpen}
        onConfirm={confirmLogout}
      >
        {t('Preconference.LogoutConfirm')}
      </TUIDialog>
    </div>
  );
}

export default PreconferenceMobile;
