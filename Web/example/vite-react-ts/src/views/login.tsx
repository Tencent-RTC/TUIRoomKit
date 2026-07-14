import {
  TUIMessageBox,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { Login, LoginModel } from '@tencentcloud/uikit-base-widget-react';
import { conference } from '@tencentcloud/roomkit-web-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SDKAPPID, genTestUserSig } from '../config/basic-info-config';
import './login.scss';

interface LoginCallbackInfo {
  SDKAppID: number;
  userID: string;
  userSig: string;
}

export default function LoginView() {
  const { theme = 'light', t } = useUIKit();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (userInfo: LoginCallbackInfo) => {
    if (!SDKAPPID) {
      TUIMessageBox.alert({
        title: t('Login.Error'),
        content: t('Login.PleaseConfigureSDKAPPID'),
      });
      return;
    }
    try {
      await conference.login({
        userId: userInfo.userID,
        userSig: userInfo.userSig,
        sdkAppId: userInfo.SDKAppID,
      });
      sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(userInfo));

      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect);
        return;
      }

      const nextParams = new URLSearchParams(searchParams);
      const from = nextParams.get('from');
      nextParams.delete('from');
      const search = nextParams.toString();
      navigate({
        pathname: from || '/home',
        search: search ? `?${search}` : '',
      });
    } catch (error: any) {
      console.error('Login failed:', error?.code);
    }
  };

  return (
    <div className={`login-container ${theme}`}>
      <Login
        className="login-widget"
        SDKAppID={SDKAPPID}
        model={LoginModel.userID}
        generatorUserSig={genTestUserSig}
        onLoginCallback={handleLogin}
      />
    </div>
  );
}
