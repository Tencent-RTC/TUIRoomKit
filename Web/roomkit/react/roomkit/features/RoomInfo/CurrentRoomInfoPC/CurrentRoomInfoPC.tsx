import { useEffect, useRef, useState } from 'react';
import { useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import { IconCheck, IconChevron, IconClose, IconCopy, TUIPopover, resolveShareLink } from '../../../base';
import { useI18n } from '../../../i18n';
import { copyTextToClipboard, formatCopyFields } from '../../../utils/clipboard';
import './CurrentRoomInfoPC.scss';

export interface CurrentRoomInfoPCProps {
  narrow?: boolean;
  roomName?: string;
  inviteUrl?: string;
}

const COPY_RESET_MS = 1800;
const INVITE_COPY_RESET_MS = 2000;

export function CurrentRoomInfoPC(props: CurrentRoomInfoPCProps) {
  const { narrow, roomName, inviteUrl } = props;
  const { t } = useI18n();
  const { currentRoom } = useRoomState();
  const { loginUserInfo } = useLoginState();

  const [isOpen, setIsOpen] = useState(false);
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  const [copyError, setCopyError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const resetTimersRef = useRef(new Map<string, number>()).current;

  useEffect(() => {
    const clock = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(clock);
      resetTimersRef.forEach(window.clearTimeout);
      resetTimersRef.clear();
      setCopiedKeys(new Set());
    };
  }, [resetTimersRef]);

  const roomId = currentRoom?.roomId ?? '';
  const displayRoomName = currentRoom?.roomName || roomName || '';
  const password = currentRoom?.password ?? '';
  const owner = currentRoom?.roomOwner;
  const ownerName = (() => {
    const name = owner?.userName || owner?.userId || '—';
    return owner?.userId && owner.userId === loginUserInfo?.userId
      ? `${name}${t('RoomInfo.Me')}`
      : name;
  })();
  const ownerInitial = (owner?.userName || owner?.userId || '').trim().slice(0, 1).toUpperCase() || '?';
  const resolvedInviteUrl = (() => {
    if (inviteUrl) return inviteUrl;
    if (!roomId) return '';
    return resolveShareLink(roomId) ?? window.location.href;
  })();
  const duration = (() => {
    const start = currentRoom?.createTime;
    const seconds = start ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
    const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
    if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
    return parts.map(value => String(value).padStart(2, '0')).join(':');
  })();
  const fields = [
    {
      key: 'id',
      label: t('Invitation.RoomId'),
      value: roomId.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3'),
      raw: roomId,
    },
    ...(password
      ? [{ key: 'password', label: t('Invitation.Password'), value: password, raw: password }]
      : []),
    ...(resolvedInviteUrl
      ? [{
        key: 'link',
        label: t('Invitation.Link'),
        value: resolvedInviteUrl.replace(/^https?:\/\//, ''),
        raw: resolvedInviteUrl,
      }]
      : []),
  ];
  const invitationText = formatCopyFields([
    { label: t('Invitation.RoomName'), value: displayRoomName },
    ...fields.map(field => ({ label: field.label, value: field.raw })),
  ]);

  async function copy(key: string) {
    const text = key === 'invitation'
      ? invitationText
      : fields.find(field => field.key === key)?.raw;
    if (!text) return;
    try {
      await copyTextToClipboard(text);
    } catch {
      setCopyError(t('RoomInfo.CopyFailed'));
      return;
    }
    setCopyError('');
    setCopiedKeys(prev => new Set(prev).add(key));
    window.clearTimeout(resetTimersRef.get(key));
    resetTimersRef.set(key, window.setTimeout(() => {
      setCopiedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      resetTimersRef.delete(key);
    }, key === 'invitation' ? INVITE_COPY_RESET_MS : COPY_RESET_MS));
  }

  const roomIdFirstRunRef = useRef(true);
  useEffect(() => {
    if (roomIdFirstRunRef.current) {
      roomIdFirstRunRef.current = false;
      return;
    }
    setIsOpen(false);
    setCopyError('');
    resetTimersRef.forEach(clearTimeout);
    resetTimersRef.clear();
    setCopiedKeys(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return (
    <TUIPopover
      open={isOpen}
      placement="bottom-start"
      offset={6}
      padded={false}
      onUpdateOpen={setIsOpen}
      contentSlot={(
        <section
          className={['room-info-card', narrow ? 'is-narrow' : ''].filter(Boolean).join(' ')}
          role="dialog"
          aria-label={t('RoomInfo.Details')}
        >
          <header className="room-info-card-header">
            <h2 title={displayRoomName}>
              {displayRoomName}
            </h2>
            <button
              className="room-info-card-close"
              type="button"
              aria-label={t('RoomInfo.Close')}
              onClick={() => setIsOpen(false)}
            >
              <IconClose size={12} />
            </button>
          </header>
          <div className="room-info-card-body">
            <div className="room-info-card-fields">
              {fields.map(field => (
                <div
                  key={field.key}
                  className="room-info-card-field"
                >
                  <span className="room-info-card-label">{field.label}</span>
                  <span
                    className={['room-info-card-value', field.key === 'link' ? 'link' : 'num'].join(' ')}
                    title={field.raw}
                  >
                    {field.value || '—'}
                  </span>
                  {field.raw && (
                    <button
                      className={[
                        'room-info-card-icon',
                        copiedKeys.has(field.key) ? 'is-copied' : '',
                      ].filter(Boolean).join(' ')}
                      type="button"
                      aria-label={t('RoomInfo.Copy', { field: field.label })}
                      title={t('RoomInfo.Copy', { field: field.label })}
                      onClick={() => {
                        void copy(field.key);
                      }}
                    >
                      {copiedKeys.has(field.key)
                        ? (
                          <IconCheck
                            key={`check-${field.key}`}
                            className="room-info-card-check"
                            size={12}
                          />
                        )
                        : <IconCopy key={`copy-${field.key}`} size={12} />}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="room-info-card-host">
              <span className="room-info-card-avatar">
                {owner?.avatarUrl
                  ? <img src={owner.avatarUrl} alt="" />
                  : <span>{ownerInitial}</span>}
              </span>
              <div className="room-info-card-host-info">
                <div className="room-info-card-host-name" title={ownerName}>
                  {ownerName}
                </div>
                <div className="room-info-card-host-label">
                  {t('RoomInfo.Host')}
                </div>
              </div>
            </div>
            <button
              className={['room-info-card-copy', copiedKeys.has('invitation') ? 'is-copied' : ''].filter(Boolean).join(' ')}
              type="button"
              disabled={!roomId}
              onClick={() => {
                void copy('invitation');
              }}
            >
              {copiedKeys.has('invitation')
                ? (
                  <IconCheck
                    key="check-invitation"
                    className="room-info-card-check"
                    size={12}
                  />
                )
                : <IconCopy key="copy-invitation" size={12} />}
              <span className="room-info-card-button-label">
                {t(
                  copiedKeys.has('invitation')
                    ? 'RoomInfo.Copied'
                    : 'RoomInfo.Invitation',
                )}
              </span>
            </button>
            {copyError && (
              <p className="room-info-card-error" role="alert">
                {copyError}
              </p>
            )}
            <span className="room-info-card-announcement" role="status">
              {copiedKeys.size ? t('RoomInfo.Copied') : ''}
            </span>
          </div>
        </section>
      )}
    >
      <div
        className={[
          'current-room-info',
          isOpen ? 'is-open' : '',
          narrow ? 'is-narrow' : '',
        ].filter(Boolean).join(' ')}
        role="button"
        tabIndex={0}
        aria-label={t('RoomInfo.Details')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="current-room-info-title" title={displayRoomName}>
          {displayRoomName}
        </span>
        <span className="current-room-info-time" title={t('RoomInfo.Duration')}>
          {duration}
        </span>
        <IconChevron className="current-room-info-caret" size={12} />
      </div>
    </TUIPopover>
  );
}

export default CurrentRoomInfoPC;
