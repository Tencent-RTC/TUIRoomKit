import { useEffect, useRef } from 'react';
import { TUIMessageBox, t, useI18n } from '@tencentcloud/roomkit-web-react';
import { LoginEvent, useLoginState } from 'tuikit-atomicx-react/room';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouterView } from './router/index';
import './App.scss';

const EXIT_OVERLAY_TARGET = 'body';

export function App() {
  const { setLanguage } = useI18n();
  const { subscribeEvent, unsubscribeEvent } = useLoginState();
  const navigate = useNavigate();
  const location = useLocation();
  const languageInitRef = useRef(false);

  if (!languageInitRef.current) {
    languageInitRef.current = true;
    const savedLanguage = localStorage.getItem('tuiRoom-language') || '';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }

  const latestRef = useRef({ navigate, path: location.pathname });
  latestRef.current = { navigate, path: location.pathname };

  useEffect(() => {
    function goToLogin() {
      sessionStorage.removeItem('tuiRoom-userInfo');
      if (latestRef.current.path !== '/login') {
        latestRef.current.navigate({ pathname: '/login' }, { replace: true });
      }
    }

    function onLoginExpired() {
      TUIMessageBox.alert({
        title: t('Login.Expired'),
        message: t('Login.ExpiredDescription'),
        appendTo: EXIT_OVERLAY_TARGET,
      });
      goToLogin();
    }

    function onKickedOffline() {
      TUIMessageBox.alert({
        title: t('Login.KickedOffline'),
        message: t('Login.KickedOfflineDescription'),
        appendTo: EXIT_OVERLAY_TARGET,
      });
      goToLogin();
    }

    subscribeEvent(LoginEvent.onLoginExpired, onLoginExpired);
    subscribeEvent(LoginEvent.onKickedOffline, onKickedOffline);
    return () => {
      unsubscribeEvent(LoginEvent.onLoginExpired, onLoginExpired);
      unsubscribeEvent(LoginEvent.onKickedOffline, onKickedOffline);
    };
  }, []);

  return (
    <div id="app">
      <RouterView />
    </div>
  );
}

export default App;
