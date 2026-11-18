import { useEffect, useState } from 'react';
import { IconCheck, IconCopy, IconSearch, TUIAvatar, TUIButton, TUIDialog, TUIInput, useI18n } from '@tencentcloud/roomkit-web-react';
import type { PickedContact } from '@tencentcloud/roomkit-web-react';
import { inviteText, useCopyFeedback } from './courseCopy';
import { browserTimezoneLabel, durationLabel, formatRange } from './scheduleTime';
import { CLASS_MODES } from '../../classMode';
import type { ClassCourse } from '../../types';

interface CourseDetailDialogProps {
  open: boolean;
  course?: ClassCourse;
  link: string;
  attendees: PickedContact[];
  onUpdateOpen: (open: boolean) => void;
  onJoin: (roomId: string) => void;
}

export default function CourseDetailDialog({ open, course, link, attendees, onUpdateOpen, onJoin }: CourseDetailDialogProps) {
  const { t } = useI18n();
  const { copied, copy, reset } = useCopyFeedback();
  const [attendeeKeyword, setAttendeeKeyword] = useState('');
  useEffect(() => {
    if (!open) {
      reset();
      setAttendeeKeyword('');
    }
  }, [open, reset]);
  const keyword = attendeeKeyword.trim().toLowerCase();
  const filteredAttendees = attendees.filter(user => !keyword || user.userName.toLowerCase().includes(keyword));
  const hasNoAttendees = !attendees.length;
  const isLive = course?.status === 'live';
  const copyRows = course
    ? [
      { key: 'room', label: t('Preclass.RoomId'), value: course.roomId, copyLabel: t('Preclass.CopyRoomId') },
      { key: 'link', label: t('Preclass.ShareLink'), value: link, copyLabel: t('Preclass.CopyLink') },
    ]
    : [];
  return (
    <TUIDialog open={open} width={hasNoAttendees ? '600px' : '860px'} confirmText="" cancelText="" closeOnOverlay onUpdateOpen={onUpdateOpen}>
      {course && (
        <div className={`preclass-detail ${hasNoAttendees ? 'is-solo' : ''}`}>
          <div className="preclass-detail-main">
            <div className="preclass-detail-tags">
              <span className="preclass-detail-tag">{t(CLASS_MODES[course.classMode].label)}</span>
              <span className={`preclass-detail-status ${isLive ? 'is-live' : ''}`}>{t(isLive ? 'Preclass.StatusLive' : 'Preclass.StatusIdle')}</span>
            </div>
            <h3 className="preclass-detail-title">{course.title}</h3>
            <div className="preclass-detail-when">
              <b>{formatRange(course.start, course.end)}</b>
              <span>
                {' '}
                ·
                {durationLabel(Math.round((course.end - course.start) / 60))}
                {' '}
                ·
                {browserTimezoneLabel()}
              </span>
            </div>
            <div className="preclass-detail-people">
              <div className="preclass-detail-kv">
                <span className="preclass-detail-label">{t('Preclass.Teacher')}</span>
                <span className="preclass-detail-person">
                  <TUIAvatar size={32} alt={course.teacherName} />
                  <span>{course.teacherName}</span>
                </span>
              </div>
            </div>
            <div className="preclass-detail-info">
              {copyRows.map(row => (
                <div key={row.key} className="preclass-detail-kv">
                  <span className="preclass-detail-label">{row.label}</span>
                  <span className="preclass-detail-value">{row.value}</span>
                  <TUIButton className={`preclass-detail-copy ${copied === row.key ? 'is-copied' : ''}`} variant="ghost" size="sm" aria-label={row.copyLabel} onClick={() => copy(row.key, row.value)}>{copied === row.key ? <IconCheck /> : <IconCopy />}</TUIButton>
                </div>
              ))}
            </div>
            <div className="preclass-detail-foot">
              <TUIButton onClick={() => copy('invite', inviteText(course, link))}>{t(copied === 'invite' ? 'Preclass.Copied' : 'Preclass.CopyInvite')}</TUIButton>
              <TUIButton variant="primary" onClick={() => onJoin(course.roomId)}>{t('Preclass.EnterClass')}</TUIButton>
            </div>
          </div>
          {!hasNoAttendees && (
            <aside className="preclass-detail-side">
              <div className="preclass-detail-side-inner">
                <div className="preclass-detail-side-header">
                  <span className="preclass-detail-side-title">{t('Preclass.Student')}</span>
                  <span className="preclass-detail-side-count">{t('Schedule.AttendeeCount', { count: attendees.length })}</span>
                </div>
                <TUIInput
                  modelValue={attendeeKeyword}
                  onUpdateModelValue={value => setAttendeeKeyword(String(value ?? ''))}
                  className="preclass-detail-search"
                  size="sm"
                  clearable
                  placeholder={t('Participants.SearchPlaceholder')}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.stopPropagation();
                      setAttendeeKeyword('');
                    }
                  }}
                  prefixSlot={<IconSearch size={15} />}
                />
                <div className="preclass-detail-member-list">
                  {filteredAttendees.map(user => (
                    <div key={user.userId} className="preclass-detail-member" title={user.userName}>
                      <TUIAvatar size={28} alt={user.userName} />
                      <span>{user.userName}</span>
                    </div>
                  ))}
                  {!filteredAttendees.length && <div className="preclass-detail-member-empty">{t('Participants.SearchEmpty')}</div>}
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </TUIDialog>
  );
}
