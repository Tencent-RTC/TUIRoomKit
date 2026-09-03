import { Button, IconCreateRoom, useUIKit } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import styles from './StartRoomButtonH5.module.scss';

export interface StartRoomButtonH5Props {
  onStartRoom?: () => void;
  className?: string;
}

export function StartRoomButtonH5({ onStartRoom, className }: StartRoomButtonH5Props) {
  const { t } = useUIKit();

  return (
    <div className={classNames(styles.roomButton, className)}>
      <Button
        className={styles.button}
        size="large"
        type="primary"
        icon={<IconCreateRoom />}
        onClick={() => onStartRoom?.()}
      >
        {t('Button.CreateRoom')}
      </Button>
    </div>
  );
}
