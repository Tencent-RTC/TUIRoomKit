import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { FillMode, RoomParticipantView, VideoStreamType, useRoomState } from 'tuikit-atomicx-react/room';
import {
  IconChevronRightMobile,
  RoomKitProvider,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  useI18n,
  useKeyboardAvoidance,
  useOrientation,
  useUIConfig,
} from '../../base';
import type { RoomKitProviderExpose } from '../../base';
import type { ElementRef } from '../../base/headless/types';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  CameraButtonMobile,
  ChatOverlayMobile,
  CurrentEduRoomInfoMobile,
  LocalNetworkInfoMobile,
  MicButtonMobile,
  RoomChatMobile,
  Trophy,
  WhiteboardToolsMobile,
  WhiteboardView,
} from '../../features';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import { useClassroomBoard } from './hooks/useClassroomBoard';
import { ClassMode, padStudentSeats, useClassroom } from './classroomData';
import { useParticipantPermission } from '../../features/Participants/participantData';
import { EDU_CLASS_EVENT_ID, useMemberNoticeSender } from '../../features/Chat/customMessage';
import EduStageEmptyArt from './EduStageEmptyArt';
import EduLeaveCard from './EduLeaveCard';
import ParticipantTileEduMobile from './ParticipantTileEduMobile';
import './EducationViewMobile.scss';

export interface EducationViewMobileProps {
  roomName?: string;
  /** Scheduled class length, in minutes. Reserved for API parity with the Vue kit;
      the mobile topbar no longer renders a separate class-length label. */
  durationMinutes?: number;
  onLeave?: () => void;
}

const LOADING_KEYS: Partial<Record<RoomEntryPhase, string>> = {
  login: 'RoomEntry.LoggingIn',
  profile: 'Education.Entry.Preparing',
  joining: 'Education.Entry.Joining',
};

/* Chrome on iOS carries the CriOS token (all iOS browsers are WebKit shells).
   In landscape the browser already keeps the page inside the notch gutters,
   so the env() side insets it reports would double with our own padding; the
   landscape CSS drops them for this token. */
