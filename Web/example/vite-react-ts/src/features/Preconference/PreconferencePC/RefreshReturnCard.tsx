import { IconRefresh, useI18n } from '@tencentcloud/roomkit-web-react';
import './RefreshReturnCard.scss';

export interface RefreshReturnCardProps {
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function RefreshReturnCard(props: RefreshReturnCardProps) {
  const { onConfirm, onCancel } = props;
  const { t } = useI18n();

  return (
    <section
      className="refresh-return-card"
      aria-label={t('RefreshReturn.Title')}
    >
      <div className="refresh-return-head">
        <div className="refresh-return-icon" aria-hidden="true">
          <IconRefresh size={20} />
        </div>
        <div className="refresh-return-body">
          <div className="refresh-return-title">
            {t('RefreshReturn.Title')}
          </div>
          <div className="refresh-return-sub">
            {t('RefreshReturn.Subtitle')}
          </div>
        </div>
      </div>
      <div className="refresh-return-actions">
        <button
          type="button"
          className="refresh-return-btn"
          onClick={() => onCancel?.()}
        >
          {t('RefreshReturn.Cancel')}
        </button>
        <button
          type="button"
          className="refresh-return-btn is-primary"
          onClick={() => onConfirm?.()}
        >
          {t('RefreshReturn.Confirm')}
        </button>
      </div>
    </section>
  );
}

export default RefreshReturnCard;
