import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconCopy, TUIButton, TUIDialog, TUIToast } from '../../../base';
import { useI18n } from '../../../i18n';
import { copyTextToClipboard, formatCopyFields } from '../../../utils/clipboard';
import type { ScheduledRoom } from './useSchedule';
import {
  formatScheduleRange,
  roomShareLink,
} from '../SchedulePanel/scheduleUtils';
import './ScheduleShareDialog.scss';

export interface ScheduleShareDialogProps {
  open: boolean;
  meeting?: ScheduledRoom | null;
  mode?: 'invite' | 'success' | 'detail';
  hostName?: string;
  onUpdateOpen?: (open: boolean) => void;
}

export function ScheduleShareDialog(props: ScheduleShareDialogProps) {
  const { open, meeting, hostName, onUpdateOpen } = props;
  const { t } = useI18n();

  const [copied, setCopied] = useState('');
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);
  const mode = props.mode ?? 'invite';
  const link = meeting ? roomShareLink(meeting.roomId) : '';
  const copyFields = (() => {
    if (!meeting) {
      return [];
    }
    return [
      { key: 'room', label: t('Invitation.RoomId'), value: meeting.roomId, copyLabel: t('Schedule.CopyRoomId') },
      ...(meeting.password
        ? [{ key: 'pw', label: t('Invitation.Password'), value: meeting.password, copyLabel: t('Schedule.CopyPassword') }]
        : []),
      { key: 'link', label: t('Invitation.Link'), value: link, copyLabel: t('Schedule.CopyLink') },
    ];
  })();
  const title = (() => {
    if (mode === 'detail') {
      return t('Schedule.ShareTitleDetail');
    }
    if (mode === 'success') {
      return t('Schedule.ShareTitleSuccess');
    }
    const host = hostName?.trim();
    return host
      ? t('Schedule.ShareTitleInvite', { name: host })
      : t('Schedule.ShareTitleInvitePlain');
  })();
  const peopleNames = (meeting?.attendees ?? [])
    // The engine pads failed profile lookups with IM placeholder ids.
    .filter(user => user.userId && !/#|not[_-]?found/i.test(user.userId))
    .map(user => user.userName.trim() || user.userId);
  const peopleText = peopleNames.join(t('Schedule.NameSep'));
  const peopleCountText = t('Schedule.AttendeeCount', { count: peopleNames.length });
  const peopleTitle = peopleText ? `${peopleCountText}：${peopleText}` : '';

  const isFirstOpenRunRef = useRef(true);
  useEffect(() => {
    if (isFirstOpenRunRef.current) {
      isFirstOpenRunRef.current = false;
      return;
    }
    if (!open) {
      setCopied('');
    }
  }, [open]);

  async function copyField(kind: string, value: string) {
    if (!value) {
      return;
    }
    try {
      await copyTextToClipboard(value);
      setCopied(kind);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => {
        setCopied('');
      }, 1600);
    } catch {
      setCopied('');
      TUIToast.error(t('Schedule.CopyFailed'));
    }
  }

  const shareText = (() => {
    if (!meeting) {
      return '';
    }
    return formatCopyFields([
      { label: t('Invitation.RoomName'), value: meeting.roomName },
      {
        label: t('Invitation.Time'),
        value: formatScheduleRange(
          meeting.scheduledStartTime,
          meeting.scheduledEndTime,
        ),
      },
      { label: t('Invitation.RoomId'), value: meeting.roomId },
      { label: t('Invitation.Password'), value: meeting.password },
      { label: t('Invitation.Link'), value: link },
    ]);
  })();

  function copyAll() {
    void copyField('all', shareText);
  }

  return (
    <TUIDialog
      open={open}
      title={title}
      width="420px"
      confirmText=""
      cancelText=""
      closable
      closeOnOverlay
      onUpdateOpen={value => onUpdateOpen?.(value)}
      footerSlot={mode !== 'detail'
        ? (
          <TUIButton
            className="cal-share-copy-all"
            variant="primary"
            block
            onClick={copyAll}
          >
            {copied === 'all' ? t('Schedule.ShareCopied') : t('Schedule.ShareCopyAll')}
          </TUIButton>
        )
        : undefined}
    >
      {meeting && (
        <div className={['cal-share-card', mode === 'detail' ? 'is-detail' : ''].filter(Boolean).join(' ')}>
          <div className="cal-share-row">
            <div className="cal-share-label">
              {t('Invitation.RoomName')}
            </div>
            <div className="cal-share-value">
              {meeting.roomName}
            </div>
          </div>
          <div className="cal-share-row">
            <div className="cal-share-label">
              {t('Invitation.Time')}
            </div>
            <div className="cal-share-value">
              {formatScheduleRange(meeting.scheduledStartTime, meeting.scheduledEndTime)}
            </div>
          </div>
          {copyFields.map(field => (
            <div key={field.key} className="cal-share-row">
              <div className="cal-share-label">
                {field.label}
              </div>
              <div className="cal-share-value-row">
                <div className={['cal-share-value', field.key === 'link' ? 'cal-share-link' : ''].filter(Boolean).join(' ')}>
                  {field.value}
                </div>
                <TUIButton
                  className={['cal-share-copy', copied === field.key ? 'is-copied' : ''].filter(Boolean).join(' ')}
                  variant="ghost"
                  size="sm"
                  title={field.copyLabel}
                  aria-label={field.copyLabel}
                  onClick={() => copyField(field.key, field.value)}
                >
                  {copied === field.key ? <IconCheck size={12} /> : <IconCopy size={12} />}
                </TUIButton>
              </div>
            </div>
          ))}
          {mode === 'detail' && (
            <div className="cal-share-row">
              <div className="cal-share-label">
                {t('Schedule.ShareAttendees')}
              </div>
              <div className="cal-share-value cal-share-people-wrap">
                <span
                  className={['cal-share-people', !peopleText ? 'is-empty' : ''].filter(Boolean).join(' ')}
                  title={peopleTitle}
                >
                  {peopleText || t('Schedule.NoScheduledMembers')}
                </span>
                <span className="cal-share-people-count">{peopleCountText}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </TUIDialog>
  );
}

export default ScheduleShareDialog;
