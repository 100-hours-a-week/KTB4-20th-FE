import { createContext } from 'react';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
