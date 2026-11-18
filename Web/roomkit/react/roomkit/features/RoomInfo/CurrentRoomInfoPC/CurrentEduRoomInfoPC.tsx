import { useEffect, useState } from 'react';
import { IconChevron, IconInfo, TUIPopover } from '../../../base';
import { useI18n } from '../../../i18n';
import { useRoomElapsed, useRoomIdentity } from './useRoomInfo';
import EduRoomInfoCard from './EduRoomInfoCard';
import './CurrentEduRoomInfoPC.scss';

export interface CurrentEduRoomInfoPCProps {
  roomName?: string;
  inviteUrl?: string;
}

/**
 * Education classroom info chip and card: the chip carries an info mark and a
 * class timer, and the card shows the five class rows (title / time / length /
 * room id / room link) with hover copy buttons, per the design. The meeting
 * variant stays `CurrentRoomInfoPC`.
 */
export function CurrentEduRoomInfoPC(props: CurrentEduRoomInfoPCProps) {
  const { roomName, inviteUrl } = props;
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const { roomId, displayRoomName } = useRoomIdentity(roomName, inviteUrl);
  const elapsed = useRoomElapsed(true);

  useEffect(() => {
    setIsOpen(false);
  }, [roomId]);

  return (
    /* Offset 5 drops the card onto the topbar's bottom edge (34px chip in a 44px bar). */
    <TUIPopover
      open={isOpen}
      placement="bottom-start"
      offset={5}
      padded={false}
      onUpdateOpen={setIsOpen}
      contentSlot={<EduRoomInfoCard roomName={roomName} inviteUrl={inviteUrl} />}
    >
      <div
        className={['edu-room-info', isOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
        role="button"
        tabIndex={0}
        aria-label={t('Education.Info.Sheet')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <IconInfo className="edu-room-info-mark" size={14} />
        <span className="edu-room-info-title" title={displayRoomName}>{displayRoomName}</span>
        {elapsed && <span className="edu-room-info-time" title={t('RoomInfo.Duration')}>{elapsed}</span>}
        <IconChevron className="edu-room-info-caret" size={12} />
      </div>
    </TUIPopover>
  );
}

export default CurrentEduRoomInfoPC;
