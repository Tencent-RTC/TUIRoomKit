import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { FillMode, RoomParticipantView, VideoStreamType, useRoomState } from 'tuikit-atomicx-react/room';
import {
  IconChat,
  IconClose,
  IconEduSwap,
  TUISwitch,
  TUIToast,
  clampBox,
  useDrag,
  IconFullscreen,
  IconLeave,
  IconShare,
  RoomKitProvider,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUILoading,
  TUIPopover,
  TUITooltip,
  useFullscreen,
  useI18n,
  useUIConfig,
} from '../../base';
import type { RoomKitProviderExpose } from '../../base';
import type { ElementRef } from '../../base/headless/types';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';
import {
  AnnotationButton,
  CameraButton,
  CurrentEduRoomInfoPC,
  LocalNetworkInfoPC,
  MicButton,
  ParticipantButtonPC,
  EduRoster,
  RoomChatPC,
  SettingButtonPC,
  SettingsDialogPC,
  Trophy,
  WhiteboardView,
} from '../../features';
import type { SettingsTab } from '../../features';
import ToolbarButtonPC from '../../layouts/ToolbarButtonPC/ToolbarButtonPC';
import { EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST } from './virtualBackgroundImgList';
import EduStageEmptyArt from './EduStageEmptyArt';
import EduLeaveCard from './EduLeaveCard';
import { useAutoPlayDialog } from './hooks/useAutoPlayDialog';
import { EDU_CLASS_EVENT_ID, useMemberNoticeSender, useSilenceAll } from '../../features/Chat/customMessage';
import { useRoomExit } from './hooks/useRoomExit';
import { useRoomTips } from './hooks/useRoomTips';
import { useClassroomBoard } from './hooks/useClassroomBoard';
import ParticipantTileEduPC from './ParticipantTileEduPC';
import { ClassMode, useClassroom } from './classroomData';
import ChatContextSync from '../../features/Chat/ChatButton/ChatContextSync';
import { useParticipantPermission } from '../../features/Participants/participantData';
import { useClassroomActions } from './classroomActions';
import './EducationViewPC.scss';

export interface EducationViewPCProps {
  /** Accepted so every scene view shares one signature; the topbar reads the room record. */
  roomName?: string;
  onLeave?: () => void;
}

const LOADING_KEYS: Partial<Record<RoomEntryPhase, string>> = {
  login: 'RoomEntry.LoggingIn',
  profile: 'Education.Entry.Preparing',
  joining: 'Education.Entry.Joining',
};

