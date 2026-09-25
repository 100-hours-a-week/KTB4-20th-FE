import { useEffect, useState } from 'react';
import { getCurrentUser, type CurrentUser } from '../api/users';

/** 로그인한 사용자 정보를 불러옵니다. */
export default function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((result) => {
        if (!active) return;
        setUser(result);
        setStatus('success');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  return { user, status };
}
