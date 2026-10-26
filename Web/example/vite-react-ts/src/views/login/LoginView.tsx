import { useState } from 'react';
import { TUIMessageBox, UIKitProvider, useUIKit } from '@tencentcloud/uikit-base-component-react';
import { Login, LoginModel } from '@tencentcloud/uikit-base-widget-react';
import { useI18n } from '@tencentcloud/roomkit-web-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SDKAPPID, genTestUserSig } from '../../config/basic-info-config';
import './LoginView.scss';

const LANGUAGE_STORAGE_KEY = 'tuiRoom-language';

// useUIKit reads the UIKitProvider context, so the page body renders inside the provider.
function LoginContent({ initialTheme }: { initialTheme: string }) {
  const { t, theme, language, setLanguage: setUIKitLanguage } = useUIKit();
  const { setLanguage } = useI18n();

  function toggleLanguage() {
    const next = language === 'en-US' ? 'zh-CN' : 'en-US';
    setUIKitLanguage(next);
    setLanguage(next);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (userInfo: { SDKAppID: number; userID: string; userSig: string }) => {
    if (!SDKAPPID) {
      TUIMessageBox.alert({
        title: t('Login.Error'),
        content: t('Login.PleaseConfigureSDKAPPID'),
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
    <div className={['login-container', (typeof theme === 'string' && theme) || initialTheme].join(' ')}>
      <button
        type="button"
        className="login-language"
        onClick={toggleLanguage}
      >
        {language === 'en-US' ? 'English' : '中文'}
      </button>
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

export function LoginView() {
  const [initialTheme] = useState(() => localStorage.getItem('tuiRoom-theme') || 'light');
  const [initialLanguage] = useState(() => localStorage.getItem(LANGUAGE_STORAGE_KEY) || '');

  return (
    <UIKitProvider theme={initialTheme} language={initialLanguage}>
      <LoginContent initialTheme={initialTheme} />
    </UIKitProvider>
  );
}

export default LoginView;
