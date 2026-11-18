import { useRoomState } from 'tuikit-atomicx-react/room';
import { IconCheck, IconCopy } from '../../../base';
import { useI18n } from '../../../i18n';
import { formatRoomId, useRoomIdentity, useRoomInfoCopy } from './useRoomInfo';
import './EduRoomInfoCard.scss';

export interface EduRoomInfoCardProps {
  roomName?: string;
  inviteUrl?: string;
  /** H5 portrait sheet: larger rows and copy targets. The popup owns the surface. */
  plain?: boolean;
}

/**
 * Classroom detail card shared by the PC popover, the education H5 landscape
 * dropdown, and the portrait sheet: title, time, length, room id, and room link.
 */
export function EduRoomInfoCard(props: EduRoomInfoCardProps) {
  const { roomName, inviteUrl: inviteUrlProp, plain = false } = props;
  const { t, language } = useI18n();
  const { currentRoom } = useRoomState();
  const { roomId, displayRoomName, shareLink: inviteUrl } = useRoomIdentity(roomName, inviteUrlProp);
  const { copiedKeys, copyError, copy: copyValue } = useRoomInfoCopy(roomId);

  const copyIconSize = plain ? 16 : 12;
  const groupedRoomId = formatRoomId(roomId);

  const scheduledStart = currentRoom?.scheduledStartTime;
  const scheduledEnd = currentRoom?.scheduledEndTime;
  const scheduledRange = scheduledStart && scheduledEnd
    ? { start: scheduledStart * 1000, end: scheduledEnd * 1000 }
    : null;
  const classStartMs = scheduledRange?.start ?? currentRoom?.createTime ?? 0;

  /** `2026/10/28 周三 15:49 – 16:34`; an ad-hoc class drops the end. */
  let classWhen = '—';
  if (classStartMs) {
    const date = new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(classStartMs).replace(/-/g, '/');
    const weekday = new Intl.DateTimeFormat(language, { weekday: 'short' }).format(classStartMs);
    const clockFormat = new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const begin = clockFormat.format(classStartMs);
    classWhen = scheduledRange
      ? `${date} ${weekday} ${begin} – ${clockFormat.format(scheduledRange.end)}`
      : `${date} ${weekday} ${begin}`;
  }

  const classDurationText = scheduledRange
    ? t('Education.Info.Minutes', { count: Math.round((scheduledRange.end - scheduledRange.start) / 60_000) })
    : '—';

  function copy(key: 'id' | 'link') {
    const text = key === 'id' ? roomId : inviteUrl;
    if (text) {
      void copyValue(key, text);
    }
  }

  function renderCopyButton(key: 'id' | 'link', copiedLabel: string, copyLabel: string) {
    const isCopied = copiedKeys.has(key);
    return (
      <button
        className={['edu-room-info-copy', isCopied ? 'is-copied' : ''].filter(Boolean).join(' ')}
        type="button"
        aria-label={isCopied ? copiedLabel : copyLabel}
        onClick={() => copy(key)}
      >
        {isCopied ? <IconCheck size={copyIconSize} /> : <IconCopy size={copyIconSize} />}
      </button>
    );
  }

  return (
    <section
      className={['edu-room-info-card', plain ? 'is-plain' : ''].filter(Boolean).join(' ')}
      role="dialog"
      aria-label={t('Education.Info.Sheet')}
    >
      <div className="edu-room-info-rows">
        <div className="edu-room-info-row">
          <span className="edu-room-info-label">{t('Education.Info.Title')}</span>
          <span className="edu-room-info-value" title={displayRoomName}>
            {displayRoomName || t('Education.Info.Untitled')}
          </span>
        </div>
        <div className="edu-room-info-row">
          <span className="edu-room-info-label">{t('Education.Info.Time')}</span>
          <span className="edu-room-info-value">{classWhen}</span>
        </div>
        <div className="edu-room-info-row">
          <span className="edu-room-info-label">{t('Education.Info.Duration')}</span>
          <span className="edu-room-info-value">{classDurationText}</span>
        </div>
        <div className="edu-room-info-row">
          <span className="edu-room-info-label">{t('Education.Info.RoomId')}</span>
          <div className="edu-room-info-copyable">
            <span className="edu-room-info-value">{groupedRoomId}</span>
            {renderCopyButton('id', t('Education.Info.RoomIdCopied'), t('Education.Info.CopyRoomId'))}
          </div>
        </div>
        <div className="edu-room-info-row">
          <span className="edu-room-info-label">{t('Education.Info.RoomLink')}</span>
          <div className="edu-room-info-copyable">
            <span className="edu-room-info-value edu-room-info-clip" title={inviteUrl}>{inviteUrl}</span>
            {renderCopyButton('link', t('Education.Info.RoomLinkCopied'), t('Education.Info.CopyRoomLink'))}
          </div>
        </div>
      </div>
      {copyError && (
        <p className="edu-room-info-error" role="alert">
          {copyError}
        </p>
      )}
    </section>
  );
}

export default EduRoomInfoCard;
