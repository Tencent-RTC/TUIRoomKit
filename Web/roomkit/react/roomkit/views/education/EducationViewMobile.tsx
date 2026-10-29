import { useEffect, useState, useSyncExternalStore } from 'react';
import { FillMode, RoomParticipantView, VideoStreamType } from 'tuikit-atomicx-react/room';
import {
  IconChevronRightMobile,
  RoomKitProvider,
  TUIDialog,
  TUIInput,
  TUILoading,
} from '../../base';
import { useI18n } from '../../i18n';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  CameraButtonMobile,
  CurrentRoomInfoMobile,
  LocalNetworkInfoMobile,
  MicButtonMobile,
  RoomChatMobile,
} from '../../features';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import ParticipantTile from './components/ParticipantTile';
import { useClassSeats } from './hooks/useClassSeats';
import './EducationViewMobile.scss';

export interface EducationViewMobileProps {
  roomName?: string;
  onLeave?: () => void;
}

const LOADING_KEYS: Partial<Record<RoomEntryPhase, string>> = {
  login: 'RoomEntry.LoggingIn',
  profile: 'RoomEntry.Preparing',
  joining: 'RoomEntry.Joining',
};

export function EducationViewMobile(props: EducationViewMobileProps) {
  const { roomName = '', onLeave } = props;
  const { t } = useI18n();

  const { phase } = useSyncExternalStore(roomEntry.subscribe, roomEntry.getSnapshot, roomEntry.getSnapshot);
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

  // H5 is student-only in this phase, so leaving is the only exit.
  const { leaveRoom } = useRoomExit();

  async function exit() {
    await leaveRoom();
    onLeave?.();
  }

  const { teacher, student, sharer } = useClassSeats();

  return (
    <RoomKitProvider className="education-mobile-root" scene="education">
      <div className="education-mobile">
        {phase === 'idle' && (
          <>
            <header className="education-mobile-topbar">
              <div className="education-mobile-topbar-left">
                <button
                  className="education-mobile-back"
                  type="button"
                  aria-label={t('Education.Leave')}
                  onClick={() => {
                    void exit();
                  }}
                >
                  <IconChevronRightMobile size={20} />
                </button>
                <CurrentRoomInfoMobile roomName={roomName} />
                <LocalNetworkInfoMobile />
              </div>
              <div className="education-mobile-topbar-right">
                <MicButtonMobile />
                <CameraButtonMobile />
              </div>
            </header>

            <main className="education-mobile-body">
              <section className="education-mobile-seats">
                <ParticipantTile compact participant={teacher} placeholder={t('Education.WaitingTeacher')} />
                <ParticipantTile compact participant={student} placeholder={t('Education.WaitingStudent')} />
              </section>

              <section className="education-mobile-stage">
                <div className="education-mobile-board" data-tile-role="stage">
                  {sharer
                    ? (
                      <div className="education-mobile-board-stream">
                        <RoomParticipantView
                          participant={sharer}
                          streamType={VideoStreamType.Screen}
                          fillMode={FillMode.Fit}
                          lazyLoad={{ enable: false }}
                        />
                      </div>
                    )
                    : (
                      <p className="education-mobile-board-empty">
                        {t('Education.StageEmpty')}
                      </p>
                    )}
                </div>
              </section>

              <section className="education-mobile-chat">
                <RoomChatMobile className="education-mobile-chat-body" />
              </section>
            </main>
          </>
        )}

        {loadingKey && (
          <div className="education-mobile-join-loading">
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
            <p className="education-mobile-join-error">
              {t(passwordErrorKey)}
            </p>
          )}
        </TUIDialog>
      </div>
    </RoomKitProvider>
  );
}

export default EducationViewMobile;
