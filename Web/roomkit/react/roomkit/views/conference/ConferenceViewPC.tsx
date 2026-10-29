import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import {
  IconMembers,
  IconChat,
  IconAITranscription,
  IconPhone,
  RoomKitProvider,
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  useFullscreen,
  useUIConfig,
} from '../../base';
import type { RoomKitProviderExpose } from '../../base';
import type { ElementRef } from '../../base/headless/types';
import { useI18n } from '../../i18n';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  AnnotationButton,
  CameraButton,
  CaptionButton,
  CaptionOverlay,
  ChatButton,
  CloudRecordingButtonPC,
  CloudRecordingStatusPC,
  CurrentRoomInfoPC,
  LayoutButton,
  LocalNetworkInfoPC,
  MicButton,
  MiniWindow,
  isPictureInPictureSupported,
  ParticipantButtonPC,
  ParticipantListPC,
  RoomChatPC,
  RoomViewPC,
  ScreenShareButton,
  SettingButtonPC,
  SettingsDialogPC,
  TranscriptList,
  useASRState,
  WhiteboardButton,
  WhiteboardView,
} from '../../features';
import type { SettingsTab } from '../../features';
import type { MiniWindowExpose } from '../../features/MiniWindow/MiniWindow';
import OverflowToolbarPC from '../../layouts/OverflowToolbarPC';
import RoomSidePanelPC from '../../layouts/RoomSidePanelPC/RoomSidePanelPC';
import type { RoomSidePanelPCExpose, SidePanelTab } from '../../layouts/RoomSidePanelPC/RoomSidePanelPC';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useConferenceSize } from './hooks/useConferenceSize';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomLayoutState } from './hooks/useRoomLayoutState';
import { useRoomTips } from './hooks/useRoomTips';
import './ConferenceViewPC.scss';

export interface ConferenceViewPCProps {
  /** Accepted so both platform views share one signature; the PC topbar reads the room record. */
  roomName?: string;
  onLeave?: () => void;
  panelSlot?: (scope: { activeId: string | null; opened: string[] }) => ReactNode;
}

