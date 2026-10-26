import { IconSettings } from '../../../base';
import { useI18n } from '../../../i18n';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC';

export interface SettingButtonPCProps {
  /** The dialog lives in the shell, so its open state arrives as a prop */
  active?: boolean;
  onClick?: () => void;
}

export function SettingButtonPC(props: SettingButtonPCProps) {
  const { active = false, onClick } = props;
  const { t } = useI18n();

  return (
    <ToolbarButtonPC
      label={t('Settings.Title')}
      icon={IconSettings}
      active={active}
      onClick={() => onClick?.()}
    />
  );
}

export default SettingButtonPC;
