import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

/** 이미 로그인한 사용자가 로그인 화면에 들어오면 메인 화면으로 보냅니다. */
export default function GuestOnly() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
