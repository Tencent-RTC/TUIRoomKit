import { TUIAvatar, TUIButton, TUIDialog, useI18n } from '@tencentcloud/roomkit-web-react';
import type { IncomingInvitation } from './useRoomInvitation';
import './RoomInvitation.scss';

export interface RoomInvitationProps {
  invitation?: IncomingInvitation | null;
  countdown?: number;
  onAccept?: () => void;
  onReject?: () => void;
}

function formatRoomId(roomId: string) {
  return roomId.replace(/(\d{3})(?=\d)/g, '$1 ');
}

export function RoomInvitation(props: RoomInvitationProps) {
  const { invitation, onAccept, onReject } = props;
  const { t } = useI18n();

  const open = Boolean(invitation);
  const countdown = props.countdown ?? 0;
  const formattedRoomId = formatRoomId(invitation?.roomId ?? '');

  return (
    <TUIDialog
      open={open}
      width="340px"
      closable={false}
      closeOnOverlay={false}
      closeOnEsc={false}
      confirmText=""
      cancelText=""
      headerSlot={(
        <div className="room-invitation-head">
          <span className="room-invitation-avatar">
            <TUIAvatar
              src={invitation?.inviterAvatar}
              alt={invitation?.inviterName}
              size={46}
            />
          </span>
          <div className="room-invitation-who">
            <div className="room-invitation-name">
              {invitation?.inviterName}
            </div>
            <div className="room-invitation-sub">
              {t('RoomInvitation.Subtitle')}
            </div>
          </div>
        </div>
      )}
      footerSlot={(
        <>
          <TUIButton
            className="room-invitation-reject"
            variant="secondary"
            onClick={() => onReject?.()}
          >
            {t('RoomInvitation.Reject')}
            {countdown > 0 && (
              <span className="room-invitation-cd"> ({countdown}s)</span>
            )}
          </TUIButton>
          <TUIButton
            className="room-invitation-accept"
            variant="primary"
            onClick={() => onAccept?.()}
          >
            {t('RoomInvitation.Accept')}
          </TUIButton>
        </>
      )}
    >
      <div className="room-invitation-meta">
        <div className="room-invitation-row">
          <span>{t('RoomInvitation.Topic')}</span>
          <b>{invitation?.roomName}</b>
        </div>
        <div className="room-invitation-row">
          <span>{t('RoomInvitation.Id')}</span>
          <b>{formattedRoomId}</b>
        </div>
      </div>
    </TUIDialog>
  );
}

export default RoomInvitation;
