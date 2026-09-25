import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isValidReturnTo } from '../../api/auth';
import useAuth from '../../hooks/useAuth';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

/** 로그인한 사용자만 하위 화면을 볼 수 있고, 아니면 로그인 화면으로 이동합니다. */
export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'unauthenticated') {
    const loginPath =
      isValidReturnTo(location.pathname) && location.pathname !== '/'
        ? `/login?${new URLSearchParams({ returnTo: location.pathname }).toString()}`
        : '/login';
    return <Navigate to={loginPath} replace />;
  }

  return <Outlet />;
}
