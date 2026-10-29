import type { FormEvent } from 'react';
import {
  IconArrowRight,
  IconCalendar,
  IconCam,
  IconHash,
  TUIButton,
  TUIInput,
  TUIToast,
  useI18n,
} from '@tencentcloud/roomkit-web-react';
import './JoinCard.scss';

export interface JoinCardProps {
  roomId?: string | number | null;
  onUpdateRoomId?: (roomId: string | number | null) => void;
  onCreate?: () => void;
  onSchedule?: () => void;
  onJoin?: (roomId: string) => void;
}

export function JoinCard(props: JoinCardProps) {
  const {
    roomId: roomInput = '',
    onUpdateRoomId,
    onCreate,
    onSchedule,
    onJoin,
  } = props;
  const { t } = useI18n();

  const canJoin = Boolean(roomInput);

  function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = roomInput == null ? '' : String(roomInput).trim();
    if (!id) {
      return;
    }
    if (!/^\d+$/.test(id)) {
      TUIToast.info(t('Preconference.InvalidRoomId'));
      return;
    }
    onJoin?.(id);
  }

  return (
    <section className="join-card">
      <div className="action-buttons">
        <button
          type="button"
          className="action-btn primary"
          onClick={() => onCreate?.()}
        >
          <span className="action-icon"><IconCam size={18} /></span>
          <span className="action-body">
            <strong>{t('Preconference.CreateTitle')}</strong>
            <small>{t('Preconference.CreateSub')}</small>
          </span>
          <span className="action-arrow"><IconArrowRight size={16} /></span>
        </button>
        <button
          type="button"
          className="action-btn"
          onClick={() => onSchedule?.()}
        >
          <span className="action-icon"><IconCalendar size={18} /></span>
          <span className="action-body">
            <strong>{t('Preconference.ScheduleTitle')}</strong>
            <small>{t('Preconference.ScheduleSub')}</small>
          </span>
          <span className="action-arrow"><IconArrowRight size={16} /></span>
        </button>
      </div>
      <div className="divider-text">
        {t('Preconference.OrJoin')}
      </div>
      <form className="join-form" onSubmit={join}>
        <TUIInput
          modelValue={roomInput}
          onUpdateModelValue={value => onUpdateRoomId?.(value)}
          type="number"
          className="join-input-row"
          aria-label={t('Preconference.RoomIdLabel')}
          placeholder={t('Preconference.RoomIdPlaceholder')}
          maxlength={6}
          prefixSlot={(
            <span className="prefix-icon" aria-hidden="true">
              <IconHash size={16} />
            </span>
          )}
          suffixSlot={(
            <TUIButton
              className={['join-submit', canJoin ? 'is-enabled' : ''].filter(Boolean).join(' ')}
              variant={canJoin ? 'primary' : 'secondary'}
              size="sm"
              nativeType="submit"
              disabled={!canJoin}
              aria-label={t('Preconference.Join')}
            >
              <IconArrowRight className="join-arrow" size={16} />
            </TUIButton>
          )}
        />
      </form>
    </section>
  );
}

export default JoinCard;
