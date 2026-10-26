/* Cursor pages and engine-ready retries depend on the preceding response. */
/* eslint-disable no-await-in-loop */
import { useEffect, useMemo, useRef, useState } from 'react';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { LoginStatus, RoomStatus, useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import type { RoomInfo } from 'tuikit-atomicx-react/room';
import { IconAgendaEmpty, TUIButton, TUILoading } from '../../../base';
import { useI18n } from '../../../i18n';
import { dateKey, formatTime } from '../SchedulePanel/scheduleUtils';
import './ScheduledListMobile.scss';

type ScheduledMeeting = RoomInfo & { scheduledStartTime: number; scheduledEndTime: number };

const CLOCK_MS = 30000;
// IM can already be LOGINED while room-engine SSO is still initializing.
const ENGINE_READY_RETRY_DELAYS_MS = [100, 200, 400, 800, 1500];
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
  upcoming: 'Calendar.StatusSoon',
  ended: 'Calendar.StatusEnded',
};

export interface ScheduledListMobileProps {
  onJoin?: (roomId: string) => void;
  onDetail?: (roomId: string) => void;
}

function isScheduledMeeting(room: RoomInfo): room is ScheduledMeeting {
  return !!room.scheduledStartTime && !!room.scheduledEndTime;
}

function meetingStatus(meeting: ScheduledMeeting, nowMs: number): keyof typeof STATUS_KEYS {
  if (meeting.scheduledEndTime * 1000 <= nowMs) {
    return 'ended';
  }
  if (meeting.roomStatus === RoomStatus.Running) {
    return 'live';
  }
  return 'upcoming';
}

function isEngineNotReady(err: unknown): boolean {
  const { code, message } = (err ?? {}) as { code?: unknown; message?: unknown };
  return code === TUIErrorCode.ERR_SDK_NOT_INITIALIZED || String(message ?? '').includes('not inited');
}

