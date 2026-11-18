import { useEffect, useRef, useState } from 'react';
import { useLoginState } from 'tuikit-atomicx-react/room';
import { IconAlertCircle, RoomKitProvider, TUISegmented, TUIToast, useI18n } from '@tencentcloud/roomkit-web-react';
import type { PickedContact } from '@tencentcloud/roomkit-web-react';
import ResumeBanner from '../ResumeBanner';
import type { ClassCourse, PreclassProps } from '../types';
import { useClassRole } from '../classRole';
import { useResumeRoom } from '../useResumeRoom';
import LocalPreview from './LocalPreview';
import PreconferenceTopbar from './PreconferenceTopbar';
import RoleSwitch from './RoleSwitch';
import BookForm from './schedule/BookForm';
import CourseBoard from './schedule/CourseBoard';
import type { CourseBoardHandle } from './schedule/CourseBoard';
import CourseCancelDialog from './schedule/CourseCancelDialog';
import CourseDetailDialog from './schedule/CourseDetailDialog';
import { classLink, useClassSchedule } from './schedule/useClassSchedule';
import type { BookInput, CourseMoreCommand } from './schedule/useClassSchedule';
import './PreclassPC.scss';

export default function PreclassPC({ className, onJoin, onLogout }: PreclassProps) {
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const userName = loginUserInfo?.userName || loginUserInfo?.userId || '';
  const avatarUrl = loginUserInfo?.avatarUrl || '';
  const role = useClassRole();
  const isTeacher = role === 'teacher';
  const [faultBannerKey, setFaultBannerKey] = useState<string>();
  const { resumeRoomId, dismissResume } = useResumeRoom();
  const [activeTab, setActiveTab] = useState<'list' | 'book'>('list');
  const { now, courses, isLoaded, fetchAttendees, book, update, cancel } = useClassSchedule();
  const boardRef = useRef<CourseBoardHandle>(null);
  const [attendeeCache, setAttendeeCache] = useState<Record<string, PickedContact[]>>({});
  const [editingCourse, setEditingCourse] = useState<ClassCourse>();
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [detailCourse, setDetailCourse] = useState<ClassCourse>();
  const [isCancelOpen, setCancelOpen] = useState(false);
  const [cancelCourse, setCancelCourse] = useState<ClassCourse>();
  const [isCancelling, setCancelling] = useState(false);
  const isSaving = useRef(false);
  const isCancellingRef = useRef(false);
  const editRequestId = useRef(0);
  const isTeacherRef = useRef(isTeacher);
  isTeacherRef.current = isTeacher;

  useEffect(() => () => {
    editRequestId.current += 1;
  }, []);
  useEffect(() => {
    editRequestId.current += 1;
    setEditingCourse(undefined);
    setActiveTab('list');
  }, [isTeacher]);

  async function loadAttendees(roomId: string) {
    if (!roomId || attendeeCache[roomId]) return;
    try {
      const attendees = await fetchAttendees(roomId);
      setAttendeeCache(current => ({ ...current, [roomId]: attendees }));
    } catch (error) {
      console.error('[PreclassPC] Failed to load class members:', error);
    }
  }
  function openBook(course?: ClassCourse) {
    editRequestId.current += 1;
    setEditingCourse(course);
    setFormKey(current => current + 1);
    setActiveTab('book');
  }
  function closeBook() {
    editRequestId.current += 1;
    setEditingCourse(undefined);
    setActiveTab('list');
  }
  async function submitBook(input: BookInput) {
    if (isSaving.current) return;
    const editing = editingCourse;
    isSaving.current = true;
    setSubmitting(true);
    try {
      const outcome = editing ? await update(editing.roomId, input) : await book(input);
      if ('failure' in outcome) {
        TUIToast.error(t(editing ? 'Preclass.UpdateFailed' : 'Preclass.BookFailed'));
        return;
      }
      TUIToast.success(t(editing ? 'Preclass.Updated' : 'Preclass.BookedToast'));
      setAttendeeCache(current => ({ ...current, [outcome.roomId]: input.attendees }));
      closeBook();
      boardRef.current?.showDay(new Date(input.start * 1000));
    } finally {
      isSaving.current = false;
      setSubmitting(false);
    }
  }
  function openDetail(course: ClassCourse) {
    setDetailCourse(course);
    setDetailOpen(true);
    loadAttendees(course.roomId).catch(() => {});
  }
  function handleMore(course: ClassCourse, command: CourseMoreCommand) {
    if (command === 'detail') openDetail(course);
    else if (command === 'edit') {
      editRequestId.current += 1;
      const requestId = editRequestId.current;
      fetchAttendees(course.roomId).then((attendees) => {
        if (requestId !== editRequestId.current || !isTeacherRef.current) return;
        setAttendeeCache(current => ({ ...current, [course.roomId]: attendees }));
        openBook(course);
      }).catch((error) => {
        if (requestId !== editRequestId.current || !isTeacherRef.current) return;
        console.error('[PreclassPC] Failed to load class members for editing:', error);
        TUIToast.error(t('Preclass.UpdateFailed'));
      });
    } else {
      setCancelCourse(course);
      setCancelOpen(true);
    }
  }
  async function confirmCancel() {
    if (!cancelCourse || isCancellingRef.current) return;
    isCancellingRef.current = true;
    setCancelling(true);
    try {
      await cancel(cancelCourse.roomId);
      setCancelOpen(false);
      setCancelCourse(undefined);
      TUIToast.success(t('Preclass.Cancelled'));
    } catch (error) {
      console.error('[PreclassPC] Failed to cancel class:', error);
      TUIToast.error(t('Preclass.CancelFailed'));
    } finally {
      isCancellingRef.current = false;
      setCancelling(false);
    }
  }

  return (
    <RoomKitProvider className={['preclass-root', className].filter(Boolean).join(' ')} scene="education">
      <div className="preclass-view">
        <PreconferenceTopbar userName={userName} avatarUrl={avatarUrl} onLogout={onLogout} actions={<RoleSwitch />} />
        {resumeRoomId && <ResumeBanner roomId={resumeRoomId} course={courses.find(course => course.roomId === resumeRoomId)} onBack={() => onJoin(resumeRoomId)} onDismiss={dismissResume} />}
        {faultBannerKey && (
          <div className="preclass-fault-banner">
            <IconAlertCircle size={14} />
            <span>{t(faultBannerKey)}</span>
          </div>
        )}
        <main className="preclass-main">
          <div className="preclass-lobby">
            <section className="preclass-preview-card" aria-label={t('Preconference.PreviewRegion')}>
              <div className="preclass-hello">
                <h1>{t('Preclass.ReadyTitle')}</h1>
                <p>{t('Preclass.ReadyDesc')}</p>
              </div>
              <LocalPreview onBannerChange={setFaultBannerKey} />
            </section>
            <section className="preclass-panel">
              {isTeacher && (
                <div className="preclass-tabs">
                  <TUISegmented
                    size="sm"
                    modelValue={activeTab}
                    options={[{ value: 'list', label: t('Preclass.CourseList') }, { value: 'book', label: t(editingCourse ? 'Preclass.EditClass' : 'Preclass.Book') }]}
                    onUpdateModelValue={(tab) => {
                      if (tab === 'list') closeBook();
                      else openBook();
                    }}
                  />
                </div>
              )}
              <div className="preclass-pane" role="tabpanel" style={{ display: activeTab === 'list' ? undefined : 'none' }}><CourseBoard ref={boardRef} courses={courses} canManage={isTeacher} isLoaded={isLoaded} now={now} linkOf={classLink} onJoin={onJoin} onOpen={openDetail} onMore={handleMore} /></div>
              {isTeacher && activeTab === 'book' && (
                <div className="preclass-pane" role="tabpanel">
                  <BookForm
                    key={formKey}
                    course={editingCourse}
                    attendees={editingCourse ? attendeeCache[editingCourse.roomId] : undefined}
                    defaultTitle={t('Classroom.DefaultName', { name: userName })}
                    submitting={isSubmitting}
                    onSubmit={(input) => {
                      submitBook(input).catch(() => {});
                    }}
                    onCancel={closeBook}
                  />
                </div>
              )}
            </section>
          </div>
        </main>
        <CourseDetailDialog open={isDetailOpen} onUpdateOpen={setDetailOpen} course={detailCourse} link={detailCourse ? classLink() : ''} attendees={detailCourse ? attendeeCache[detailCourse.roomId] ?? [] : []} onJoin={onJoin} />
        <CourseCancelDialog
          open={isCancelOpen}
          busy={isCancelling}
          onUpdateOpen={setCancelOpen}
          onConfirm={() => {
            confirmCancel().catch(() => {});
          }}
        />
      </div>
    </RoomKitProvider>
  );
}
