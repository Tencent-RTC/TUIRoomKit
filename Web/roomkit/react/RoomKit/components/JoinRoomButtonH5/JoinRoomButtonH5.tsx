import { Button, IconEnterRoom, useUIKit } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import styles from './JoinRoomButtonH5.module.scss';

export interface JoinRoomButtonH5Props {
  onJoinRoom?: () => void;
  className?: string;
}

export function JoinRoomButtonH5({ onJoinRoom, className }: JoinRoomButtonH5Props) {
  const { t } = useUIKit();

  return (
    <div className={classNames(styles.roomButton, className)}>
      <Button
        className={styles.button}
        size="large"
        type="primary"
        icon={<IconEnterRoom />}
        onClick={() => onJoinRoom?.()}
      >
        {t('Button.JoinRoom')}
      </Button>
    </div>
  );
}
