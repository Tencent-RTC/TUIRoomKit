import { IconCheck, IconCopy, TUIButton, useI18n } from '@tencentcloud/roomkit-web-react';
import CourseMoreMenu from './CourseMoreMenu';
import { inviteText, useCopyFeedback } from './courseCopy';
import { durationLabel, formatClock } from './scheduleTime';
import { CLASS_MODES } from '../../classMode';
import type { ClassCourse } from '../../types';
import type { CourseMoreCommand } from './useClassSchedule';

export interface CourseCardProps {
  course: ClassCourse;
  link: string;
  canManage: boolean;
  onJoin: (roomId: string) => void;
  onOpen: (course: ClassCourse) => void;
  onMore: (course: ClassCourse, command: CourseMoreCommand) => void;
}

export default function CourseCard({ course, link, canManage, onJoin, onOpen, onMore }: CourseCardProps) {
  const { t } = useI18n();
  const { copied, copy } = useCopyFeedback();
  const isLive = course.status === 'live';
  return (
    <article
      className={`preclass-course ${isLive ? 'is-live' : ''}`}
      role="listitem"
      tabIndex={0}
      onClick={() => onOpen(course)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === event.currentTarget) {
          event.preventDefault();
          onOpen(course);
        }
      }}
    >
      <div className="preclass-course-when">
        <span className={`preclass-course-mode is-${course.classMode === 'oneOnOne' ? 'one-on-one' : course.classMode}`}>{t(CLASS_MODES[course.classMode].label)}</span>
        <b className="preclass-course-start">{formatClock(course.start)}</b>
        <span className="preclass-course-end">{formatClock(course.end)}</span>
      </div>
      <div className="preclass-course-main">
        <div className="preclass-course-head">
          <h3 className="preclass-course-title">{course.title}</h3>
          <em className={`preclass-course-status ${isLive ? 'is-live' : ''}`}>{t(isLive ? 'Preclass.StatusLive' : 'Preclass.StatusIdle')}</em>
        </div>
        <p className="preclass-course-sub">
          <span>{durationLabel(Math.round((course.end - course.start) / 60))}</span>
          <span className="preclass-course-id">
            {t('Preclass.RoomId')}
            {' '}
            {course.roomId}
            <button
              type="button"
              className={`preclass-copy ${copied === 'room' ? 'is-copied' : ''}`}
              aria-label={t('Preclass.CopyRoomId')}
              onClick={(event) => {
                event.stopPropagation();
                copy('room', course.roomId);
              }}
            >
              {copied === 'room' ? <IconCheck size={12} /> : <IconCopy size={12} />}
            </button>
          </span>
        </p>
        <div className="preclass-course-foot">
          <span className="preclass-course-person">
            <i className="preclass-course-avatar">{course.teacherName.slice(0, 1)}</i>
            <span>{course.teacherName}</span>
          </span>
          <div className="preclass-course-ops" onClick={event => event.stopPropagation()}>
            {canManage && course.isMine && <span className="preclass-course-more"><CourseMoreMenu live={isLive} onCommand={command => onMore(course, command)} /></span>}
            <TUIButton className="preclass-course-op" variant="secondary" onClick={() => copy('invite', inviteText(course, link))}>{t(copied === 'invite' ? 'Preclass.Copied' : 'Preclass.CopyInvite')}</TUIButton>
            <TUIButton className="preclass-course-op" variant={isLive ? 'primary' : 'secondary'} onClick={() => onJoin(course.roomId)}>{t('Preclass.EnterClass')}</TUIButton>
          </div>
        </div>
      </div>
    </article>
  );
}
