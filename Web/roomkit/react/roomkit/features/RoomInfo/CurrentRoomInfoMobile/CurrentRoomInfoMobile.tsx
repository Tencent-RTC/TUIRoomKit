import { useEffect, useRef, useState } from 'react';
import { useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import { IconCheck, IconChevron, IconCopy, TUIButton, TUIPopup, resolveShareLink } from '../../../base';
import { useI18n } from '../../../i18n';
import { copyTextToClipboard, formatCopyFields } from '../../../utils/clipboard';
import './CurrentRoomInfoMobile.scss';

export interface CurrentRoomInfoMobileProps {
  roomName?: string;
  inviteUrl?: string;
}

const COPY_RESET_MS = 1800;
const INVITE_COPY_RESET_MS = 2000;

export function CurrentRoomInfoMobile(props: CurrentRoomInfoMobileProps) {
  const { roomName, inviteUrl } = props;
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
  const ownerName = (() => {
    const owner = currentRoom?.roomOwner;
    const name = owner?.userName || owner?.userId || '—';
    return owner?.userId && owner.userId === loginUserInfo?.userId
      ? `${name}${t('RoomInfo.Me')}`
      : name;
  })();
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
    { key: 'id', label: t('Invitation.RoomId'), raw: roomId },
    ...(password ? [{ key: 'password', label: t('Invitation.Password'), raw: password }] : []),
    ...(resolvedInviteUrl ? [{ key: 'link', label: t('Invitation.Link'), raw: resolvedInviteUrl }] : []),
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
    <>
      <div
        className={['current-room-info-mobile', isOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
        role="button"
        tabIndex={0}
        aria-label={t('RoomInfo.Details')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="current-room-info-mobile-title">{displayRoomName}</span>
        <span className="current-room-info-mobile-time">{duration}</span>
        <IconChevron className="current-room-info-mobile-caret" size={11} />
      </div>

      <TUIPopup
        open={isOpen}
        height="auto"
        onUpdateOpen={setIsOpen}
        headerSlot={(
          <div className="room-info-sheet-head">
            <div className="room-info-sheet-name">
              {displayRoomName}
            </div>
            <div className="room-info-sheet-divider" />
          </div>
        )}
        footerSlot={(
          <div className="room-info-sheet-footer">
            <TUIButton
              className={['room-info-sheet-invite', copiedKeys.has('invitation') ? 'is-copied' : ''].filter(Boolean).join(' ')}
              variant="primary"
              size="lg"
              block
              icon={copiedKeys.has('invitation') ? IconCheck : undefined}
              disabled={!roomId}
              onClick={() => {
                void copy('invitation');
              }}
            >
              {t(copiedKeys.has('invitation') ? 'RoomInfo.Copied' : 'RoomInfo.Invitation')}
            </TUIButton>
          </div>
        )}
      >
        <div className="room-info-sheet-fields">
          <div className="room-info-sheet-row">
            <span className="room-info-sheet-label">{t('RoomInfo.Host')}</span>
            <span className="room-info-sheet-value">{ownerName}</span>
          </div>
          {fields.map(field => (
            <div key={field.key} className="room-info-sheet-row">
              <span className="room-info-sheet-label">{field.label}</span>
              <span className="room-info-sheet-value" title={field.raw}>{field.raw || '—'}</span>
              {field.raw && (
                <button
                  className={[
                    'room-info-sheet-copy',
                    copiedKeys.has(field.key) ? 'is-copied' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  aria-label={t('RoomInfo.Copy', { field: field.label })}
                  onClick={() => {
                    void copy(field.key);
                  }}
                >
                  {copiedKeys.has(field.key) ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </button>
              )}
            </div>
          ))}
        </div>
        {copyError && (
          <p className="room-info-sheet-error" role="alert">
            {copyError}
          </p>
        )}
      </TUIPopup>
    </>
  );
}

export default CurrentRoomInfoMobile;