export function ScheduledListMobile(props: ScheduledListMobileProps) {
  const { onJoin, onDetail } = props;
  const { t, language } = useI18n();
  const { scheduledRoomList, getScheduledRoomList } = useRoomState();
  const { loginStatus, loginUserInfo } = useLoginState();

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const loadingRef = useRef(false);

  const currentUserId = loginUserInfo?.userId ?? '';
  const sessionReady = loginStatus === LoginStatus.LOGINED && currentUserId.length > 0;

  function groupLabel(date: Date) {
    return t('Calendar.DateWk', {
      month: date.getMonth() + 1,
      day: date.getDate(),
      week: t(WEEKDAY_KEYS[date.getDay()]),
    });
  }

  const groups = useMemo(() => {
    if (!sessionReady) {
      return [];
    }
    const byDay = new Map<string, { key: string; label: string; meetings: ScheduledMeeting[] }>();
    scheduledRoomList
      .filter(isScheduledMeeting)
      .filter(meeting => meetingStatus(meeting, now) !== 'ended')
      .sort((a, b) => a.scheduledStartTime - b.scheduledStartTime)
      .forEach((meeting) => {
        const date = new Date(meeting.scheduledStartTime * 1000);
        const key = dateKey(date);
        if (!byDay.has(key)) {
          byDay.set(key, { key, label: groupLabel(date), meetings: [] });
        }
        byDay.get(key)?.meetings.push(meeting);
      });
    return [...byDay.values()];
    // groupLabel closes over `t`, which follows `language`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, scheduledRoomList, now, language]);

  function timeRange(meeting: ScheduledMeeting): string {
    return `${formatTime(meeting.scheduledStartTime * 1000)}-${formatTime(meeting.scheduledEndTime * 1000)}`;
  }

  async function fetchPage(cursor: string) {
    for (const delay of [...ENGINE_READY_RETRY_DELAYS_MS, undefined]) {
      try {
        return await getScheduledRoomList({ cursor });
      } catch (err) {
        if (delay === undefined || !isEngineNotReady(err)) {
          throw err;
        }
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
    throw new Error('unreachable');
  }

  async function refresh() {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    setError('');
    try {
      let cursor = '';
      do {
        ({ cursor } = await fetchPage(cursor));
      } while (cursor);
    } catch (err) {
      console.error('[ScheduledListMobile] Failed to load scheduled rooms:', err);
      setError(t('Schedule.LoadFailure.failed'));
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoaded(true);
    }
  }

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (sessionReady) {
      void refreshRef.current();
    } else {
      setLoaded(false);
    }
  }, [sessionReady]);

  useEffect(() => {
    const clock = setInterval(() => {
      setNow(Date.now());
    }, CLOCK_MS);
    return () => {
      clearInterval(clock);
    };
  }, []);

  let body;
  if (!groups.length && !error && (loading || !loaded)) {
    body = (
      <div className="scheduled-list-mobile-loading" role="status">
        <TUILoading size="lg" tip={t('Calendar.Loading')} />
      </div>
    );
  } else if (error && !groups.length) {
    body = (
      <div className="scheduled-list-mobile-state" role="status">
        <p className="scheduled-list-mobile-state-text">
          {error}
        </p>
        <TUIButton variant="ghost" size="sm" onClick={() => void refresh()}>
          {t('Calendar.Retry')}
        </TUIButton>
      </div>
    );
  } else if (!groups.length) {
    body = (
      <div className="scheduled-list-mobile-state">
        <IconAgendaEmpty className="scheduled-list-mobile-empty-art" />
        <p className="scheduled-list-mobile-empty-title">
          {t('Calendar.EmptyRecent')}
        </p>
      </div>
    );
  } else {
    body = groups.map(group => (
      <div key={group.key} className="scheduled-list-mobile-group">
        <div className="scheduled-list-mobile-group-label">
          {group.label}
        </div>
        {group.meetings.map((meeting) => {
          const state = meetingStatus(meeting, now);
          return (
            <div
              key={meeting.roomId}
              className={['scheduled-list-mobile-item', `is-${state}`].join(' ')}
              role="button"
              tabIndex={0}
              onClick={() => onDetail?.(meeting.roomId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onDetail?.(meeting.roomId);
                }
              }}
            >
              <div className="scheduled-list-mobile-time">
                <strong className="scheduled-list-mobile-time-h">
                  {formatTime(meeting.scheduledStartTime * 1000)}
                </strong>
                <span className="scheduled-list-mobile-time-d">
                  {t(STATUS_KEYS[state])}
                </span>
              </div>
              <div className="scheduled-list-mobile-body">
                <div className="scheduled-list-mobile-title" title={meeting.roomName}>
                  {meeting.roomName}
                </div>
                <div className="scheduled-list-mobile-meta">
                  {meeting.roomOwner?.userId === currentUserId && (
                    <span className="scheduled-list-mobile-badge">
                      {t('Calendar.Owner')}
                    </span>
                  )}
                  {meeting.roomOwner?.userId === currentUserId && (
                    <i className="scheduled-list-mobile-meta-sep" aria-hidden="true" />
                  )}
                  <span className="scheduled-list-mobile-meta-text">{timeRange(meeting)}</span>
                  <i className="scheduled-list-mobile-meta-sep" aria-hidden="true" />
                  <span className="scheduled-list-mobile-meta-text">{meeting.roomId}</span>
                </div>
              </div>
              {meeting.roomId && (
                <TUIButton
                  className="scheduled-list-mobile-join"
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onJoin?.(meeting.roomId);
                  }}
                >
                  {t('Calendar.Join')}
                </TUIButton>
              )}
            </div>
          );
        })}
      </div>
    ));
  }

  return (
    <section className="scheduled-list-mobile" aria-label={t('Calendar.Region')}>
      <div className="scheduled-list-mobile-scroll" aria-live="polite">
        {body}
      </div>
    </section>
  );
}

export default ScheduledListMobile;
