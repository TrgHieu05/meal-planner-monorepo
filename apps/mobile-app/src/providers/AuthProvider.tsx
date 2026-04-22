import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { fetchAuthProfile } from '@features/auth/api/auth.api';
import type { AuthSession } from '@features/auth/types';

import {
  getStorageItemAsync,
  setStorageItemAsync,
} from '@/services/storage/session-storage';

const AUTH_STORAGE_KEY = 'auth.session.accessToken';

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  signInWithToken: (accessToken: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await setStorageItemAsync(AUTH_STORAGE_KEY, null);
    setSession(null);
  }, []);

  const hydrateSession = useCallback(async (accessToken: string) => {
    const user = await fetchAuthProfile({ accessToken });
    const nextSession = {
      accessToken,
      user,
    } satisfies AuthSession;

    setSession(nextSession);
    await setStorageItemAsync(AUTH_STORAGE_KEY, accessToken);

    return nextSession;
  }, []);

  const signInWithToken = useCallback(
    async (accessToken: string) => {
      return hydrateSession(accessToken.trim());
    },
    [hydrateSession],
  );

  const signOut = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshSession = useCallback(async () => {
    if (!session?.accessToken) {
      return null;
    }

    try {
      return await hydrateSession(session.accessToken);
    } catch (error) {
      await clearSession();
      throw error;
    }
  }, [clearSession, hydrateSession, session?.accessToken]);

  useEffect(() => {
    let isActive = true;

    const restoreSession = async () => {
      try {
        const storedToken = await getStorageItemAsync(AUTH_STORAGE_KEY);
        if (!storedToken) {
          if (isActive) {
            setSession(null);
          }
          return;
        }

        const restoredSession = await fetchAuthProfile({ accessToken: storedToken });
        if (!isActive) {
          return;
        }

        setSession({
          accessToken: storedToken,
          user: restoredSession,
        });
      } catch {
        await setStorageItemAsync(AUTH_STORAGE_KEY, null);
        if (isActive) {
          setSession(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  const contextValue = useMemo<AuthContextValue>(() => {
    return {
      session,
      isLoading,
      signInWithToken,
      signOut,
      refreshSession,
    };
  }, [isLoading, refreshSession, session, signInWithToken, signOut]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useSession must be used within AuthProvider');
  }

  return context;
}