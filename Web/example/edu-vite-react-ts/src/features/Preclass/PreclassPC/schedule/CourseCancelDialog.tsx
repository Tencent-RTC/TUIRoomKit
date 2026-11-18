import { TUIDialog, useI18n } from '@tencentcloud/roomkit-web-react';

interface CourseCancelDialogProps {
  open: boolean;
  busy: boolean;
  onUpdateOpen: (open: boolean) => void;
  onConfirm: () => void;
}

export default function CourseCancelDialog({ open, busy, onUpdateOpen, onConfirm }: CourseCancelDialogProps) {
  const { t } = useI18n();
  return (
    <TUIDialog open={open} width="380px" title={t('Preclass.CancelClass')} confirmText={t('Schedule.CancelConfirm')} cancelText={t('Schedule.CancelThink')} confirmVariant="danger" confirmLoading={busy} cancelDisabled={busy} onUpdateOpen={onUpdateOpen} onConfirm={onConfirm}>
      <p className="preclass-cancel-desc">{t('Preclass.CancelClassDesc')}</p>
    </TUIDialog>
  );
}
