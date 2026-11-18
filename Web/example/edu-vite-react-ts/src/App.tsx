import { useEffect, useRef } from 'react';
import { TUIMessageBox, t } from '@tencentcloud/roomkit-web-react';
import { LoginEvent, useLoginState } from 'tuikit-atomicx-react/room';
import { useLocation, useNavigate } from 'react-router-dom';
import { RouterView } from './router/index';
import './App.scss';

const EXIT_OVERLAY_TARGET = 'body';

export function App() {
  const { subscribeEvent, unsubscribeEvent } = useLoginState();
  const navigate = useNavigate();
  const location = useLocation();
  const latestRef = useRef({ navigate, path: location.pathname });
  latestRef.current = { navigate, path: location.pathname };

  useEffect(() => {
    function goToLogin() {
      sessionStorage.removeItem('tuiRoom-userInfo');
      if (latestRef.current.path !== '/login') {
        latestRef.current.navigate('/login', { replace: true });
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
