import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser, withdrawUser, type CurrentUser } from '../api/user';
import { clearPendingInvitation } from '../utils/pendingInvitation';
import { logoutSession, refreshAccessTokenOnce } from './authSession';
import { setAccessToken } from './tokenStore';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  logout: () => Promise<void>;
  /** 회원 탈퇴. 실패하면 오류를 그대로 던져 화면이 안내할 수 있게 한다. */
  withdraw: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = await refreshAccessTokenOnce();
      if (cancelled) {
        return;
      }
      if (!token) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const currentUser = await fetchCurrentUser();
        if (cancelled) {
          return;
        }
        setUser(currentUser);
        setStatus('authenticated');
      } catch {
        if (!cancelled) {
          setStatus('unauthenticated');
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      async logout() {
        try {
          await logoutSession();
        } finally {
          // 로그인 세션이 끝나면 보관해 둔 초대 경로도 폐기한다.
          clearPendingInvitation();
          setUser(null);
          setStatus('unauthenticated');
        }
      },
      async withdraw() {
        await withdrawUser();
        setAccessToken(null);
        clearPendingInvitation();
        setUser(null);
        setStatus('unauthenticated');
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
