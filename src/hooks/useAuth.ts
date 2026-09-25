import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../components/auth/authContext';

/** 현재 로그인 상태를 반환합니다. `AuthProvider` 안에서만 사용할 수 있습니다. */
export default function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  }
  return context;
}
