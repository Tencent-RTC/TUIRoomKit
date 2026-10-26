import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, createSearchParams, useLocation } from 'react-router-dom';
import Login from '@/views/login/LoginView';

const HomeView = lazy(() => import('@/views/home/HomeView'));

function LoginGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!sessionStorage.getItem('tuiRoom-userInfo')) {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={{ pathname: '/login', search: `?${createSearchParams({ redirect: fullPath })}` }}
        replace
      />
    );
  }
  return children;
}

function RootRedirect() {
  const location = useLocation();
  // Vue Router keeps the query and hash of the original location on a string redirect.
  return <Navigate to={{ pathname: '/home', search: location.search, hash: location.hash }} replace />;
}

export function RouterView() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/home"
        element={(
          <LoginGuard>
            <Suspense fallback={null}>
              <HomeView />
            </Suspense>
          </LoginGuard>
        )}
      />
    </Routes>
  );
}

export function Router({ children }: { children: ReactNode }) {
  return <HashRouter>{children}</HashRouter>;
}

export default Router;
