import { ComponentType, lazy, Suspense, useEffect, useRef } from 'react';
import {
  Navigate,
  useBlocker,
  useLocation,
  type RouteObject,
} from 'react-router-dom';
import {
  TUIMessageBox,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import {
  LoginStatus,
  useLoginState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { isPC } from '@/utils/utils';

const Login = lazy(() => import('@/views/login'));
const Home = lazy(
  () => import('@/views/home') as Promise<{ default: ComponentType<any> }>
);
const Room = lazy(
  () => import('@/views/room') as Promise<{ default: ComponentType<any> }>
);
const HomeH5 = lazy(
  () => import('@/views/homeH5') as Promise<{ default: ComponentType<any> }>
);
const RoomH5 = lazy(
  () => import('@/views/roomH5') as Promise<{ default: ComponentType<any> }>
);

/**
 * Demo-layer leave confirmation — mirrors Vue demo `router.beforeEach`:
 * leaving `/room` while still in a room requires confirm; cancel stays on
 * `/room` (blocker.reset); confirm calls leaveRoom then proceed.
 *
 * Vue reads live `currentRoom.value` inside beforeEach — after endRoom/
 * leaveRoom the room is already null, so navigate home skips the confirm.
 * Access `room.currentRoom` via the getter (do not destructure) so the
 * blocker sees the live store value, not a stale render snapshot.
 *
 * Requires `createHashRouter` + `RouterProvider` (see main.tsx).
 */
export const useLeaveRoomGuard = () => {
  const { t } = useUIKit();
  const room = useRoomState();
  const confirmingRef = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname === '/room' &&
      nextLocation.pathname !== '/room' &&
      !!room.currentRoom?.roomId,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked' || confirmingRef.current) {
      return;
    }

    // RoomKit leave/end may clear currentRoom after the blocker decision but
    // before this effect runs (same as Vue: if (!currentRoom) next()).
    if (!room.currentRoom?.roomId) {
      blocker.proceed();
      return;
    }

    confirmingRef.current = true;

    TUIMessageBox.confirm({
      type: 'warning',
      title: t('Room.LeaveRoomTitle'),
      content: t('Room.ConfirmLeavePage'),
      callback: async (action?: string) => {
        confirmingRef.current = false;
        if (action === 'confirm') {
          try {
            await room.leaveRoom();
          } catch {
            // still leave the page
          }
          blocker.proceed();
        } else {
          blocker.reset();
        }
      },
    });
  }, [blocker, room, t]);
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const { loginUserInfo, status } = useLoginState();

  if (loginUserInfo?.userId) {
    return children;
  }

  const hasBootstrapCredential = !!sessionStorage.getItem('tuiRoom-userInfo');
  if (
    status === LoginStatus.LOADING ||
    (status === LoginStatus.IDLE && hasBootstrapCredential)
  ) {
    return null;
  }

  const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
  return <Navigate to={`/login?redirect=${redirect}`} replace />;
};

export const appRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/home" replace /> },
  {
    path: 'login',
    element: (
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: 'home',
    element: (
      <Suspense fallback={null}>
        <RequireAuth>{isPC ? <Home /> : <HomeH5 />}</RequireAuth>
      </Suspense>
    ),
  },
  {
    path: 'room',
    element: (
      <Suspense fallback={null}>
        <RequireAuth>{isPC ? <Room /> : <RoomH5 />}</RequireAuth>
      </Suspense>
    ),
  },
];
