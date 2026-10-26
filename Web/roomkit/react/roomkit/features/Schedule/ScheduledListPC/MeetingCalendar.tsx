import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { RoomStatus } from 'tuikit-atomicx-react/room';
import {
  IconCalendar,
  IconChevron,
  IconExternalLink,
  IconMore,
  TUIButton,
  TUIDropdown,
  TUIDropdownItem,
  TUILoading,
} from '../../../base';
import { useI18n } from '../../../i18n';
import {
  addDays,
  canShiftScheduleListWeek,
  clampScheduleListFirstDay,
  dateKey,
  eventDayKeys,
  formatTime,
  isScheduleDateSelectable,
  scheduleSelectableRange,
} from '../SchedulePanel/scheduleUtils';
import type { ScheduledRoom } from './useSchedule';
import './MeetingCalendar.scss';

const WEEKDAY_KEYS = [
  'Calendar.Sun',
  'Calendar.Mon',
  'Calendar.Tue',
  'Calendar.Wed',
  'Calendar.Thu',
  'Calendar.Fri',
  'Calendar.Sat',
];
const STATUS_KEYS = {
  live: 'Calendar.StatusLive',
  upcoming: 'Calendar.StatusUpcoming',
  ended: 'Calendar.StatusEnded',
};

export interface MeetingCalendarProps {
  meetings: ScheduledRoom[];
  now: number;
  currentUserId?: string;
  loading?: boolean;
  error?: string;
  onJoin?: (roomId: string) => void;
  onRefresh?: () => void;
  onShare?: (meeting: ScheduledRoom) => void;
  onDetail?: (meeting: ScheduledRoom) => void;
  onEdit?: (meeting: ScheduledRoom) => void;
  onCancel?: (meeting: ScheduledRoom) => void;
}

export interface MeetingCalendarExpose {
  selectDate: (date: Date) => void;
}

