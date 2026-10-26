import { IconCaptionMobile } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';

export interface CaptionEntryMobileProps {
  active?: boolean;
  onClick?: () => void;
}

export function CaptionEntryMobile({ active = false, onClick }: CaptionEntryMobileProps) {
  const { t } = useI18n();

  return (
    <ToolbarButtonMobile
      label={t('AITools.Entry')}
      active={active}
      pressed={active}
      onClick={onClick}
    >
      <IconCaptionMobile size={20} />
    </ToolbarButtonMobile>
  );
}

export default CaptionEntryMobile;