export function ConferenceViewPC(props: ConferenceViewPCProps) {
  const { onLeave, panelSlot } = props;
  const { t } = useI18n();

  const { phase } = useSyncExternalStore(roomEntry.subscribe, roomEntry.getSnapshot, roomEntry.getSnapshot);
  const hostRef = useRef<RoomKitProviderExpose | null>(null);
  const rootRef = useMemo<ElementRef>(() => ({
    get current() {
      return hostRef.current?.context.root ?? null;
    },
  }), []);

  const { layoutTemplate, stageStream, setLayoutTemplate, handleStreamDoubleClick } = useRoomLayoutState();
  const { uiConfig } = useUIConfig();
  const ParticipantViewUI = uiConfig.participantViewUI;
  const { currentRoom } = useRoomState();
  const { participantList } = useRoomParticipantState();
  const participantCount = currentRoom?.participantCount || participantList.length;
  // Mounted before the join runs, unlike the meeting chrome below, which is what the
  // recording notice inside needs to catch the start event a late joiner receives.
  useRoomTips({ onLeave: () => onLeave?.() });
  useAutoPlayDialog();

  const LOADING_KEYS: Partial<Record<RoomEntryPhase, string>> = {
    login: 'RoomEntry.LoggingIn',
    profile: 'RoomEntry.Preparing',
    joining: 'RoomEntry.Joining',
  };
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

  const { loginUserInfo } = useLoginState();
  const localUserName = loginUserInfo?.userName || loginUserInfo?.userId || '';

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('audio');

  function openSettings(tab: SettingsTab = 'audio') {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  const { size } = useConferenceSize(rootRef);
  const { fullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);

  const miniViewRef = useRef<MiniWindowExpose | null>(null);
  // Without Document PiP there is nowhere useful to minimize to, so the menu entry stays hidden.
  const [pipSupported] = useState(() => isPictureInPictureSupported());

  const { isCaptionShown } = useASRState();

  const PANEL_TABS: SidePanelTab[] = [
    { id: 'chat', label: t('Room.ChatPanel'), icon: IconChat },
    { id: 'participants', label: t('Participants.PanelCount', { count: participantCount }), icon: IconMembers },
    { id: 'transcript', label: t('AITools.RealtimeMessageList'), icon: IconAITranscription },
  ];

  const sidePanelRef = useRef<RoomSidePanelPCExpose | null>(null);
  const [openedPanels, setOpenedPanels] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  /**
   * The caption menu's transcript action is labelled by state ("关闭文字转写" /
   * "显示文字转写"), so the behaviour must always match the label: when the
   * panel is open — even while another tab is active — the action CLOSES it.
   * `toggle()` cannot do that: with another tab active it would focus the
   * transcript tab instead of closing it.
   */
  function toggleTranscriptPanel() {
    if (openedPanels.includes('transcript')) {
      sidePanelRef.current?.close('transcript');
      return;
    }
    sidePanelRef.current?.open('transcript');
  }

  function renderPanels(activeId: string | null): ReactNode {
    if (panelSlot) {
      return panelSlot({ activeId, opened: openedPanels });
    }
    return (
      <>
        {openedPanels.includes('chat') && (
          <RoomChatPC
            style={{ display: activeId === 'chat' ? undefined : 'none' }}
            isActive={activeId === 'chat'}
          />
        )}
        {openedPanels.includes('participants') && (
          <ParticipantListPC
            style={{ display: activeId === 'participants' ? undefined : 'none' }}
          />
        )}
        {openedPanels.includes('transcript') && (
          <TranscriptList
            style={{ display: activeId === 'transcript' ? undefined : 'none' }}
          />
        )}
      </>
    );
  }

  return (
    <RoomKitProvider ref={hostRef} className="conference-root">
      <div className="conference-view">
        {phase === 'idle' && (
          <>
            <header className="conference-topbar">
              <div className="conference-topbar-left">
                <CurrentRoomInfoPC narrow={size === 'thin'} />
                <LocalNetworkInfoPC />
                <CloudRecordingStatusPC />
              </div>

              <div className="conference-topbar-right">
                <LayoutButton layoutTemplate={layoutTemplate} onUpdateLayoutTemplate={setLayoutTemplate} />
                {localUserName && (
                  <div className="conference-user">
                    <TUIAvatar size={20} src={loginUserInfo?.avatarUrl} alt={localUserName} />
                    <span className="conference-user-name" title={localUserName}>{localUserName}</span>
                  </div>
                )}
              </div>
            </header>

            <main className="conference-body">
              <section className={['conference-stage', size === 'wide' && openedPanels.length > 0 ? 'conference-stage-docked' : ''].filter(Boolean).join(' ')}>
                <RoomViewPC
                  layoutTemplate={layoutTemplate}
                  stageStream={stageStream}
                  hideOverlay={Boolean(ParticipantViewUI)}
                  onStreamDoubleClick={handleStreamDoubleClick}
                  participantViewUISlot={({ participant, streamType, tileRole }) => (
                    <>
                      <WhiteboardView participant={participant} streamType={streamType} />
                      {ParticipantViewUI && <ParticipantViewUI participant={participant} streamType={streamType} />}
                      {/* A thumbnail is too small to draw on; the room holds the stage while annotating. */}
                      {tileRole === 'stage' && (
                        <div className="conference-share-actions">
                          <AnnotationButton participant={participant} streamType={streamType} />
                        </div>
                      )}
                    </>
                  )}
                />
                {isCaptionShown && (
                  <CaptionOverlay
                    transcriptOpen={openedPanels.includes('transcript')}
                    onToggleTranscript={() => sidePanelRef.current?.toggle('transcript')}
                  />
                )}

                <div className="conference-toolbar">
                  <MicButton />
                  <CameraButton onOpenSetting={openSettings} />

                  <OverflowToolbarPC
                    className="conference-toolbar-overflow"
                    fullscreen={fullscreen}
                    minimizable={pipSupported}
                    onMinimize={() => miniViewRef.current?.minimize()}
                    onFullscreen={toggleFullscreen}
                  >
                    <ParticipantButtonPC
                      active={openedPanels.includes('participants')}
                      onClick={() => sidePanelRef.current?.toggle('participants')}
                    />
                    <ChatButton
                      active={openedPanels.includes('chat')}
                      isChatActive={activePanel === 'chat'}
                      onClick={() => sidePanelRef.current?.toggle('chat')}
                    />
                    <ScreenShareButton>
                      <WhiteboardButton />
                    </ScreenShareButton>
                    <CloudRecordingButtonPC />
                    <CaptionButton
                      active={isCaptionShown || openedPanels.includes('transcript')}
                      transcriptOpen={openedPanels.includes('transcript')}
                      onToggleTranscript={toggleTranscriptPanel}
                    />
                    <SettingButtonPC active={settingsOpen} onClick={() => openSettings()} />
                  </OverflowToolbarPC>

                  <TUIPopover
                    open={leaveMenuOpen}
                    disabled={!canEndRoom}
                    placement="top-end"
                    offset={14}
                    padded={false}
                    showArrow
                    onUpdateOpen={setLeaveMenuOpen}
                    contentSlot={(
                      <div className="conference-leave-menu" role="menu">
                        <TUIButton variant="danger" block role="menuitem" onClick={() => exit('end')}>
                          {t('Room.End')}
                        </TUIButton>
                        <TUIButton variant="ghost" block role="menuitem" onClick={() => exit('leave')}>
                          {t('Room.Leave')}
                        </TUIButton>
                      </div>
                    )}
                  >
                    <TUIButton
                      className={['conference-leave', leaveMenuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
                      variant="danger"
                      aria-label={leaveMenuOpen ? t('Room.Cancel') : t('Room.Leave')}
                      aria-haspopup={canEndRoom ? 'menu' : undefined}
                      aria-expanded={canEndRoom ? leaveMenuOpen : undefined}
                      onClick={() => {
                        if (!canEndRoom) {
                          void exit('leave');
                        }
                      }}
                    >
                      {leaveMenuOpen
                        ? t('Room.Cancel')
                        : <IconPhone className="conference-leave-icon" size={22} />}
                    </TUIButton>
                  </TUIPopover>
                </div>
              </section>

              <RoomSidePanelPC
                ref={sidePanelRef}
                className={[
                  'conference-side-panel',
                  size !== 'wide' ? 'conference-side-panel-floating' : '',
                  !openedPanels.length ? 'is-closed' : '',
                ].filter(Boolean).join(' ')}
                tabs={PANEL_TABS}
                opened={openedPanels}
                activeId={activePanel}
                onUpdateOpened={setOpenedPanels}
                onUpdateActiveId={setActivePanel}
              >
                {({ activeId }) => renderPanels(activeId)}
              </RoomSidePanelPC>
            </main>

            <SettingsDialogPC
              open={settingsOpen}
              activeTab={settingsTab}
              onSelect={setSettingsTab}
              onClose={() => setSettingsOpen(false)}
            />

            <MiniWindow ref={miniViewRef} />
          </>
        )}

        {loadingKey && (
          <div className="conference-join-loading">
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
            <p className="conference-join-error">
              {t(passwordErrorKey)}
            </p>
          )}
        </TUIDialog>
      </div>
    </RoomKitProvider>
  );
}

export default ConferenceViewPC;
