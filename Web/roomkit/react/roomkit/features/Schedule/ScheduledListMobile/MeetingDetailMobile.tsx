/* Attendee cursor pages depend on the preceding response. */
/* eslint-disable no-await-in-loop */
import { useEffect, useRef, useState } from 'react';
import { RoomStatus, useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import type { RoomUser } from 'tuikit-atomicx-react/room';
import {
  IconCheck,
  IconChevron,
  IconCopy,
  IconMore,
  IconSearch,
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIDropdown,
  TUIDropdownItem,
  TUIInput,
  TUIToast,
} from '../../../base';
import { useI18n } from '../../../i18n';
import { copyTextToClipboard, formatCopyFields } from '../../../utils/clipboard';
import {
  dateKey,
  durationLabel,
  formatScheduleDate,
  formatTime,
  localTimezone,
  roomShareLink,
  timezoneLabel,
} from '../SchedulePanel/scheduleUtils';
import './MeetingDetailMobile.scss';

interface Member {
  userId: string;
  name: string;
  avatarUrl: string;
  isHost?: boolean;
}

const COPY_RESET_MS = 1800;

export interface MeetingDetailMobileProps {
  roomId: string;
  onBack?: () => void;
  onJoin?: (roomId: string) => void;
  onCancelled?: (roomId: string) => void;
}

export function MeetingDetailMobile(props: MeetingDetailMobileProps) {
  const { roomId, onBack, onJoin, onCancelled } = props;
  const { t } = useI18n();
  const { scheduledRoomList, getScheduledAttendees, getRoomInfo, cancelScheduledRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();

  const [page, setPage] = useState<'detail' | 'members'>('detail');
  const [query, setQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [roster, setRoster] = useState<RoomUser[] | undefined>(undefined);
  const [passwordOverride, setPasswordOverride] = useState<string | undefined>(undefined);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const closedLocallyRef = useRef(false);

  const listed = scheduledRoomList.find(room => room.roomId === roomId);

  const previousListedRef = useRef(listed);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  useEffect(() => {
    const previous = previousListedRef.current;
    previousListedRef.current = listed;
    if (!previous || listed || closedLocallyRef.current) {
      return;
    }
    TUIToast.info(t('Schedule.NotFound'));
    onBackRef.current?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listed]);
  const scheduleAttendees = roster ?? listed?.scheduleAttendees ?? [];
  const selfId = loginUserInfo?.userId ?? '';
  const isSelfHost = !!selfId && listed?.roomOwner?.userId === selfId;

  const host: Member = (() => {
    const owner = listed?.roomOwner;
    const userId = owner?.userId ?? '';
    const attendee = scheduleAttendees.find(user => user.userId === userId);
    const self = isSelfHost ? loginUserInfo : undefined;
    return {
      userId,
      name: owner?.userName || self?.userName || attendee?.userName || userId,
      avatarUrl: owner?.avatarUrl || self?.avatarUrl || attendee?.avatarUrl || '',
      isHost: true,
    };
  })();

  const attendees: Member[] = scheduleAttendees
    // The engine pads failed profile lookups with IM placeholder ids.
    .filter(user => user.userId && !/#|not[_-]?found/i.test(user.userId))
    .map(user => ({
      userId: user.userId,
      name: user.userName.trim() || user.userId,
      avatarUrl: user.avatarUrl,
      isHost: user.userId === host.userId,
    }));
  /* The list is the scheduled attendees as the state holds them: the owner is neither
     prepended nor removed, only tagged when the state lists them. */
  const members = attendees;
  const keyword = query.trim().toLowerCase();
  const filteredMembers = keyword
    ? members.filter(member => member.name.toLowerCase().includes(keyword))
    : members;
  const membersCountText = t(
    members.length > 3 ? 'Schedule.MembersMore' : 'Schedule.MembersCount',
    { count: members.length },
  );

  const canManage = isSelfHost
    && listed?.roomStatus === RoomStatus.Scheduled
    && (listed.scheduledEndTime ?? 0) * 1000 > Date.now();

  const startMs = (listed?.scheduledStartTime ?? 0) * 1000;
  const startText = `${formatScheduleDate(dateKey(new Date(startMs)))} ${formatTime(startMs)}`;
  const durationText = (() => {
    const start = listed?.scheduledStartTime ?? 0;
    return durationLabel(Math.max(0, Math.round(((listed?.scheduledEndTime ?? start) - start) / 60)));
  })();
  // Scheduled rooms carry no timezone; times are shown in the device zone.
  const timezoneText = timezoneLabel(localTimezone());
  const link = roomShareLink(roomId);
  const password = (passwordOverride !== undefined ? passwordOverride : listed?.password ?? '').trim();

  const copyFields = [
    {
      key: 'roomId',
      label: t('Invitation.RoomId'),
      display: roomId.replace(/(\d{3})(?=\d)/g, '$1 '),
      value: roomId,
      copyLabel: t('Schedule.CopyRoomId'),
    },
    ...(password
      ? [{
        key: 'password',
        label: t('Schedule.Password'),
        display: password,
        value: password,
        copyLabel: t('Schedule.CopyPassword'),
      }]
      : []),
    {
      key: 'link',
      label: t('Invitation.Link'),
      display: link,
      value: link,
      copyLabel: t('Schedule.CopyLink'),
    },
  ];

  useEffect(() => () => {
    clearTimeout(copyTimerRef.current);
  }, []);

  useEffect(() => {
    setPage('detail');
    setQuery('');
    setCopiedKey('');
    setRoster(undefined);
    setPasswordOverride(undefined);
    if (!roomId) {
      return undefined;
    }
    let active = true;
    void (async () => {
      try {
        const nextRoster: RoomUser[] = [];
        let cursor = '';
        do {
          const result = await getScheduledAttendees({ roomId, cursor });
          nextRoster.push(...result.attendees);
          ({ cursor } = result);
        } while (cursor);
        const info = await getRoomInfo({ roomId });
        if (!active) {
          return;
        }
        setRoster(nextRoster);
        setPasswordOverride(info.password || '');
      } catch (err) {
        console.error('[MeetingDetailMobile] Failed to load meeting detail:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [roomId, getScheduledAttendees, getRoomInfo]);

  async function copyField(key: string, value: string) {
    try {
      await copyTextToClipboard(value);
      setCopiedKey(key);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopiedKey('');
      }, COPY_RESET_MS);
    } catch {
      TUIToast.error(t('Schedule.CopyFailed'));
    }
  }

  async function copyInvite() {
    if (!listed) {
      return;
    }
    const text = formatCopyFields([
      { label: t('Invitation.RoomName'), value: listed.roomName },
      { label: t('Schedule.StartTime'), value: startText },
      { label: t('Invitation.RoomId'), value: roomId },
      { label: t('Schedule.Password'), value: password },
      { label: t('Invitation.Link'), value: link },
    ]);
    try {
      await copyTextToClipboard(text);
      TUIToast.success(t('Schedule.InviteCopied'));
    } catch {
      TUIToast.error(t('Schedule.CopyFailed'));
    }
  }

  function openMembers() {
    setQuery('');
    setPage('members');
  }

  function onMore(command: string | number) {
    if (command === 'cancel') {
      setCancelOpen(true);
    }
  }

  async function confirmCancel() {
    if (cancelling) {
      return;
    }
    setCancelling(true);
    closedLocallyRef.current = true;
    try {
      await cancelScheduledRoom({ roomId });
      setCancelOpen(false);
      TUIToast.success(t('Schedule.Cancelled'));
      onCancelled?.(roomId);
    } catch (err) {
      closedLocallyRef.current = false;
      console.error('[MeetingDetailMobile] Failed to cancel scheduled room:', err);
      TUIToast.error(t('Schedule.CancelFailed'));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className={['meeting-detail-mobile', page === 'members' ? 'is-members' : ''].filter(Boolean).join(' ')}>
      <section className="meeting-detail-page is-detail" aria-hidden={page === 'members'}>
        <header className="meeting-detail-nav">
          <button
            className="meeting-detail-back"
            type="button"
            aria-label={t('Schedule.Back')}
            onClick={() => onBack?.()}
          >
            <IconChevron className="meeting-detail-back-icon" size={22} />
          </button>
          <div className="meeting-detail-title">
            {t('Schedule.ShareTitleDetail')}
          </div>
          {canManage && (
            <div className="meeting-detail-actions">
              <TUIDropdown
                placement="bottom-end"
                onCommand={onMore}
                menuSlot={(
                  <TUIDropdownItem command="cancel" danger>
                    {t('Schedule.CancelRoom')}
                  </TUIDropdownItem>
                )}
              >
                <button
                  className="meeting-detail-more"
                  type="button"
                  aria-label={t('Calendar.More')}
                >
                  <IconMore size={20} />
                </button>
              </TUIDropdown>
            </div>
          )}
        </header>

        {listed && (
          <div className="meeting-detail-body">
            <div className="meeting-detail-card">
              <div className="meeting-detail-row">
                <span className="meeting-detail-label">{t('Invitation.RoomName')}</span>
                <span className="meeting-detail-value">
                  <span className="meeting-detail-text">{listed.roomName}</span>
                </span>
              </div>
              <div className="meeting-detail-row">
                <span className="meeting-detail-label">{t('RoomInfo.Host')}</span>
                <span className="meeting-detail-value">
                  <TUIAvatar className="meeting-detail-face" src={host.avatarUrl} alt={host.name} size={24} />
                  <span className="meeting-detail-text is-fit">{host.name}</span>
                </span>
              </div>
              <div className="meeting-detail-row">
                <span className="meeting-detail-label">{t('Schedule.StartTime')}</span>
                <span className="meeting-detail-value">
                  <span className="meeting-detail-text">{startText}</span>
                </span>
              </div>
              <div className="meeting-detail-row">
                <span className="meeting-detail-label">{t('Schedule.Duration')}</span>
                <span className="meeting-detail-value">
                  <span className="meeting-detail-text">{durationText}</span>
                </span>
              </div>
              <div className="meeting-detail-row">
                <span className="meeting-detail-label">{t('Schedule.Timezone')}</span>
                <span className="meeting-detail-value">
                  <span className="meeting-detail-text">{timezoneText}</span>
                </span>
              </div>
              {members.length > 0 && (
                <button className="meeting-detail-row" type="button" onClick={openMembers}>
                  <span className="meeting-detail-label">{t('Schedule.Participants')}</span>
                  <span className="meeting-detail-value">
                    <span className="meeting-detail-faces">
                      {members.slice(0, 3).map(member => (
                        <TUIAvatar
                          key={member.userId}
                          className="meeting-detail-face"
                          src={member.avatarUrl}
                          alt={member.name}
                          size={24}
                        />
                      ))}
                    </span>
                    <span className="meeting-detail-text is-fit">{membersCountText}</span>
                    <IconChevron className="meeting-detail-chevron" size={16} />
                  </span>
                </button>
              )}
            </div>

            <div className="meeting-detail-card">
              {copyFields.map(field => (
                <div key={field.key} className="meeting-detail-row">
                  <span className="meeting-detail-label">{field.label}</span>
                  <span className="meeting-detail-value">
                    <span className="meeting-detail-text">{field.display}</span>
                    <button
                      className={['meeting-detail-copy', copiedKey === field.key ? 'is-copied' : ''].filter(Boolean).join(' ')}
                      type="button"
                      aria-label={field.copyLabel}
                      onPointerDown={event => event.preventDefault()}
                      onClick={() => void copyField(field.key, field.value)}
                    >
                      {copiedKey === field.key
                        ? (
                          <IconCheck className="meeting-detail-check" size={16} />
                        )
                        : (
                          <IconCopy size={16} />
                        )}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="meeting-detail-foot">
          <TUIButton
            className="meeting-detail-foot-btn"
            variant="secondary"
            size="lg"
            disabled={!listed}
            onClick={() => void copyInvite()}
          >
            {t('Schedule.CopyInvite')}
          </TUIButton>
          <TUIButton
            className="meeting-detail-foot-btn"
            variant="primary"
            size="lg"
            disabled={!listed}
            onClick={() => onJoin?.(roomId)}
          >
            {t('Calendar.Enter')}
          </TUIButton>
        </footer>
      </section>

      <section className="meeting-detail-page is-members" aria-hidden={page !== 'members'}>
        <header className="meeting-detail-nav">
          <button
            className="meeting-detail-back"
            type="button"
            aria-label={t('Schedule.Back')}
            onClick={() => setPage('detail')}
          >
            <IconChevron className="meeting-detail-back-icon" size={22} />
          </button>
          <div className="meeting-detail-title">
            {t('Schedule.ParticipantsTitle', { count: members.length })}
          </div>
        </header>
        <div className="meeting-detail-search">
          <TUIInput
            modelValue={query}
            size="sm"
            clearable
            placeholder={t('Participants.SearchPlaceholder')}
            onUpdateModelValue={value => setQuery(String(value ?? ''))}
            prefixSlot={<IconSearch className="meeting-detail-search-icon" size={14} />}
          />
        </div>
        <div className="meeting-detail-body">
          {filteredMembers.length > 0
            ? (
              <ul className="meeting-detail-card">
                {filteredMembers.map(member => (
                  <li
                    key={member.userId}
                    className="meeting-detail-row meeting-detail-member"
                  >
                    <TUIAvatar src={member.avatarUrl} alt={member.name} size={36} />
                    <span className="meeting-detail-member-name">{member.name}</span>
                    {member.isHost && (
                      <span className="meeting-detail-tag">{t('RoomInfo.Host')}</span>
                    )}
                  </li>
                ))}
              </ul>
            )
            : (
              <div className="meeting-detail-empty">
                {t('Participants.SearchEmpty')}
              </div>
            )}
        </div>
      </section>

      <TUIDialog
        open={cancelOpen}
        title={t('Schedule.CancelRoom')}
        width="320px"
        confirmText=""
        cancelText=""
        closeOnOverlay={!cancelling}
        closeOnEsc={!cancelling}
        onUpdateOpen={setCancelOpen}
        footerSlot={(
          <div className="meeting-detail-cancel-actions">
            <TUIButton
              className="meeting-detail-cancel-btn"
              variant="secondary"
              disabled={cancelling}
              onClick={() => setCancelOpen(false)}
            >
              {t('Schedule.CancelThink')}
            </TUIButton>
            <TUIButton
              className="meeting-detail-cancel-btn"
              variant="primary"
              disabled={cancelling}
              onClick={() => void confirmCancel()}
            >
              {t('Schedule.CancelConfirm')}
            </TUIButton>
          </div>
        )}
      >
        <p className="meeting-detail-cancel-desc">
          {t('Schedule.CancelRoomDesc')}
        </p>
      </TUIDialog>
    </div>
  );
}

export default MeetingDetailMobile;
