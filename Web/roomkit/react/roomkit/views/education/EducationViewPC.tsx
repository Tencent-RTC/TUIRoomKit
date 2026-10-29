import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { FillMode, RoomParticipantView, VideoStreamType } from 'tuikit-atomicx-react/room';
import {
  IconFullscreen,
  IconLeave,
  IconRestore,
  RoomKitProvider,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  TUITooltip,
  useFullscreen,
} from '../../base';
import type { RoomKitProviderExpose } from '../../base';
import type { ElementRef } from '../../base/headless/types';
import { useI18n } from '../../i18n';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  CameraButton,
  CurrentRoomInfoPC,
  LocalNetworkInfoPC,
  MicButton,
  RoomChatPC,
  ScreenShareButton,
  SettingButtonPC,
  SettingsDialogPC,
  WhiteboardButton,
  WhiteboardView,
} from '../../features';
import type { SettingsTab } from '../../features';
import ToolbarButtonPC from '../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import ParticipantTile from './components/ParticipantTile';
import { useClassSeats } from './hooks/useClassSeats';
import './EducationViewPC.scss';

export interface EducationViewPCProps {
  /** Accepted so every scene view shares one signature; the topbar reads the room record. */
  roomName?: string;
  onLeave?: () => void;
}

const LOADING_KEYS: Partial<Record<RoomEntryPhase, string>> = {
  login: 'RoomEntry.LoggingIn',
  profile: 'RoomEntry.Preparing',
  joining: 'RoomEntry.Joining',
};

