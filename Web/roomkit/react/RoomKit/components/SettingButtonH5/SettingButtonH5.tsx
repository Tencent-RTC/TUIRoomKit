import { useState } from 'react';
import {
  IconSetting,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { IconButtonH5 } from '../base/IconButtonH5';
import { SettingPopup } from './SettingPopup';

// Vue reference: SettingButtonH5/index.vue.
export function SettingButtonH5() {
  const { t } = useUIKit();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <IconButtonH5 title={t('Settings.Title')} onClick={() => setVisible(true)}>
        <IconSetting size="24" />
      </IconButtonH5>
      {visible && (
        <SettingPopup visible={visible} onVisibleChange={setVisible} />
      )}
    </>
  );
}
