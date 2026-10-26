import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-react/room';
import {
  IconPhone,
  RoomKitProvider,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  TUIPopup,
  useUIConfig,
} from '../../base';
import { useI18n } from '../../i18n';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  CameraButtonMobile,
  CaptionConfirmDialog,
  CaptionEntryMobile,
  CaptionMenuMobile,
  CaptionOverlayMobile,
  CaptionSettingsMobile,
  ChatButtonMobile,
  CloudRecordingButtonMobile,
  CloudRecordingStatusMobile,
  CurrentRoomInfoMobile,
  LocalNetworkInfoMobile,
  MicButtonMobile,
  ParticipantButtonMobile,
  ParticipantListMobile,
  RoomChatMobile,
  RoomViewMobile,
  SettingButtonMobile,
  SettingsDialogMobile,
  TranscriptListMobile,
  useASRState,
  useSubtitleViewState,
} from '../../features';
import OverflowToolbarMobile from '../../layouts/OverflowToolbarMobile';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import './ConferenceViewMobile.scss';

export interface ConferenceViewMobileProps {
  roomName?: string;
  onLeave?: () => void;
}

export function ConferenceViewMobile(props: ConferenceViewMobileProps) {
  const { roomName = '', onLeave } = props;
  const { t } = useI18n();

  const { phase } = useSyncExternalStore(roomEntry.subscribe, roomEntry.getSnapshot, roomEntry.getSnapshot);

  const { uiConfig } = useUIConfig();
  const ParticipantViewUI = uiConfig.participantViewUI;
  const { currentRoom } = useRoomState();
  const { participantList } = useRoomParticipantState();
  const participantCount = currentRoom?.participantCount || participantList.length;
  // Mounted before the join runs, so the recording notice catches the start event a late joiner receives.
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

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [captionSettingsOpen, setCaptionSettingsOpen] = useState(false);
  const { isCaptionShown } = useASRState();
  const { capViewOpen } = useSubtitleViewState();

  useEffect(() => {
    if (activePanel !== 'transcript') {
      setCaptionSettingsOpen(false);
    }
  }, [activePanel]);

  function togglePanel(id: string) {
    setActivePanel(activePanel === id ? null : id);
  }

  function closePanel(id: string) {
    if (activePanel === id) {
      setActivePanel(null);
    }
  }

  return (
    <RoomKitProvider className="conference-mobile-root">
      <div className="conference-mobile">
        {phase === 'idle' && (
          <>
            <header className="conference-mobile-topbar">
              <CurrentRoomInfoMobile roomName={roomName} />
              <LocalNetworkInfoMobile />
              <CloudRecordingStatusMobile />
              <div className="conference-mobile-leave">
                <TUIPopover
                  open={leaveMenuOpen}
                  disabled={!canEndRoom}
                  placement="bottom-end"
                  offset={10}
                  padded={false}
                  showArrow
                  onUpdateOpen={setLeaveMenuOpen}
                  contentSlot={(
                    <div className="conference-mobile-leave-menu" role="menu">
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
                    className={['conference-mobile-leave-trigger', leaveMenuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
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
                      : <IconPhone className="conference-mobile-leave-icon" size={15} />}
                  </TUIButton>
                </TUIPopover>
              </div>
            </header>

            <main className="conference-mobile-stage">
              <RoomViewMobile
                hideOverlay={Boolean(ParticipantViewUI)}
                participantViewUISlot={ParticipantViewUI
                  ? ({ participant, streamType }) => (
                    <ParticipantViewUI participant={participant} streamType={streamType} />
                  )
                  : undefined}
              />
              {isCaptionShown && (
                <CaptionOverlayMobile
                  className="conference-mobile-caption"
                  onOpenTranscript={() => togglePanel('transcript')}
                />
              )}
            </main>

            <footer className="conference-mobile-toolbar">
              <MicButtonMobile />
              <CameraButtonMobile />
              <OverflowToolbarMobile className="conference-mobile-toolbar-overflow">
                <ParticipantButtonMobile
                  active={activePanel === 'participants'}
                  onClick={() => togglePanel('participants')}
                />
                <ChatButtonMobile
                  active={activePanel === 'chat'}
                  isChatActive={activePanel === 'chat'}
                  onClick={() => togglePanel('chat')}
                />
                <CaptionEntryMobile
                  active={capViewOpen}
                  onClick={() => togglePanel('captions')}
                />
                <CloudRecordingButtonMobile />
                <SettingButtonMobile onClick={() => setSettingsOpen(true)} />
              </OverflowToolbarMobile>
            </footer>

            <TUIPopup
              open={activePanel === 'chat'}
              height="84%"
              title={t('Chat.Title')}
              onUpdateOpen={(open) => {
                if (!open) {
                  closePanel('chat');
                }
              }}
            >
              <RoomChatMobile className="conference-mobile-panel" isActive={activePanel === 'chat'} />
            </TUIPopup>
            <TUIPopup
              open={activePanel === 'participants'}
              height="84%"
              title={t('Participants.PanelCount', { count: participantCount })}
              onUpdateOpen={(open) => {
                if (!open) {
                  closePanel('participants');
                }
              }}
            >
              <ParticipantListMobile className="conference-mobile-panel" />
            </TUIPopup>
            <TUIPopup
              open={activePanel === 'captions'}
              height="auto"
              title={t('AITools.Entry')}
              onUpdateOpen={(open) => {
                if (!open) {
                  closePanel('captions');
                }
              }}
            >
              <CaptionMenuMobile
                className="conference-mobile-caption-menu"
                transcriptOpen={activePanel === 'transcript'}
                onTranscription={() => closePanel('captions')}
                onOpenTranscript={() => setActivePanel('transcript')}
              />
            </TUIPopup>
            <TUIPopup
              open={activePanel === 'transcript'}
              height="84%"
              title={t('AITools.RealtimeMessageList')}
              onUpdateOpen={(open) => {
                if (!open) {
                  closePanel('transcript');
                }
              }}
            >
              <TranscriptListMobile
                className="conference-mobile-panel"
                onOpenSettings={() => setCaptionSettingsOpen(true)}
              />
            </TUIPopup>
            <CaptionSettingsMobile open={captionSettingsOpen} onClose={() => setCaptionSettingsOpen(false)} />
            <CaptionConfirmDialog />

            <SettingsDialogMobile open={settingsOpen} onClose={() => setSettingsOpen(false)} />
          </>
        )}

        {loadingKey && (
          <div className="conference-mobile-join-loading">
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
          onClose={() => roomEntry.cancelPassword()}
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
            <p className="conference-mobile-join-error">
              {t(passwordErrorKey)}
            </p>
          )}
        </TUIDialog>
      </div>
    </RoomKitProvider>
  );
}

export default ConferenceViewMobile;