export function EducationViewPC(props: EducationViewPCProps) {
  const { onLeave } = props;
  const { t } = useI18n();

  const { phase } = useSyncExternalStore(roomEntry.subscribe, roomEntry.getSnapshot, roomEntry.getSnapshot);
  const hostRef = useRef<RoomKitProviderExpose | null>(null);
  const rootRef = useMemo<ElementRef>(() => ({
    get current() {
      return hostRef.current?.context.root ?? null;
    },
  }), []);

  // Mounted before the join runs, so tips catch events a late joiner receives.
  useRoomTips({ onLeave: () => onLeave?.() });
  useAutoPlayDialog();

  const loadingKey = LOADING_KEYS[phase];

  const [password, setPassword] = useState('');
  const [passwordErrorKey, setPasswordErrorKey] = useState('');

  // A wrong password sends the entry back to this phase with an `incorrect` challenge.
  useEffect(() => {
    if (phase !== 'password') {
      return;
    }
    setPassword('');
    setPasswordErrorKey(roomEntry.passwordChallenge === 'incorrect' ? 'RoomEntry.WrongPassword' : '');
  }, [phase]);

  function onPasswordInput(value: string | number | null) {
    setPassword(String(value ?? '').replace(/\D/g, '').slice(0, 6));
    setPasswordErrorKey('');
  }

  function submitPassword() {
    if (!/^\d{6}$/.test(password)) {
      setPasswordErrorKey('RoomEntry.InvalidPassword');
      return;
    }
    roomEntry.submitPassword(password);
  }

  const { canEndRoom, leaveRoom, endRoom } = useRoomExit();
  const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);

  async function exit(action: 'leave' | 'end') {
    setLeaveMenuOpen(false);
    await (action === 'end' ? endRoom() : leaveRoom());
    onLeave?.();
  }

  const { teacher, student, sharer } = useClassSeats();
  const { fullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('audio');

  function openSettings(tab: SettingsTab = 'audio') {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  return (
    <RoomKitProvider ref={hostRef} className="education-root" scene="education">
      <div className="education-view">
        {phase === 'idle' && (
          <>
            <header className="education-topbar">
              <div className="education-topbar-left">
                <CurrentRoomInfoPC />
                <LocalNetworkInfoPC />
              </div>

              <div className="education-topbar-right">
                <div className="education-topbar-group">
                  <MicButton />
                  <CameraButton onOpenSetting={openSettings} />
                  {canEndRoom && (
                    <ScreenShareButton>
                      <WhiteboardButton />
                    </ScreenShareButton>
                  )}
                </div>
                <span className="education-topbar-divider" />
                <div className="education-topbar-group">
                  <SettingButtonPC active={settingsOpen} onClick={() => openSettings()} />
                </div>
                <span className="education-topbar-divider" />
                <div className="education-topbar-group">
                  <ToolbarButtonPC
                    label={fullscreen ? t('Room.ExitFullscreen') : t('Room.Fullscreen')}
                    icon={fullscreen ? IconRestore : IconFullscreen}
                    onClick={toggleFullscreen}
                  />
                  <TUIPopover
                    open={leaveMenuOpen}
                    disabled={!canEndRoom}
                    placement="bottom-end"
                    offset={10}
                    padded={false}
                    onUpdateOpen={setLeaveMenuOpen}
                    contentSlot={(
                      <div className="education-leave-menu" role="menu">
                        <TUIButton variant="danger" block role="menuitem" onClick={() => exit('end')}>
                          {t('Education.End')}
                        </TUIButton>
                        <TUIButton variant="ghost" block role="menuitem" onClick={() => exit('leave')}>
                          {t('Education.Leave')}
                        </TUIButton>
                      </div>
                    )}
                  >
                    <TUITooltip content={t('Education.Leave')} disabled={leaveMenuOpen} placement="bottom">
                      <button
                        className={['education-leave', leaveMenuOpen && 'is-open'].filter(Boolean).join(' ')}
                        type="button"
                        aria-label={t('Education.Leave')}
                        aria-haspopup={canEndRoom ? 'menu' : undefined}
                        aria-expanded={canEndRoom ? leaveMenuOpen : undefined}
                        onClick={() => {
                          if (!canEndRoom) {
                            void exit('leave');
                          }
                        }}
                      >
                        <IconLeave size={16} />
                      </button>
                    </TUITooltip>
                  </TUIPopover>
                </div>
              </div>
            </header>

            <main className="education-workspace">
              <section className="education-stage">
                <div className="education-board" data-tile-role="stage">
                  {sharer
                    ? (
                      <>
                        <div className="education-board-stream">
                          <RoomParticipantView
                            participant={sharer}
                            streamType={VideoStreamType.Screen}
                            fillMode={FillMode.Fit}
                            lazyLoad={{ enable: false }}
                          />
                        </div>
                        <WhiteboardView participant={sharer} streamType={VideoStreamType.Screen} />
                      </>
                    )
                    : (
                      <p className="education-board-empty">
                        {t('Education.StageEmpty')}
                      </p>
                    )}
                </div>
              </section>

              <aside className="education-rail">
                <ParticipantTile participant={teacher} placeholder={t('Education.WaitingTeacher')} />
                <ParticipantTile participant={student} placeholder={t('Education.WaitingStudent')} />
                <section className="education-chat">
                  <header className="education-chat-title">
                    {t('Education.ChatTitle')}
                  </header>
                  <RoomChatPC className="education-chat-body" />
                </section>
              </aside>
            </main>

            <SettingsDialogPC
              open={settingsOpen}
              activeTab={settingsTab}
              onSelect={setSettingsTab}
              onClose={() => setSettingsOpen(false)}
            />
          </>
        )}

        {loadingKey && (
          <div className="education-join-loading">
            <TUILoading variant="card" size="lg" tip={t(loadingKey)} />
          </div>
        )}
        <TUIDialog
          open={phase === 'password'}
          title={t('RoomEntry.PasswordTitle')}
          width="420px"
          confirmText={t('RoomEntry.Join')}
          cancelText={t('RoomEntry.Cancel')}
          closable={false}
          closeOnOverlay={false}
          onConfirm={submitPassword}
          onCancel={() => roomEntry.cancelPassword()}
          onUpdateOpen={(open) => {
            if (!open && phase === 'password') {
              roomEntry.cancelPassword();
            }
          }}
        >
          <TUIInput
            modelValue={password}
            type="password"
            showPassword
            maxlength={6}
            textAlign="center"
            autoFocus
            status={passwordErrorKey ? 'error' : 'default'}
            onUpdateModelValue={onPasswordInput}
            onEnter={submitPassword}
          />
          {passwordErrorKey && (
            <p className="education-join-error">
              {t(passwordErrorKey)}
            </p>
          )}
        </TUIDialog>
      </div>
    </RoomKitProvider>
  );
}

export default EducationViewPC;
