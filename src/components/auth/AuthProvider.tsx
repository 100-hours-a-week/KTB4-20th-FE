import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { logout as requestLogout, refreshAccessToken } from '../../api/auth';
import { setRefreshHandler } from '../../api/client';
import { withdraw as requestWithdraw } from '../../api/users';
import { setAccessToken } from '../../api/tokenStore';
import { clearPendingInvitation } from '../../utils/pendingInvitation';
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext';

let pendingRefresh: Promise<string | null> | null = null;

/** 동시에 여러 번 호출되어도 재발급 요청은 한 번만 보냅니다. */
function refreshOnce(): Promise<string | null> {
  pendingRefresh ??= refreshAccessToken()
    .then(({ accessToken }) => {
      setAccessToken(accessToken);
      return accessToken;
    })
    .catch(() => {
      setAccessToken(null);
      return null;
    })
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
}

interface AuthProviderProps {
  children: ReactNode;
}

/** 앱 시작 시 Refresh Token 쿠키로 로그인 상태를 확인하고 하위 화면에 알려줍니다. */
export default function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const token = await refreshOnce();
      if (active) {
        setStatus(token ? 'authenticated' : 'unauthenticated');
      }
      return token;
    };

    setRefreshHandler(refresh);
    void refresh();

    return () => {
      active = false;
      setRefreshHandler(null);
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await requestLogout();
    } finally {
      setAccessToken(null);
      clearPendingInvitation();
      setStatus('unauthenticated');
    }
  }, []);

  /** 탈퇴에 실패하면 오류를 그대로 던져서 화면이 안내할 수 있게 합니다. */
  const withdraw = useCallback(async () => {
    await requestWithdraw();
    setAccessToken(null);
    clearPendingInvitation();
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, logout, withdraw }),
    [status, logout, withdraw],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