const isIOSChrome = /CriOS/.test(navigator.userAgent) && (
  /iPad|iPhone|iPod/.test(navigator.userAgent)
  // iPadOS 13+ desktop-mode UA; the education mobile view can run there too.
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

export function EducationViewMobile(props: EducationViewMobileProps) {
  const { roomName = '', onLeave } = props;
  const { t } = useI18n();
  const { uiConfig } = useUIConfig();

  const { phase } = useSyncExternalStore(roomEntry.subscribe, roomEntry.getSnapshot, roomEntry.getSnapshot);
  // Mounted before the join runs, so tips catch events a late joiner receives.
  useRoomTips({ onLeave: () => onLeave?.() });
  useAutoPlayDialog();
  useMemberNoticeSender(EDU_CLASS_EVENT_ID);

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

  // H5 is student-only in this phase, so leaving is the only exit and the card
  // always carries the student copy.
  const { leaveRoom } = useRoomExit();
  const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);

  async function exit() {
    setLeaveMenuOpen(false);
    await leaveRoom();
    onLeave?.();
  }

  const hostRef = useRef<RoomKitProviderExpose | null>(null);
  const rootRef = useMemo<ElementRef>(() => ({
    get current() {
      return hostRef.current?.context.root ?? null;
    },
  }), []);
  const { orientation } = useOrientation(rootRef);

  /* Freeze the box while typing (the board keeps its slot, the keyboard may
     cover its bottom) and publish the keyboard top as --rk-keyboard-offset;
     the scene slides on that variable in the stylesheet. The freeze also
     normalizes WebKit builds that resize the layout with the keyboard. Scoped
     to portrait: the barrage composer owns landscape typing, and the offset
     math itself is platform-agnostic (Android Chrome overlays the keyboard
     by default and honors interactive-widget in the demo viewport). */
  useKeyboardAvoidance(rootRef, { enabled: () => orientation === 'portrait' });

  const { currentRoom } = useRoomState();
  const chatChannel = currentRoom?.roomId || '';
  const { isHostOrAdmin: canModerate } = useParticipantPermission();

  // The class-wide swap rides the teacher's metaData; the board and the teacher trade seats.
  const { sharer, teacher, teacherTile, studentTiles, stage, classMode, isTeacher, selfBoardAuthorized } = useClassroom();
  const isSmall = classMode === ClassMode.Small;
  const railStudentTiles = isSmall && orientation === 'portrait' ? padStudentSeats(studentTiles) : studentTiles;
  const boardOnStage = isSmall || stage.main === 'board';
  const teacherId = teacher?.userId || '';

  function isTeacherMessage(message: { from?: { userID?: string } }) {
    return Boolean(message.from?.userID) && message.from?.userID === teacherId;
  }
  // The classroom dock replaces the plugin bar on H5, so the session starts without it.
  useClassroomBoard(boardOnStage, rootRef, false);

  return (
    <RoomKitProvider ref={hostRef} className="education-mobile-root" scene="education">
      <div
        className="education-mobile"
        data-orient={orientation}
        data-mode={classMode}
        data-browser={isIOSChrome ? 'ios-chrome' : undefined}
      >
        {phase === 'idle' && (
          <>
            <header className="education-mobile-topbar">
              <div className="education-mobile-topbar-left">
                {/* Leaving needs a confirm card; the popover anchors it under the topbar. */}
                {uiConfig.widgetVisible.LeaveRoomWidget !== false && (
                  <TUIPopover
                    open={leaveMenuOpen}
                    placement="bottom-start"
                    offset={8}
                    padded={false}
                    onUpdateOpen={setLeaveMenuOpen}
                    contentSlot={(
                      <EduLeaveCard
                        title={t('Education.Leave.StudentTitle')}
                        body={t('Education.Leave.StudentBody')}
                        secondaryText={t('Education.Leave.StudentCancel')}
                        confirmText={t('Education.Leave.StudentConfirm')}
                        onSecondary={() => setLeaveMenuOpen(false)}
                        onConfirm={exit}
                      />
                    )}
                  >
                    <button
                      className="education-mobile-back"
                      type="button"
                      aria-label={t('Education.Leave')}
                      aria-haspopup="dialog"
                      aria-expanded={leaveMenuOpen}
                    >
                      <IconChevronRightMobile size={20} />
                    </button>
                  </TUIPopover>
                )}
                <CurrentEduRoomInfoMobile roomName={roomName} orientation={orientation} />
                <LocalNetworkInfoMobile orientation={orientation} />
              </div>
              <div className="education-mobile-topbar-right">
                {uiConfig.widgetVisible.MicWidget !== false && <MicButtonMobile size={18} />}
                {uiConfig.widgetVisible.CameraWidget !== false && <CameraButtonMobile />}
              </div>
            </header>

            <main className="education-mobile-body">
              {/* The swap only moves the board and the teacher between grid areas, so neither
                  the video element nor the board canvas is rebuilt. */}
              <div
                className={['education-mobile-board', boardOnStage ? 'is-main' : 'is-side'].join(' ')}
                data-tile-role={boardOnStage ? 'stage' : 'thumb'}
              >
                <div className="education-mobile-board-frame">
                  {sharer
                    ? (
                      <>
                        <div className="education-mobile-board-stream">
                          <RoomParticipantView
                            participant={sharer}
                            streamType={VideoStreamType.Screen}
                            fillMode={FillMode.Fit}
                            lazyLoad={{ enable: false }}
                          />
                        </div>
                        <WhiteboardView participant={sharer} streamType={VideoStreamType.Screen} />
                        {/* Read-only in the side seat, so the dock only rides the stage board. */}
                        {boardOnStage && (isTeacher || selfBoardAuthorized) && uiConfig.widgetVisible.AnnotationWidget !== false && <WhiteboardToolsMobile />}
                      </>
                    )
                    : (
                      <div className="education-mobile-board-empty">
                        <EduStageEmptyArt />
                        <span className="education-mobile-board-empty-text">{t('Education.StageEmpty')}</span>
                      </div>
                    )}
                </div>
              </div>

              {chatChannel && uiConfig.widgetVisible.RoomChatWidget !== false && (
                <div className="education-mobile-barrage">
                  <ChatOverlayMobile
                    key={chatChannel}
                    channel={chatChannel}
                    collapsible
                    placeholderKey={isSmall ? 'Education.Chat.Placeholder' : 'Education.Chat.PlaceholderOnetoone'}
                  />
                </div>
              )}

              {isSmall
                ? (
                  <div className="education-mobile-rail">
                    <ParticipantTileEduMobile tile={teacherTile} tileRole="thumb" />
                    {railStudentTiles.map((tile, index) => (
                      <ParticipantTileEduMobile key={tile.participant?.userId ?? `empty-${index}`} tile={tile} tileRole="thumb" trophyLanding={tile.participant?.userId} />
                    ))}
                  </div>
                )
                : (
                  <ParticipantTileEduMobile
                    className={boardOnStage ? 'is-side' : 'is-main'}
                    tile={teacherTile}
                    tileRole={boardOnStage ? 'thumb' : 'stage'}
                  />
                )}
              {!isSmall && studentTiles[0] && (
                <ParticipantTileEduMobile
                  className="education-mobile-seat-student"
                  tile={studentTiles[0]}
                  tileRole="thumb"
                  trophyLanding={studentTiles[0].participant?.userId || ''}
                />
              )}

              {uiConfig.widgetVisible.RoomChatWidget !== false && (
                <section className="education-mobile-chat">
                  <RoomChatMobile
                    className="education-mobile-chat-body"
                    isActive
                    isHideTimestamp
                    isShowMemberNotice
                    isShowNewMessages
                    isShowNotice={isSmall && orientation === 'portrait'}
                    canEditNotice={canModerate}
                    placeholder={t('Education.Chat.PlaceholderOnetoone')}
                    metaSlot={({ message }) => (isTeacherMessage(message)
                      ? <span className="education-mobile-teacher-tag">{t('Education.Teacher')}</span>
                      : null)}
                  />
                </section>
              )}
            </main>
            {/* Scene-wide: the celebration plays from the same trophy count the roster shows. */}
            <Trophy />
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