export function EducationViewPC(props: EducationViewPCProps) {
  const { onLeave } = props;
  const { t } = useI18n();
  const { uiConfig } = useUIConfig();

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

  /** The teacher's card ends the class or steps out; the student's card leaves or stays. */
  const leaveCard = canEndRoom
    ? {
      title: t('Education.Leave.TeacherTitle'),
      body: t('Education.Leave.TeacherBody'),
      secondary: t('Education.Leave.StepOut'),
      confirm: t('Education.Leave.TeacherConfirm'),
    }
    : {
      title: t('Education.Leave.StudentTitle'),
      body: t('Education.Leave.StudentBody'),
      secondary: t('Education.Leave.StudentCancel'),
      confirm: t('Education.Leave.StudentConfirm'),
    };

  async function exit(action: 'leave' | 'end') {
    setLeaveMenuOpen(false);
    await (action === 'end' ? endRoom() : leaveRoom());
    onLeave?.();
  }

  /** The teacher steps out of a class that keeps running; the student just closes the card. */
  function onLeaveSecondary() {
    if (canEndRoom) {
      void exit('leave');
      return;
    }
    setLeaveMenuOpen(false);
  }

  const { isTeacher, teacher, sharer, stage, teacherTile, studentTiles, classMode } = useClassroom();
  const isSmall = classMode === ClassMode.Small;
  const { swap } = useClassroomActions();
  const boardOnStage = isSmall || stage.main === 'board';
  const { currentRoom } = useRoomState();
  const roomId = currentRoom?.roomId || '';
  const { isHostOrAdmin: canModerate } = useParticipantPermission();
  const { silenceAll, toggleSilenceAll } = useSilenceAll();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const chatUnreadCountLabel = chatUnread > 99 ? '99+' : String(chatUnread);
  const chatUnreadLabel = !chatOpen && chatUnread > 0 ? chatUnreadCountLabel : '';
  const [chatBox, setChatBox] = useState({ x: 0, y: 0, w: 320, h: 480 });
  const chatBoxRef = useRef(chatBox);
  chatBoxRef.current = chatBox;
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const chatOriginRef = useRef(chatBox);
  const chatResizeDirRef = useRef('');
  const chatResizeDirs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  function containChatBox(box: typeof chatBox) {
    const w = Math.min(Math.max(box.w, 280), window.innerWidth);
    const h = Math.min(Math.max(box.h, 280), window.innerHeight);
    return { ...clampBox(box.x, box.y, w, h, { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }), w, h };
  }

  useEffect(() => {
    setChatOpen(false);
    setChatUnread(0);
    if (!isSmall) return undefined;
    const w = Math.min(320, window.innerWidth - 24);
    const h = Math.min(window.innerHeight * 0.68, 560);
    setChatBox({ w, h, x: Math.max(0, window.innerWidth - w - 10), y: Math.max(0, window.innerHeight - h - 66) });
    const fitChat = () => setChatBox(box => containChatBox(box));
    window.addEventListener('resize', fitChat);
    return () => window.removeEventListener('resize', fitChat);
  }, [isSmall, roomId]);

  const chatDragTarget = useMemo(() => ({ get current() {
    return chatPanelRef.current;
  } }), [phase]);
  const { isDragging: chatDragging } = useDrag(chatDragTarget, {
    handle: (event) => {
      const target = event.target as HTMLElement;
      chatResizeDirRef.current = target.closest('[data-dir]')?.getAttribute('data-dir') || '';
      return !!chatResizeDirRef.current || (!!target.closest('.education-float-chat-bar') && !target.closest('button, label'));
    },
    onStart: () => {
      chatOriginRef.current = { ...chatBoxRef.current };
    },
    onDrag: ({ dx, dy }) => {
      const origin = chatOriginRef.current;
      const dir = chatResizeDirRef.current;
      if (!dir) {
        setChatBox(containChatBox({ ...origin, x: origin.x + dx, y: origin.y + dy }));
        return;
      }
      const right = origin.x + origin.w;
      const bottom = origin.y + origin.h;
      let { w, h } = origin;
      if (dir.includes('e') || dir.includes('w')) w += dir.includes('w') ? -dx : dx;
      if (dir.includes('s') || dir.includes('n')) h += dir.includes('n') ? -dy : dy;
      w = Math.min(Math.max(w, Math.min(280, window.innerWidth)), dir.includes('w') ? right : window.innerWidth - origin.x);
      h = Math.min(Math.max(h, Math.min(280, window.innerHeight)), dir.includes('n') ? bottom : window.innerHeight - origin.y);
      setChatBox(containChatBox({ x: dir.includes('w') ? right - w : origin.x, y: dir.includes('n') ? bottom - h : origin.y, w, h }));
    },
  });

  async function onToggleSilenceAll() {
    await toggleSilenceAll();
    TUIToast.success(t(silenceAll ? 'Education.Settings.ChatOnSelf' : 'Education.Settings.ChatOffSelf'));
  }
  const {
    failed: boardFailed,
    isScreenSharing,
    shareButton,
    retry: retryBoard,
    toggleScreenShare,
  } = useClassroomBoard(boardOnStage, rootRef);
  const { fullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);

  // Classroom events ride the chat group; wire them at view level.
  useMemberNoticeSender(EDU_CLASS_EVENT_ID);
  const teacherId = teacher?.userId || '';

  function isTeacherMessage(message: { from?: { userID?: string } }) {
    return Boolean(message.from?.userID) && message.from?.userID === teacherId;
  }

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('audio');
  const [rosterOpen, setRosterOpen] = useState(false);

  function openSettings(tab: SettingsTab = 'audio') {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  const swapLabel = t(boardOnStage ? 'Education.SwapBoard' : 'Education.SwapMain');

  return (
    <RoomKitProvider ref={hostRef} className="education-root" scene="education">
      <div className="education-view">
        {phase === 'idle' && (
          <>
            <header className="education-topbar">
              <div className="education-topbar-left">
                <CurrentEduRoomInfoPC />
                <LocalNetworkInfoPC />
              </div>

              <div className="education-topbar-right">
                <div className="education-topbar-group">
                  {uiConfig.widgetVisible.MicWidget !== false && <MicButton iconSize={16} caretDirection="down" />}
                  {uiConfig.widgetVisible.CameraWidget !== false && <CameraButton caretDirection="down" onOpenSetting={openSettings} />}
                  {isTeacher && uiConfig.widgetVisible.ScreenShareWidget !== false && (
                    <ToolbarButtonPC
                      label={shareButton.label}
                      icon={IconShare}
                      active={shareButton.active}
                      loading={shareButton.loading}
                      notice={shareButton.notice}
                      onClick={toggleScreenShare}
                    />
                  )}
                </div>
                <span className="education-topbar-divider" />
                <div className="education-topbar-group">
                  {uiConfig.widgetVisible.MemberWidget !== false && (
                    <ParticipantButtonPC
                      label={t('Education.Roster.Title')}
                      active={rosterOpen}
                      onClick={() => setRosterOpen(!rosterOpen)}
                    />
                  )}
                  {uiConfig.widgetVisible.SettingsWidget !== false && <SettingButtonPC active={settingsOpen} onClick={() => openSettings()} />}
                </div>
                <span className="education-topbar-divider" />
                <div className="education-topbar-group">
                  <ToolbarButtonPC
                    label={fullscreen ? t('Room.ExitFullscreen') : t('Room.Fullscreen')}
                    icon={IconFullscreen}
                    onClick={toggleFullscreen}
                  />
                  {/* Offset 8 drops the card onto the topbar's bottom edge (28px trigger in a 44px bar). */}
                  {uiConfig.widgetVisible.LeaveRoomWidget !== false && (
                    <TUIPopover
                      open={leaveMenuOpen}
                      placement="bottom-end"
                      offset={8}
                      padded={false}
                      onUpdateOpen={setLeaveMenuOpen}
                      contentSlot={(
                        <EduLeaveCard
                          title={leaveCard.title}
                          body={leaveCard.body}
                          secondaryText={leaveCard.secondary}
                          confirmText={leaveCard.confirm}
                          onSecondary={onLeaveSecondary}
                          onConfirm={() => exit(canEndRoom ? 'end' : 'leave')}
                        />
                      )}
                    >
                      <TUITooltip content={t('Education.Leave')} disabled={leaveMenuOpen} placement="bottom">
                        <button
                          className="education-leave"
                          type="button"
                          aria-label={t('Education.Leave')}
                          aria-haspopup="dialog"
                          aria-expanded={leaveMenuOpen}
                        >
                          <IconLeave size={16} />
                        </button>
                      </TUITooltip>
                    </TUIPopover>
                  )}
                </div>
              </div>
            </header>

            {/* The swap only moves the board and the teacher between grid areas, so neither
                the video element nor the board canvas is rebuilt. */}
            <main className={['education-workspace', isSmall ? 'is-small' : ''].join(' ')}>
              {isSmall && (
                <section className="education-stage-strip">
                  <div className="education-stage-strip-track">
                    <ParticipantTileEduPC tile={teacherTile} tileRole="thumb" inStrip />
                    {studentTiles.map(tile => <ParticipantTileEduPC key={tile.participant?.userId} tile={tile} tileRole="thumb" inStrip trophyLanding={tile.participant?.userId} />)}
                  </div>
                </section>
              )}
              <section className={['education-slot', boardOnStage ? 'is-main' : 'is-side'].join(' ')}>
                <div className="education-board" data-tile-role={boardOnStage ? 'stage' : 'thumb'}>
                  {sharer && (
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
                      {isScreenSharing && (
                        <span className="education-board-live">
                          <IconShare size={14} />
                          <span className="education-board-live-text">{t('RoomView.SharingScreen')}</span>
                        </span>
                      )}
                      {isTeacher && boardOnStage && uiConfig.widgetVisible.AnnotationWidget !== false && (
                        <div className="education-board-actions">
                          <AnnotationButton participant={sharer} streamType={VideoStreamType.Screen} />
                        </div>
                      )}
                    </>
                  )}
                  {!sharer && boardFailed && (
                    <div className="education-board-empty">
                      <span>{t('Education.BoardFailed')}</span>
                      <TUIButton size="sm" onClick={retryBoard}>
                        {t('Education.RetryBoard')}
                      </TUIButton>
                    </div>
                  )}
                  {!sharer && !boardFailed && (
                    <div className="education-board-empty">
                      <EduStageEmptyArt />
                      <span className="education-board-empty-text">{t('Education.StageEmpty')}</span>
                    </div>
                  )}
                </div>
              </section>

              {!isSmall && (
                <section className={['education-slot', boardOnStage ? 'is-side' : 'is-main'].join(' ')}>
                  <ParticipantTileEduPC tile={teacherTile} tileRole={boardOnStage ? 'thumb' : 'stage'} />
                </section>
              )}

              {!isSmall && stage.canSwap && (
                <button
                  className="education-swap"
                  type="button"
                  title={swapLabel}
                  aria-label={swapLabel}
                  onClick={() => swap()}
                >
                  <IconEduSwap size={14} />
                </button>
              )}

              {!isSmall && studentTiles[0] && (
                <section className="education-slot is-student" data-trophy-landing={studentTiles[0].participant?.userId || ''}>
                  <ParticipantTileEduPC tile={studentTiles[0]} tileRole="thumb" />
                </section>
              )}

              {!isSmall && uiConfig.widgetVisible.RoomChatWidget !== false && (
                <section className="education-chat">
                  <RoomChatPC
                    className="education-chat-body"
                    isHideOperator
                    isHideTimestamp
                    isHighlightOwner
                    isShowMemberNotice
                    isShowNewMessages
                    placeholder={t('Education.Chat.PlaceholderOnetoone')}
                    headerSlot={(
                      <header className="education-chat-head">
                        <strong className="education-chat-title">{t('Education.ChatTitle')}</strong>
                      </header>
                    )}
                    metaSlot={({ message }) => (isTeacherMessage(message)
                      ? <span className="education-chat-teacher-tag">{t('Education.Teacher')}</span>
                      : null)}
                  />
                </section>
              )}
            </main>

            {isSmall && uiConfig.widgetVisible.RoomChatWidget !== false && (
              <>
                <button className={['education-float-chat-fab', chatOpen ? 'is-open' : ''].join(' ')} type="button" aria-expanded={chatOpen} aria-label={t('Education.ChatTitle')} onClick={() => setChatOpen(!chatOpen)}>
                  <IconChat size={18} />
                  {chatUnreadLabel && <em className="education-float-chat-badge">{chatUnreadLabel}</em>}
                </button>
                {roomId && <ChatContextSync channel={roomId} isActive={chatOpen} isShowMemberNotice onUnreadChange={setChatUnread} />}
              </>
            )}
            <div ref={chatPanelRef} className={['education-float-chat', chatDragging ? 'is-dragging' : ''].join(' ')} style={{ display: isSmall && chatOpen && phase === 'idle' && uiConfig.widgetVisible.RoomChatWidget !== false ? undefined : 'none', left: chatBox.x, top: chatBox.y, width: chatBox.w, height: chatBox.h }}>
              {chatResizeDirs.map(dir => <div key={dir} className="education-float-chat-resize" data-dir={dir} />)}
              <header className="education-float-chat-bar">
                <div className="education-float-chat-bar-lead"><strong className="education-float-chat-bar-title">{t('Education.ChatTitle')}</strong></div>
                {canModerate && (
                  <label className="education-float-chat-bar-silence">
                    <span>{t('Education.Chat.SilenceAll')}</span>
                    <TUISwitch size="sm" modelValue={silenceAll} onChange={onToggleSilenceAll} />
                  </label>
                )}
                <button className="education-float-chat-close" type="button" aria-label={t('Education.Chat.Close')} onClick={() => setChatOpen(false)}><IconClose size={12} /></button>
              </header>
              {isSmall && <RoomChatPC className="education-float-chat-body" isActive={chatOpen} isHideOperator isHideTimestamp isHighlightOwner isShowMemberNotice isShowNotice canEditNotice={canModerate} isShowNewMessages placeholder={t('Education.Chat.Placeholder')} metaSlot={({ message }) => isTeacherMessage(message) ? <span className="education-chat-teacher-tag">{t('Education.Teacher')}</span> : null} />}
            </div>

            <SettingsDialogPC
              open={settingsOpen}
              activeTab={settingsTab}
              hiddenItems={isTeacher ? ['theme'] : ['theme', 'share']}
              virtualBackgroundImgList={EDUCATION_VIRTUAL_BACKGROUND_IMG_LIST}
              onSelect={setSettingsTab}
              onClose={() => setSettingsOpen(false)}
            />
            <EduRoster open={rosterOpen} onUpdateOpen={setRosterOpen} showMuteAll={isSmall} />
            {/* Scene-wide: the celebration plays even while the roster is closed. */}
            <Trophy />
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
