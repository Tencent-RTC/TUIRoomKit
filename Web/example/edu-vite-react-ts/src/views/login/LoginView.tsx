import { TUIMessageBox, useI18n } from '@tencentcloud/roomkit-web-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SDKAPPID, genTestUserSig } from '../../config/basic-info-config';
import { LoginPage, UserIDLoginForm } from '../../features/Login';
import type { LoginUserInfo } from '../../features/Login';

export function LoginView() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = (userInfo: LoginUserInfo) => {
    if (!SDKAPPID) {
      TUIMessageBox.alert({
        title: t('Login.Error'),
        message: t('Login.PleaseConfigureSDKAPPID'),
      });
      return;
    }
    sessionStorage.setItem('tuiRoom-userInfo', JSON.stringify(userInfo));
    const redirect = searchParams.get('redirect');
    if (redirect) {
      navigate(redirect);
      return;
    }
    const query = new URLSearchParams(searchParams);
    const from = query.get('from');
    query.delete('from');
    const search = query.toString();
    navigate({ pathname: from || '/home', search: search ? `?${search}` : '' });
  };

  return (
    <LoginPage>
      <UserIDLoginForm sdkAppId={SDKAPPID} generateUserSig={genTestUserSig} onLogin={handleLogin} />
    </LoginPage>
  );
}

export default LoginView;
