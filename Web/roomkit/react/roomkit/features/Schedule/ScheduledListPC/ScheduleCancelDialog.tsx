import { TUIButton, TUIDialog } from '../../../base';
import { useI18n } from '../../../i18n';
import './ScheduleCancelDialog.scss';

export interface ScheduleCancelDialogProps {
  open: boolean;
  busy?: boolean;
  onUpdateOpen?: (open: boolean) => void;
  onConfirm?: () => void;
}

export function ScheduleCancelDialog(props: ScheduleCancelDialogProps) {
  const { open, busy, onUpdateOpen, onConfirm } = props;
  const { t } = useI18n();

  return (
    <TUIDialog
      open={open}
      title={t('Schedule.CancelRoom')}
      width="380px"
      confirmText=""
      cancelText=""
      closeOnOverlay={!busy}
      closeOnEsc={!busy}
      onUpdateOpen={value => onUpdateOpen?.(value)}
      footerSlot={(
        <div className="cal-cancel-actions">
          <TUIButton
            className="cal-cancel-button"
            variant="secondary"
            disabled={busy}
            onClick={() => onUpdateOpen?.(false)}
          >
            {t('Schedule.CancelThink')}
          </TUIButton>
          <TUIButton
            className="cal-cancel-button is-primary"
            variant="primary"
            disabled={busy}
            onClick={() => onConfirm?.()}
          >
            {t('Schedule.CancelConfirm')}
          </TUIButton>
        </div>
      )}
    >
      <p className="cal-cancel-desc">
        {t('Schedule.CancelRoomDesc')}
      </p>
    </TUIDialog>
  );
}

export default ScheduleCancelDialog;
