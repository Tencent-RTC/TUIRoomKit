import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  TUIMessageBox,
  UIKitProvider,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import {
  RoomEvent,
  conference,
  useRoomInvitation,
} from '@tencentcloud/roomkit-web-react';
import AppRouter from '@/router';
import '@/styles/base.scss';

const InnerApp = () => {
  const { t } = useUIKit();
  const navigate = useNavigate();
  const location = useLocation();
  const bootstrappedRef = useRef(false);

  const roomInvitation = useRoomInvitation({
    onAcceptCall: ({ roomId, password, roomType }) => {
      const search = new URLSearchParams();
      search.set('roomId', roomId);
      if (password) search.set('password', password);
      if (roomType !== undefined && roomType !== null) {
        search.set('roomType', String(roomType));
      }
      navigate(`/room?${search.toString()}`);
    },
  });

  useEffect(() => {
    const onLoginExpired = () => {
      TUIMessageBox.alert({
        title: t('Login.Expired'),
        content: t('Login.ExpiredDescription'),
      });
      navigate('/login', { replace: true });
    };
    const onKickedOffline = () => {
      TUIMessageBox.alert({
        title: t('Login.KickedOffline'),
        content: t('Login.KickedOfflineDescription'),
      });
      navigate('/login', { replace: true });
    };
    conference.on(RoomEvent.USER_SIG_EXPIRED, onLoginExpired);
    conference.on(RoomEvent.KICKED_OFFLINE, onKickedOffline);
    return () => {
      conference.off(RoomEvent.USER_SIG_EXPIRED, onLoginExpired);
      conference.off(RoomEvent.KICKED_OFFLINE, onKickedOffline);
    };
  }, [navigate, t]);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    if (location.pathname === '/login') return;

    const storedData = sessionStorage.getItem('tuiRoom-userInfo') || '{}';
    const userInfo = JSON.parse(storedData);
    if (!userInfo?.userID) return;

    conference
      .login({
        userId: userInfo.userID,
        userSig: userInfo.userSig,
        sdkAppId: userInfo.SDKAppID,
      })
      .catch((error: any) => {
        console.error('Login failed:', error);
        sessionStorage.removeItem('tuiRoom-userInfo');
        const redirect = encodeURIComponent(
          `${location.pathname}${location.search}`
        );
        navigate(`/login?redirect=${redirect}`, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="app">
      <AppRouter />
      {roomInvitation}
    </div>
  );
};

export default function App() {
  const [initialTheme] = useState(
    () => localStorage.getItem('tuiRoom-theme') || 'light'
  );
  const [initialLanguage] = useState(
    () => localStorage.getItem('tuiRoom-language') || ''
  );

  return (
    <UIKitProvider
      theme={initialTheme as any}
      language={initialLanguage as any}
    >
      <InnerApp />
    </UIKitProvider>
  );
}
