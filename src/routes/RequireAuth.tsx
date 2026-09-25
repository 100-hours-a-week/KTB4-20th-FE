import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './RequireAuth.module.css';

export default function RequireAuth() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <span className={styles.spinner} aria-hidden="true" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