export const MeetingCalendar = forwardRef<MeetingCalendarExpose, MeetingCalendarProps>((props, ref) => {
  const {
    meetings,
    now,
    currentUserId,
    loading,
    error,
    onJoin,
    onRefresh,
    onShare,
    onDetail,
    onEdit,
    onCancel,
  } = props;
  const { language, t } = useI18n();

  const listNow = useMemo(() => new Date(now), [now]);
  const listRange = scheduleSelectableRange(listNow);
  const [selected, setSelected] = useState(() => dateKey(new Date(now)));
  const [firstDay, setFirstDay] = useState(() => clampScheduleListFirstDay(new Date(now), new Date(now)));
  const todayKey = dateKey(listNow);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(firstDay, index);
    return { date, key: dateKey(date) };
  });
  const canPrevWeek = canShiftScheduleListWeek(firstDay, -7, listNow);
  const canNextWeek = canShiftScheduleListWeek(firstDay, 7, listNow);
  const eventDays = useMemo(() => eventDayKeys(meetings, now), [meetings, now]);

  function status(meeting: ScheduledRoom): keyof typeof STATUS_KEYS {
    if (meeting.scheduledEndTime * 1000 <= now) {
      return 'ended';
    }
    if (meeting.roomStatus === RoomStatus.Running) {
      return 'live';
    }
    return 'upcoming';
  }

  const visibleMeetings = meetings
    .filter(meeting => dateKey(new Date(meeting.scheduledStartTime * 1000)) === selected)
    .filter(meeting => status(meeting) !== 'ended')
    .sort((a, b) => a.scheduledStartTime - b.scheduledStartTime);

  function timeRange(meeting: ScheduledRoom): string {
    return `${formatTime(meeting.scheduledStartTime * 1000)}-${formatTime(meeting.scheduledEndTime * 1000)}`;
  }
  function canManage(meeting: ScheduledRoom): boolean {
    return meeting.ownerUserId === currentUserId
      && meeting.roomStatus === RoomStatus.Scheduled;
  }
  function onMore(command: string | number, meeting: ScheduledRoom) {
    if (command === 'detail') {
      onDetail?.(meeting);
      return;
    }
    if (command === 'edit') {
      onEdit?.(meeting);
      return;
    }
    if (command === 'cancel') {
      onCancel?.(meeting);
    }
  }
  function selectVisibleDay(key: string) {
    if (!isScheduleDateSelectable(key, listRange.min, listRange.max)) {
      return;
    }
    setSelected(key);
  }
  function moveWeek(offset: number) {
    if (!canShiftScheduleListWeek(firstDay, offset, listNow)) {
      return;
    }
    const nextFirstDay = clampScheduleListFirstDay(addDays(firstDay, offset), listNow);
    setFirstDay(nextFirstDay);
    setSelected(dateKey(nextFirstDay));
  }
  function selectDate(date: Date) {
    const { min, max } = scheduleSelectableRange(listNow);
    const nextFirstDay = clampScheduleListFirstDay(date, listNow);
    setFirstDay(nextFirstDay);
    const key = dateKey(date);
    setSelected(isScheduleDateSelectable(key, min, max) ? key : dateKey(nextFirstDay));
  }
  useImperativeHandle(ref, () => ({ selectDate }));
  function goToday() {
    setFirstDay(clampScheduleListFirstDay(listNow, listNow));
    setSelected(todayKey);
  }

  return (
    <section className="calendar-card" aria-label={t('Calendar.Region')}>
      <header className="cal-header">
        <h2 className="cal-title">
          <i className="cal-title-dot" />
          {t('Calendar.Title')}
        </h2>
        <div className={['cal-nav', loading ? 'is-hidden' : ''].filter(Boolean).join(' ')}>
          <TUIButton
            className="cal-nav-btn"
            variant="ghost"
            size="sm"
            aria-label={t('Calendar.PreviousWeek')}
            disabled={!canPrevWeek}
            onClick={() => moveWeek(-7)}
          >
            <IconChevron className="previous" size={14} />
          </TUIButton>
          <TUIButton
            className="cal-nav-btn"
            variant="ghost"
            size="sm"
            aria-label={t('Calendar.NextWeek')}
            disabled={!canNextWeek}
            onClick={() => moveWeek(7)}
          >
            <IconChevron className="next" size={14} />
          </TUIButton>
          <TUIButton
            className="cal-nav-btn cal-nav-btn-text"
            variant="ghost"
            size="sm"
            onClick={goToday}
          >
            {t('Calendar.Today')}
          </TUIButton>
        </div>
      </header>
      {!loading && (
        <div className="cal-days">
          {days.map(day => (
            <div
              key={day.key}
              className={[
                'cal-day',
                selected === day.key ? 'active' : '',
                day.key === todayKey ? 'today' : '',
                eventDays.has(day.key) ? 'has-event' : '',
              ].filter(Boolean).join(' ')}
              aria-pressed={selected === day.key}
              aria-label={day.date.toLocaleDateString(language)}
              onClick={() => selectVisibleDay(day.key)}
            >
              <span className="cal-day-wk">
                {
                  day.key === todayKey
                    ? t('Calendar.Today')
                    : t(WEEKDAY_KEYS[day.date.getDay()])
                }
              </span>
              <span className="cal-day-num">{day.date.getDate()}</span>
              <i className="cal-day-dot" />
            </div>
          ))}
        </div>
      )}
      <div className="cal-list" aria-live="polite">
        {(() => {
          if (loading) {
            return (
              <div
                className="cal-list-loading"
                role="status"
              >
                <TUILoading size="lg" tip={t('Calendar.Loading')} />
              </div>
            );
          }
          if (error) {
            return (
              <div
                className="cal-list-empty"
                role="status"
              >
                <span className="cal-empty-icon"><IconCalendar size={18} /></span>
                <p>{error}</p>
                <TUIButton
                  className="cal-empty-action"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRefresh?.()}
                >
                  {t('Calendar.Retry')}
                </TUIButton>
              </div>
            );
          }
          if (!visibleMeetings.length) {
            return (
              <div className="cal-list-empty">
                <span className="cal-empty-icon"><IconCalendar size={18} /></span>
                <p>{t('Calendar.EmptyDay')}</p>
              </div>
            );
          }
          return (
            visibleMeetings.map(meeting => (
              <article
                key={meeting.roomId}
                className={['cal-item', `is-${status(meeting)}`].join(' ')}
              >
                <div className="cal-item-time">
                  <strong className="cal-item-time-h">
                    {
                      formatTime(meeting.scheduledStartTime * 1000)
                    }
                  </strong>
                  <span className="cal-item-time-d">
                    {
                      t(STATUS_KEYS[status(meeting)])
                    }
                  </span>
                </div>
                <i className="cal-item-bar" aria-hidden="true" />
                <div className="cal-item-body">
                  <h3 className="cal-item-title" title={meeting.roomName}>
                    {meeting.roomName}
                  </h3>
                  <div className="cal-item-meta">
                    {meeting.ownerUserId === currentUserId && (
                      <span className="cal-item-badge">{t('Calendar.Owner')}</span>
                    )}
                    {meeting.ownerUserId === currentUserId && (
                      <i
                        className="cal-item-meta-sep"
                        aria-hidden="true"
                      />
                    )}
                    <span className="cal-item-meta-text">{timeRange(meeting)}</span>
                    <i
                      className="cal-item-meta-sep"
                      aria-hidden="true"
                    />
                    <span className="cal-item-meta-text">{meeting.roomId}</span>
                  </div>
                </div>
                {meeting.roomId && status(meeting) !== 'ended' && (
                  <div className="cal-item-actions">
                    <TUIDropdown
                      placement="bottom"
                      onCommand={command => onMore(command, meeting)}
                      menuSlot={(
                        <>
                          <TUIDropdownItem command="detail">
                            {t('Schedule.ViewDetail')}
                          </TUIDropdownItem>
                          {canManage(meeting) && (
                            <TUIDropdownItem command="edit">
                              {t('Schedule.EditRoom')}
                            </TUIDropdownItem>
                          )}
                          {canManage(meeting) && (
                            <TUIDropdownItem
                              command="cancel"
                              danger
                            >
                              {t('Schedule.CancelRoom')}
                            </TUIDropdownItem>
                          )}
                        </>
                      )}
                    >
                      <TUIButton
                        className="cal-item-icon"
                        variant="ghost"
                        size="sm"
                        title={t('Calendar.More')}
                        aria-label={t('Calendar.More')}
                      >
                        <IconMore size={16} />
                      </TUIButton>
                    </TUIDropdown>
                    <TUIButton
                      className="cal-item-icon cal-item-share"
                      variant="ghost"
                      size="sm"
                      title={t('Calendar.Share')}
                      aria-label={t('Calendar.Share')}
                      onClick={() => onShare?.(meeting)}
                    >
                      <IconExternalLink size={15} />
                    </TUIButton>
                    <TUIButton
                      className="cal-item-join"
                      variant="ghost"
                      size="sm"
                      onClick={() => onJoin?.(meeting.roomId)}
                    >
                      {t('Calendar.Join')}
                    </TUIButton>
                  </div>
                )}
              </article>
            ))
          );
        })()}
      </div>
    </section>
  );
});

MeetingCalendar.displayName = 'MeetingCalendar';

export default MeetingCalendar;
