import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './RequireAuth.module.css';

/** 이미 로그인한 사용자가 로그인 화면에 들어오면 메인 화면으로 보낸다. */
export default function GuestOnly() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <span className={styles.spinner} aria-hidden="true" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
