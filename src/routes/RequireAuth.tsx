import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { isValidReturnTo } from '../auth/returnTo';
import styles from './RequireAuth.module.css';

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <span className={styles.spinner} aria-hidden="true" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // 백엔드가 허용하는 경로(초대 링크)라면 로그인 후 돌아올 수 있게 함께 넘긴다.
    const returnTo =
      location.pathname !== '/' && isValidReturnTo(location.pathname) ? location.pathname : null;
    const to = returnTo ? `/login?${new URLSearchParams({ returnTo }).toString()}` : '/login';
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}
