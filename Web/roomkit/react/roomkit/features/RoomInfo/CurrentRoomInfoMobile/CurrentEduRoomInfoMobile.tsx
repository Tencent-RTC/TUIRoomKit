import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { IconChevron, TUIPopover, TUIPopup } from '../../../base';
import { useI18n } from '../../../i18n';
import { useRoomElapsed, useRoomIdentity } from '../CurrentRoomInfoPC/useRoomInfo';
import EduRoomInfoCard from '../CurrentRoomInfoPC/EduRoomInfoCard';
import './CurrentEduRoomInfoMobile.scss';

export interface CurrentEduRoomInfoMobileProps {
  roomName?: string;
  inviteUrl?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Education H5 classroom chip. Landscape opens the classroom card under the name.
 * Portrait opens the classroom sheet. The meeting chip stays `CurrentRoomInfoMobile`.
 */
export function CurrentEduRoomInfoMobile(props: CurrentEduRoomInfoMobileProps) {
  const { roomName, inviteUrl, orientation } = props;
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const { roomId, displayRoomName } = useRoomIdentity(roomName, inviteUrl);
  const duration = useRoomElapsed(true);

  useEffect(() => {
    setIsOpen(false);
  }, [orientation, roomId]);

  function onChipKeyDown(event: KeyboardEvent<HTMLDivElement>, press: () => void) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    press();
  }

  const chipContent = (
    <>
      <span className="current-room-info-mobile-title">{displayRoomName}</span>
      {duration && <span className="current-room-info-mobile-time">{duration}</span>}
      <IconChevron className="current-room-info-mobile-caret" size={12} />
    </>
  );

  // Landscape drops the classroom card under the name. Portrait uses the sheet.
  if (orientation === 'landscape') {
    return (
      <TUIPopover
        open={isOpen}
        placement="bottom-start"
        offset={5}
        padded={false}
        onUpdateOpen={setIsOpen}
        contentSlot={<EduRoomInfoCard roomName={roomName} inviteUrl={inviteUrl} />}
      >
        <div
          className={['current-room-info-mobile', 'is-edu', 'is-landscape', isOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
          role="button"
          tabIndex={0}
          aria-label={t('Education.Info.Sheet')}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onKeyDown={event => onChipKeyDown(event, () => (event.currentTarget as HTMLElement).click())}
        >
          {chipContent}
        </div>
      </TUIPopover>
    );
  }

  return (
    <>
      <div
        className={['current-room-info-mobile', 'is-edu', isOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
        role="button"
        tabIndex={0}
        aria-label={t('Education.Info.Sheet')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={event => onChipKeyDown(event, () => setIsOpen(!isOpen))}
      >
        {chipContent}
      </div>

      <TUIPopup
        open={isOpen}
        height="auto"
        onUpdateOpen={setIsOpen}
        headerSlot={(
          <div className="edu-room-info-sheet-title">
            {t('Education.Info.Sheet')}
          </div>
        )}
      >
        <EduRoomInfoCard plain roomName={roomName} inviteUrl={inviteUrl} />
      </TUIPopup>
    </>
  );
}

export default CurrentEduRoomInfoMobile;
