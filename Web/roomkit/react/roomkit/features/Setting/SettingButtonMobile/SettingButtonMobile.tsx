import { IconSettings } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile';

export interface SettingButtonMobileProps {
  onClick?: () => void;
}

export function SettingButtonMobile(props: SettingButtonMobileProps) {
  const { onClick } = props;
  const { t } = useI18n();

  return (
    <ToolbarButtonMobile label={t('Settings.Title')} onClick={() => onClick?.()}>
      <IconSettings size={20} />
    </ToolbarButtonMobile>
  );
}

export default SettingButtonMobile;
