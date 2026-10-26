import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { LoginStatus, useLoginState } from 'tuikit-atomicx-react/room';
import { TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import MeetingCalendar from './MeetingCalendar';
import type { MeetingCalendarExpose } from './MeetingCalendar';
import ScheduleCancelDialog from './ScheduleCancelDialog';
import ScheduleShareDialog from './ScheduleShareDialog';
import { useSchedule } from './useSchedule';
import type { ScheduledRoom } from './useSchedule';

const CLOCK_MS = 30000;

export interface ScheduledListPCProps {
  onJoin?: (roomId: string) => void;
  onEdit?: (meeting: ScheduledRoom) => void;
}

export interface ScheduledListPCExpose {
  selectDate: (date: Date) => void;
}

export const ScheduledListPC = forwardRef<ScheduledListPCExpose, ScheduledListPCProps>((props, ref) => {
  const { onJoin, onEdit } = props;

  const {
    scheduledRooms,
    loading,
    submitting,
    loadFailure,
    refresh,
    hydrate,
    cancel,
  } = useSchedule();
  const { loginStatus, loginUserInfo } = useLoginState();
  const { t } = useI18n();

  /* Mirrors keep synchronous reads after writes, as Vue refs do. */
  const scheduledRoomsRef = useRef(scheduledRooms);
  scheduledRoomsRef.current = scheduledRooms;

  const hostName = loginUserInfo?.userName?.trim() || loginUserInfo?.userId || '';
  const currentUserId = loginUserInfo?.userId ?? '';
  const sessionReady = loginStatus === LoginStatus.LOGINED && currentUserId.length > 0;
  /* Any load failure collapses into one user-visible message. */
  const error = loadFailure ? t('Schedule.LoadFailure.failed') : '';
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (sessionReady) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady]);

  useEffect(() => {
    const clock = setInterval(() => {
      setNow(Date.now());
    }, CLOCK_MS);
    return () => {
      clearInterval(clock);
    };
  }, []);

  const calendarRef = useRef<MeetingCalendarExpose>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState<'invite' | 'detail'>('invite');
  const [shareRoomId, setShareRoomId] = useState('');
  const shareMeeting = scheduledRooms.find(item => item.roomId === shareRoomId);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMeeting, setCancelMeeting] = useState<ScheduledRoom>();

  async function openShare(meeting: ScheduledRoom, mode: 'invite' | 'detail') {
    await hydrate(meeting.roomId, { attendees: mode === 'detail' });
    setShareRoomId(meeting.roomId);
    setShareMode(mode);
    setShareOpen(true);
  }

  async function editMeeting(meeting: ScheduledRoom) {
    await hydrate(meeting.roomId);
    onEdit?.(scheduledRoomsRef.current.find(item => item.roomId === meeting.roomId) ?? meeting);
  }

  function openCancel(meeting: ScheduledRoom) {
    setCancelMeeting(meeting);
    setCancelOpen(true);
  }

  async function confirmCancel() {
    if (!cancelMeeting || submitting) {
      return;
    }
    const failure = await cancel(cancelMeeting.roomId);
    if (failure) {
      TUIToast.error(t('Schedule.CancelFailed'));
      return;
    }
    setCancelOpen(false);
    setCancelMeeting(undefined);
    TUIToast.success(t('Schedule.Cancelled'));
  }

  useImperativeHandle(ref, () => ({
    selectDate: (date: Date) => calendarRef.current?.selectDate(date),
  }));

  return (
    <>
      <MeetingCalendar
        ref={calendarRef}
        meetings={scheduledRooms}
        now={now}
        currentUserId={currentUserId}
        loading={loading}
        error={error}
        onJoin={roomId => onJoin?.(roomId)}
        onRefresh={refresh}
        onEdit={editMeeting}
        onShare={meeting => openShare(meeting, 'invite')}
        onDetail={meeting => openShare(meeting, 'detail')}
        onCancel={openCancel}
      />
      <ScheduleShareDialog
        open={shareOpen}
        onUpdateOpen={setShareOpen}
        meeting={shareMeeting}
        mode={shareMode}
        hostName={hostName}
      />
      <ScheduleCancelDialog
        open={cancelOpen}
        onUpdateOpen={setCancelOpen}
        busy={submitting}
        onConfirm={confirmCancel}
      />
    </>
  );
});

ScheduledListPC.displayName = 'ScheduledListPC';

export default ScheduledListPC;
