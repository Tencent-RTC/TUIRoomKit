import { useState } from 'react';
import {
  IconCaretDownSmall,
  Popup,
  Toast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { Avatar, useLoginState } from 'tuikit-atomicx-react/room';
import { PopUpArrowDown } from '../base/PopUpArrowDown';
import styles from './LoginUserInfoH5.module.scss';

export interface LoginUserInfoH5Props {
  showLogout?: boolean;
  onLogout?: () => void;
}

export function LoginUserInfoH5({ showLogout = true, onLogout }: LoginUserInfoH5Props) {
  const { t } = useUIKit();
  const { loginUserInfo, logout } = useLoginState();
  const [popupVisible, setPopupVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('tuiRoom-userInfo');
      Toast.success({ message: t('LoginUserInfo.LogoutSuccess') });
      onLogout?.();
    } catch (_error) {
      Toast.error({ message: t('LoginUserInfo.LogoutFailed') });
    }
  };

  return (
    <>
      <div className={styles.loginUserInfo}>
        {showLogout ? (
          <div
            className={styles.trigger}
            onClick={() => setPopupVisible(true)}
          >
            <Avatar src={loginUserInfo?.avatarUrl} size={28} />
            <span className={styles.userId}>
              {loginUserInfo?.userName || loginUserInfo?.userId}
            </span>
            <IconCaretDownSmall size="24" />
          </div>
        ) : (
          <div className={styles.trigger}>
            <Avatar src={loginUserInfo?.avatarUrl} size={28} />
            <span className={styles.userId}>
              {loginUserInfo?.userName || loginUserInfo?.userId}
            </span>
          </div>
        )}
      </div>

      <Popup
        visible={popupVisible}
        onUpdateVisible={setPopupVisible}
        customStyle={{ width: '100vw' }}
      >
        <PopUpArrowDown onClick={() => setPopupVisible(false)} />
        <div className={styles.logoutPopup} onClick={handleLogout}>
          {t('LoginUserInfo.Logout')}
        </div>
      </Popup>
    </>
  );
}
