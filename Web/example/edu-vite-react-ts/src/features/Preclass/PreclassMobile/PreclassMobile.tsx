import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useLoginState } from 'tuikit-atomicx-react/room';
import { IconCheck, IconChevronRightMobile, IconCopy, IconCourseEmpty, IconMonitor, RoomKitProvider, TUIAvatar, TUIDialog, TUILoading, TUIToast, useI18n } from '@tencentcloud/roomkit-web-react';
import type { PickedContact } from '@tencentcloud/roomkit-web-react';
import ResumeBanner from '../ResumeBanner';
import { CLASS_MODES } from '../classMode';
import type { ClassCourse, PreclassProps } from '../types';
import { useResumeRoom } from '../useResumeRoom';
import PreclassPreviewMobile from './PreclassPreviewMobile';
import { copyText, inviteText, useCopyFeedback } from '../PreclassPC/schedule/courseCopy';
import { browserTimezoneLabel, durationLabel, formatClock, formatDayLabel, toDateKey } from '../PreclassPC/schedule/scheduleTime';
import { classLink, useClassSchedule } from '../PreclassPC/schedule/useClassSchedule';
import './PreclassMobile.scss';

type Screen = 'home' | 'detail' | 'members';
const mark = (name: string) => name.trim().slice(0, 1);

