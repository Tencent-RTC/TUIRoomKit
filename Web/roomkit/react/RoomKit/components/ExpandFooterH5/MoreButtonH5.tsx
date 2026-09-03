import {
  IconExpand,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import { IconButtonH5 } from '../base/IconButtonH5';
import styles from './MoreButtonH5.module.scss';

export interface MoreButtonH5Props {
  showMoreMenu: boolean;
  onToggleMoreMenu: (nextValue: boolean) => void;
}

// Vue reference: ExpandFooterH5/MoreButton.vue — apply 33px width on the
// IconButtonH5 itself (not a wrapper), so layout math matches MORE_BUTTON_WIDTH.
export function MoreButtonH5({ showMoreMenu, onToggleMoreMenu }: MoreButtonH5Props) {
  const { t } = useUIKit();
  return (
    <IconButtonH5
      title={t('RoomMore.Title')}
      customStyle={{ width: 33, height: 52 }}
      onClick={() => onToggleMoreMenu(!showMoreMenu)}
    >
      <span
        className={classNames(styles.iconContainer, {
          [styles.iconRotate]: showMoreMenu,
        })}
      >
        <IconExpand size="24" />
      </span>
    </IconButtonH5>
  );
}