export default function PreclassMobile({ className, onJoin, onLogout }: PreclassProps) {
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const userName = loginUserInfo?.userName || loginUserInfo?.userId || '';
  const avatarUrl = loginUserInfo?.avatarUrl || '';
  const { courses, isLoaded, fetchAttendees } = useClassSchedule();
  const { copied, copy, reset } = useCopyFeedback();
  const { resumeRoomId, dismissResume } = useResumeRoom();
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedCourse, setSelectedCourse] = useState<ClassCourse>();
  const selected = courses.find(course => course.roomId === selectedCourse?.roomId) ?? selectedCourse;
  const [attendeeCache, setAttendeeCache] = useState<Record<string, PickedContact[]>>({});
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [isAccountDragging, setAccountDragging] = useState(false);
  const [accountOffset, setAccountOffset] = useState(0);
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const accountDragCleanup = useRef<() => void>();
  const attendees = selected ? attendeeCache[selected.roomId] : undefined;
  const faceAttendees = (attendees ?? []).slice(0, 3);
  const shareLink = selected ? classLink() : '';
  const groups = new Map<string, { key: string;
    label: string;
    courses: ClassCourse[]; }>();
  courses.forEach((course) => {
    const date = new Date(course.start * 1000);
    const key = toDateKey(date);
    const bucket = groups.get(key) ?? { key, label: formatDayLabel(date), courses: [] };
    bucket.courses.push(course);
    groups.set(key, bucket);
  });

  useEffect(() => {
    if (screen === 'home') {
      reset();
      setAccountOpen(false);
    }
  }, [screen, reset]);
  useEffect(() => () => accountDragCleanup.current?.(), []);

  async function loadAttendees(roomId: string) {
    if (!roomId || attendeeCache[roomId]) return;
    try {
      const members = await fetchAttendees(roomId);
      setAttendeeCache(current => ({ ...current, [roomId]: members }));
    } catch (error) {
      console.error('[PreclassMobile] Failed to load class members:', error);
    }
  }
  function openDetail(course: ClassCourse) {
    setSelectedCourse(course);
    setAccountOpen(false);
    loadAttendees(course.roomId).catch(() => {});
    setScreen('detail');
  }
  async function copyInvite() {
    if (!selected) return;
    const names = (attendees ?? []).map(user => user.userName).filter(Boolean).join(t('Schedule.NameSep'));
    const text = [inviteText(selected, shareLink), names ? `${t('Preclass.Members')}${t('LabelSep')}${names}` : ''].filter(Boolean).join('\n');
    try {
      await copyText(text);
      TUIToast.success(t('Preclass.Copied'));
    } catch {
      TUIToast.error(t('Preclass.CopyFailed'));
    }
  }
  function handleAccountDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isAccountOpen || event.button !== 0) return;
    const sheet = event.currentTarget.parentElement;
    if (!sheet) return;
    accountDragCleanup.current?.();
    sheet.setPointerCapture(event.pointerId);
    const startY = event.clientY;
    let lastY = startY;
    let lastTime = performance.now();
    let velocity = 0;
    let isDragging = false;
    let offset = 0;
    function move(next: PointerEvent) {
      const now = performance.now();
      velocity = (next.clientY - lastY) / (now - lastTime || 16);
      lastY = next.clientY;
      lastTime = now;
      const raw = next.clientY - startY;
      if (!isDragging) {
        if (raw < 8) return;
        isDragging = true;
        setAccountDragging(true);
      }
      offset = Math.max(0, raw);
      setAccountOffset(offset);
    }
    function cleanup() {
      sheet?.removeEventListener('pointermove', move);
      sheet?.removeEventListener('pointerup', end);
      sheet?.removeEventListener('pointercancel', end);
    }
    function end() {
      cleanup();
      setAccountDragging(false);
      setAccountOffset(0);
      if (isDragging && (offset > 48 || velocity > 0.55)) setAccountOpen(false);
    }
    accountDragCleanup.current = cleanup;
    sheet.addEventListener('pointermove', move);
    sheet.addEventListener('pointerup', end);
    sheet.addEventListener('pointercancel', end);
  }

  return (
    <RoomKitProvider className={['preclass-mobile-root', className].filter(Boolean).join(' ')} scene="education">
      <div className="preclass-mobile">
        <div className="preclass-mobile-main">
          <header className="preclass-mobile-bar">
            <div className="preclass-mobile-brand">
              <span className="preclass-mobile-mark" aria-hidden="true"><IconMonitor size={15} /></span>
              <span className="preclass-mobile-brand-name">
                RoomKit
                <em>· EDU</em>
              </span>
            </div>
            <span className="preclass-mobile-role">{t('Preclass.RoleStudent')}</span>
            <button className="preclass-mobile-user" type="button" aria-haspopup="dialog" aria-expanded={isAccountOpen} aria-label={userName} onClick={() => setAccountOpen(!isAccountOpen)}><TUIAvatar size={32} src={avatarUrl} alt={userName || t('Preconference.AvatarFallback')} /></button>
          </header>
          {resumeRoomId && <ResumeBanner roomId={resumeRoomId} course={courses.find(course => course.roomId === resumeRoomId)} onBack={() => onJoin(resumeRoomId)} onDismiss={dismissResume} />}
          <div className="preclass-mobile-body">
            <section className="preclass-mobile-ready">
              <h1 className="preclass-mobile-ready-title">{t('Preclass.ReadyTitle')}</h1>
              <PreclassPreviewMobile />
            </section>
            <section className="preclass-mobile-list">
              <div className="preclass-mobile-cards">
                {!groups.size && (
                  <div className="preclass-mobile-empty" role={!isLoaded ? 'status' : undefined}>
                    {!isLoaded
                      ? <TUILoading size="lg" />
                      : (
                        <>
                          <IconCourseEmpty className="preclass-mobile-empty-art" />
                          <span>{t('Preclass.ListEmpty')}</span>
                        </>
                      )}
                  </div>
                )}
                {[...groups.values()].map(group => (
                  <div key={group.key} className="preclass-mobile-group">
                    <p className="preclass-mobile-day">{group.label}</p>
                    {group.courses.map(course => (
                      <div
                        key={course.roomId}
                        className={`preclass-mobile-card ${course.status === 'live' ? 'is-live' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => openDetail(course)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && event.target === event.currentTarget) {
                            event.preventDefault();
                            openDetail(course);
                          }
                        }}
                      >
                        <span className="preclass-mobile-when">
                          <em className={`preclass-mobile-mode is-${course.classMode === 'oneOnOne' ? 'one-on-one' : course.classMode}`}>{t(CLASS_MODES[course.classMode].label)}</em>
                          <b>{formatClock(course.start)}</b>
                          <em>{formatClock(course.end)}</em>
                        </span>
                        <span className="preclass-mobile-info">
                          <span className="preclass-mobile-title">
                            <strong>{course.title}</strong>
                            <em className="preclass-mobile-status">{t(course.status === 'live' ? 'Preclass.StatusLive' : 'Preclass.StatusIdle')}</em>
                          </span>
                          <span className="preclass-mobile-meta">
                            <span className="preclass-mobile-meta-text">
                              {durationLabel(Math.round((course.end - course.start) / 60))}
                              {' '}
                              ·
                              {' '}
                              {t('Preclass.RoomId')}
                              {' '}
                              {course.roomId}
                            </span>
                            <button
                              className="preclass-mobile-copy-id"
                              type="button"
                              aria-label={t('Preclass.CopyRoomId')}
                              onClick={(event) => {
                                event.stopPropagation();
                                copy(`room:${course.roomId}`, course.roomId).catch(() => {});
                              }}
                            >
                              {copied === `room:${course.roomId}` ? <IconCheck size={12} /> : <IconCopy size={12} />}
                            </button>
                          </span>
                          <span className="preclass-mobile-meta">
                            <i className="preclass-mobile-face">{mark(course.teacherName)}</i>
                            <span className="preclass-mobile-meta-text">{course.teacherName}</span>
                          </span>
                          <span className="preclass-mobile-actions">
                            <button
                              className="preclass-mobile-action"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                copy(`invite:${course.roomId}`, inviteText(course, classLink())).catch(() => {});
                              }}
                            >
                              {t(copied === `invite:${course.roomId}` ? 'Preclass.Copied' : 'Preclass.CopyInvite')}
                            </button>
                            <button
                              className="preclass-mobile-action is-primary"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onJoin(course.roomId);
                              }}
                            >
                              {t('Preclass.EnterClass')}
                            </button>
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        {selected && (
          <div className="preclass-mobile-detail" data-screen={screen} aria-hidden={screen === 'home'} {...{ inert: screen === 'home' ? '' : undefined }}>
            <section className="preclass-mobile-page" {...{ inert: screen === 'members' ? '' : undefined }}>
              <header className="preclass-mobile-nav">
                <button className="preclass-mobile-back" type="button" aria-label={t('Preclass.Back')} onClick={() => setScreen('home')}><IconChevronRightMobile size={22} /></button>
                <div className="preclass-mobile-nav-title">{t('Preclass.DetailTitle')}</div>
              </header>
              <div className="preclass-mobile-sheet">
                <div className="preclass-mobile-block">
                  <div className="preclass-mobile-line">
                    <span>{t('Preclass.RoomName')}</span>
                    <b>{selected.title}</b>
                  </div>
                  <div className="preclass-mobile-line">
                    <span>{t('Preclass.Teacher')}</span>
                    <b>
                      <i className="preclass-mobile-face">{mark(selected.teacherName)}</i>
                      {selected.teacherName}
                    </b>
                  </div>
                  <div className="preclass-mobile-line">
                    <span>{t('Preclass.StartTime')}</span>
                    <b>
                      {formatDayLabel(new Date(selected.start * 1000))}
                      {' '}
                      {formatClock(selected.start)}
                    </b>
                  </div>
                  <div className="preclass-mobile-line">
                    <span>{t('Preclass.Duration')}</span>
                    <b>{durationLabel(Math.max(1, Math.round((selected.end - selected.start) / 60)))}</b>
                  </div>
                  <div className="preclass-mobile-line">
                    <span>{t('Preclass.Timezone')}</span>
                    <b>{browserTimezoneLabel()}</b>
                  </div>
                  <div className="preclass-mobile-line">
                    <span>{t('Preclass.ClassMode')}</span>
                    <b>{t(CLASS_MODES[selected.classMode].label)}</b>
                  </div>
                  <button className="preclass-mobile-line" type="button" disabled={!attendees?.length} onClick={() => setScreen('members')}>
                    <span>{t('Preclass.Members')}</span>
                    <b>
                      <span className="preclass-mobile-faces">{faceAttendees.map(user => <i key={user.userId}>{mark(user.userName)}</i>)}</span>
                      <span>{attendees ? t('Schedule.AttendeeCount', { count: attendees.length }) : '—'}</span>
                      {!!attendees?.length && <IconChevronRightMobile className="preclass-mobile-chev" size={16} />}
                    </b>
                  </button>
                </div>
                <div className="preclass-mobile-block">
                  {[
                    { key: 'room', label: t('Preclass.RoomId'), value: selected.roomId, copyLabel: t('Preclass.CopyRoomId') },
                    { key: 'link', label: t('Preclass.ShareLink'), value: shareLink, copyLabel: t('Preclass.CopyLink') },
                  ].map(row => (
                    <div key={row.key} className="preclass-mobile-line">
                      <span>{row.label}</span>
                      <b>
                        <span>{row.value}</span>
                        <button
                          className={`preclass-mobile-copy ${copied === row.key ? 'is-copied' : ''}`}
                          type="button"
                          aria-label={row.copyLabel}
                          onClick={() => {
                            copy(row.key, row.value).catch(() => {});
                          }}
                        >
                          {copied === row.key ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </button>
                      </b>
                    </div>
                  ))}
                </div>
              </div>
              <footer className="preclass-mobile-foot">
                <button
                  className="preclass-mobile-go is-secondary"
                  type="button"
                  onClick={() => {
                    copyInvite().catch(() => {});
                  }}
                >
                  {t('Preclass.CopyInvite')}
                </button>
                <button className="preclass-mobile-go" type="button" onClick={() => onJoin(selected.roomId)}>{t('Preclass.EnterClass')}</button>
              </footer>
            </section>
            <section className="preclass-mobile-page" data-page="members" {...{ inert: screen !== 'members' ? '' : undefined }}>
              <header className="preclass-mobile-nav">
                <button className="preclass-mobile-back" type="button" aria-label={t('Preclass.Back')} onClick={() => setScreen('detail')}><IconChevronRightMobile size={22} /></button>
                <div className="preclass-mobile-nav-title">{t('Preclass.Members')}</div>
              </header>
              <div className="preclass-mobile-sheet">
                <div className="preclass-mobile-block">
                  {attendees && !attendees.length && <p className="preclass-mobile-member-empty">{t('Schedule.NoScheduledMembers')}</p>}
                  {attendees?.map(user => (
                    <div key={user.userId} className="preclass-mobile-member">
                      <i>{mark(user.userName)}</i>
                      <span>{user.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
        {screen === 'home' && (
          <>
            <div className={`preclass-mobile-mask ${isAccountOpen ? 'is-open' : ''}`} onClick={() => setAccountOpen(false)} />
            <div className={`preclass-mobile-account ${isAccountOpen ? 'is-open' : ''} ${isAccountDragging ? 'is-dragging' : ''}`} style={isAccountDragging ? { transform: `translateY(${accountOffset}px)` } : undefined} role="dialog" aria-label={t('Home.Logout')} aria-hidden={!isAccountOpen} {...{ inert: !isAccountOpen ? '' : undefined }}>
              <div className="preclass-mobile-handle" onPointerDown={handleAccountDragStart}><i /></div>
              <button
                className="preclass-mobile-logout"
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  setLogoutOpen(true);
                }}
              >
                {t('Home.Logout')}
              </button>
            </div>
          </>
        )}
        <TUIDialog open={isLogoutOpen} onUpdateOpen={setLogoutOpen} title={t('Home.Logout')} confirmText={t('Home.Logout')} cancelText={t('Preclass.Cancel')} closable={false} closeOnOverlay={false} onConfirm={onLogout}>{t('Preclass.LogoutConfirm')}</TUIDialog>
      </div>
    </RoomKitProvider>
  );
}
